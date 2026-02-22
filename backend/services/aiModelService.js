const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const CACHE_PATH = path.join(__dirname, '../cache/model_cache.json');
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Preference order for models
// Priority: Speed and Reliability (Free Tier Friendly)
// Priority: Speed and Reliability (Adjusted for user-specific availability)
const PREFERRED_MODELS = [
    'gemini-1.5-flash-8b',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
    'gemini-2.5-flash',
    'gemini-flash-latest',
    'gemini-2.0-flash-lite',
    'gemini-1.5-pro'
];

/**
 * Service to manage AI models, handling caching and fallback logic.
 */
class AIModelService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    }

    /**
     * Fetches available models from Gemini API or cache.
     * @param {boolean} forceRefresh - If true, skips cache and fetches live data.
     * @returns {Promise<Array>} List of supported model names.
     */
    async getAvailableModels(forceRefresh = false) {
        try {
            // Check cache first (unless forced refresh)
            if (!forceRefresh && fs.existsSync(CACHE_PATH)) {
                const cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
                if (Date.now() - cache.timestamp < CACHE_TTL) {
                    console.log('[AIModelService] Using cached model list');
                    return cache.models;
                }
            }

            // Refresh cache
            console.log('[AIModelService] Refreshing model list from Gemini...');
            const modelListResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
            const data = await modelListResponse.json();

            if (!data.models) {
                throw new Error('Failed to fetch models: ' + JSON.stringify(data));
            }

            // Filter for models that support generateContent
            const models = data.models
                .filter(m => m.supportedGenerationMethods.includes('generateContent'))
                .map(m => m.name.replace('models/', ''));

            // Ensure cache directory exists
            const cacheDir = path.dirname(CACHE_PATH);
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }

            fs.writeFileSync(CACHE_PATH, JSON.stringify({
                timestamp: Date.now(),
                models
            }, null, 2));

            return models;
        } catch (error) {
            console.error('[AIModelService] Failed to fetch models:', error.message);
            // Fallback to cache if available, even if expired
            if (fs.existsSync(CACHE_PATH)) {
                return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8')).models;
            }
            return PREFERRED_MODELS; // Final hardcoded fallback
        }
    }

    /**
     * Returns available models sorted by preference.
     * @returns {Promise<Array>} Ordered list of models.
     */
    async getOrderedModels(forceRefresh = false) {
        const available = await this.getAvailableModels(forceRefresh);

        if (forceRefresh) {
            console.log(`[AIModelService] Live Discovery found ${available.length} models: [${available.join(', ')}]`);
        }

        // Only use models we trust for academic auditing
        const ordered = PREFERRED_MODELS.filter(m => available.includes(m));

        // If no preferred models available, we pick the most capable alternatives
        if (ordered.length === 0) {
            const capableOthers = available.filter(m =>
                (m.includes('flash') || m.includes('pro')) &&
                !m.includes('robotics') &&
                !m.includes('nano') &&
                !m.includes('preview-tts')
            );
            return capableOthers.slice(0, 5); // Return top 5 capable alternatives
        }

        return ordered;
    }
}

module.exports = new AIModelService();
