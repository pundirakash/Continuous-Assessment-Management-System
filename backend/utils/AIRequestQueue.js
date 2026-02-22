const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * Singleton Class to manage AI API requests with global throttling and model health tracking.
 * Prevents "Rate Limit" storms by ensuring requests are spaced out and failed models are skipped.
 */
class AIRequestQueue {
    constructor() {
        this.queue = [];
        this.processing = false;
        this.lastRequestTime = 0;
        this.minInterval = 1500; // Reduced for Vercel 10s timeout (Safe but aggressive)
        this.modelHealth = new Map(); // modelName -> cooldownUntil (timestamp)
        this.keyHealth = new Map(); // keyIndex -> cooldownUntil (timestamp)

        // Load all available GEMINI_API_KEY variants
        this.apiKeys = [
            process.env.GEMINI_API_KEY,
            process.env.GEMINI_API_KEY_2,
            process.env.GEMINI_API_KEY_3,
            process.env.GEMINI_API_KEY_4
        ].filter(k => k && k.trim().length > 10).map(k => k.trim());

        this.currentKeyIndex = 0;

        if (this.apiKeys.length === 0) {
            console.error("[AIQueue] CRITICAL: No valid GEMINI_API_KEY found in environment!");
        } else {
            console.log(`[AIQueue] Initialized with ${this.apiKeys.length} API keys. Using Key #1.`);
        }

        this.initGenAI();
    }

    initGenAI() {
        if (this.apiKeys.length === 0) return;
        const key = this.apiKeys[this.currentKeyIndex];
        this.genAI = new GoogleGenerativeAI(key);
    }

    getActiveApiKey() {
        if (this.apiKeys.length === 0) return null;
        return this.apiKeys[this.currentKeyIndex];
    }

    /**
     * Switches to the next available working key.
     * @returns {boolean} True if a new key was found, false if all are exhausted.
     */
    rotateKey() {
        const startIndex = this.currentKeyIndex;
        let found = false;

        for (let i = 1; i <= this.apiKeys.length; i++) {
            const nextIndex = (startIndex + i) % this.apiKeys.length;
            const cooldown = this.keyHealth.get(nextIndex);

            if (!cooldown || cooldown < Date.now()) {
                this.currentKeyIndex = nextIndex;
                this.initGenAI();
                console.log(`[AIQueue] ROTATED to Key #${this.currentKeyIndex + 1} (Sticky).`);
                found = true;
                break;
            }
        }

        return found;
    }

    /**
     * Adds a request to the queue.
     * @param {Object} options - { prompt, systemInstruction, orderedModels, jsonMode }
     * @returns {Promise<any>} - Resolves with the AI response text/JSON
     */
    add(options) {
        return new Promise((resolve, reject) => {
            this.queue.push({ options, resolve, reject });
            this.processQueue();
        });
    }

    async processQueue() {
        if (this.processing || this.queue.length === 0) return;
        this.processing = true;

        while (this.queue.length > 0) {
            const now = Date.now();
            const timeSinceLast = now - this.lastRequestTime;

            // Throttle: Wait if too soon
            if (timeSinceLast < this.minInterval) {
                await new Promise(r => setTimeout(r, this.minInterval - timeSinceLast));
            }

            const { options, resolve, reject } = this.queue.shift();
            this.lastRequestTime = Date.now();

            try {
                const result = await this.executeWithFailover(options);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        }

        this.processing = false;
    }

    /**
     * Tries models in order, skipping those in cooldown.
     */
    async executeWithFailover({ prompt, systemInstruction, orderedModels, jsonMode = true }) {
        let lastError = null;
        let attempted = [];

        for (const modelName of orderedModels) {
            // Check Cooldown
            const cooldown = this.modelHealth.get(modelName);
            if (cooldown && cooldown > Date.now()) {
                console.log(`[AIQueue] Skipping ${modelName} (Cooldown until ${new Date(cooldown).toLocaleTimeString()})`);
                continue;
            }

            attempted.push(modelName);
            try {
                console.log(`[AIQueue] Executing with ${modelName}...`);
                const model = this.genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction,
                    generationConfig: {
                        temperature: 0, // Strict deterministic output
                        topK: 1, // Only consider the single most probable token
                        topP: 0.1, // Clamp probability mass
                        seed: 42, // Lock the random number generator
                        responseMimeType: jsonMode ? "application/json" : "text/plain",
                        maxOutputTokens: 8192, // Max allowed to prevent JSON truncation
                    }
                });

                const result = await model.generateContent(prompt);
                console.log(`[AIQueue] Success with ${modelName}`);
                const rawText = result.response.text();

                // Validate JSON Structure if jsonMode is requested (prevents truncation from crashing app)
                if (jsonMode) {
                    try {
                        const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
                        const jsonMatch = cleanedText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
                        if (!jsonMatch) throw new Error("JSON Object/Array not found in response");
                        JSON.parse(jsonMatch[0]); // Test parse
                        return jsonMatch[0]; // Return the cleaned JSON string
                    } catch (e) {
                        throw new Error(`JSON Validation Failed (Truncated/Malformed): ${e.message}`);
                    }
                }

                // Clear cooldown if successful
                this.modelHealth.delete(modelName);
                return rawText;

            } catch (err) {
                console.warn(`[AIQueue] Failed with ${modelName}: ${err.message}`);
                lastError = err;

                const isRateLimit = err.message.includes('429') || err.message.includes('Quota');
                const isOverloaded = err.message.includes('503') || err.message.includes('Overloaded');

                // Hard Limit = Limit 0 (Exhausted per project/day)
                const isHardLimit = isRateLimit && err.message.includes('limit: 0');

                if (isOverloaded) {
                    // Just cool down the model
                    this.modelHealth.set(modelName, Date.now() + 180000); // 3m
                }

                if (isRateLimit) {
                    if (isHardLimit) {
                        console.warn(`[AIQueue] Key #${this.currentKeyIndex + 1} exhausted (Limit 0).`);
                        // Cool down this KEY specifically for 15 minutes
                        this.keyHealth.set(this.currentKeyIndex, Date.now() + 15 * 60000);

                        // Attempt to switch keys and retry THIS request
                        if (this.rotateKey()) {
                            console.log(`[AIQueue] Successfully switched keys. Retrying request...`);
                            return await this.executeWithFailover({ prompt, systemInstruction, orderedModels, jsonMode });
                        }
                    } else {
                        // Regular rate limit (per minute). Just cool down the model.
                        this.modelHealth.set(modelName, Date.now() + 180000); // 3m
                    }
                }
                // If it was a JSON validation error, we DO NOT cooldown the model, we just let the loop continue to the next model (or retry if logic permits).
            }
        }

        throw new Error(`AI Request failed after trying: ${attempted.join(', ')}. Last error: ${lastError?.message}`);
    }
}

// Export as Singleton
module.exports = new AIRequestQueue();
