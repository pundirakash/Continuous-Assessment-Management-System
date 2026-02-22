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
        this.minInterval = 4000; // Minimum 4s between requests to be safe
        this.modelHealth = new Map(); // modelName -> cooldownUntil (timestamp)
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
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

                if (isRateLimit || isOverloaded) {
                    // Set Cooldown: 3m
                    const cooldownUntil = Date.now() + 180000; // 3 minutes
                    this.modelHealth.set(modelName, cooldownUntil);
                    console.warn(`[AIQueue] Marking ${modelName} for 3m cooldown.`);
                }
                // If it was a JSON validation error, we DO NOT cooldown the model, we just let the loop continue to the next model (or retry if logic permits).
            }
        }

        throw new Error(`AI Request failed after trying: ${attempted.join(', ')}. Last error: ${lastError?.message}`);
    }
}

// Export as Singleton
module.exports = new AIRequestQueue();
