const config = require('../utils/config');
const logger = require('../utils/logger');
const GeminiAI = require('../core/gemini');

/**
 * Response handler for generating AI responses
 * Coordinates with Gemini AI to generate contextual responses
 */
class ResponseHandler {
    constructor() {
        this.geminiAI = new GeminiAI();
        this.maxResponseLength = config.get('bot.maxResponseLength');
        this.responseDelay = config.get('bot.responseDelay');
    }

    /**
     * Generate AI response for a message
     * @param {string} message - User message
     * @param {Object} context - Conversation context
     * @param {string} contactName - Contact name for personalization
     * @returns {Promise<string>} AI generated response
     */
    async generateResponse(message, context, contactName) {
        try {
            logger.info('Generating AI response', { 
                messageLength: message.length,
                hasContext: !!context.messages?.length,
                contactName
            });

            // Generate response using Gemini AI
            const response = await this.geminiAI.generateResponse(message, context, contactName);

            // Validate and clean response
            const cleanedResponse = this.cleanResponse(response);

            logger.info('AI response generated', { 
                originalLength: response.length,
                cleanedLength: cleanedResponse.length,
                contactName
            });

            return cleanedResponse;
        } catch (error) {
            logger.error('Error generating AI response', { 
                error: error.message,
                message: message.substring(0, 100),
                contactName
            });

            // Return fallback response
            return this.getFallbackResponse();
        }
    }

    /**
     * Clean and validate AI response
     * @param {string} response - Raw AI response
     * @returns {string} Cleaned response
     */
    cleanResponse(response) {
        if (!response || typeof response !== 'string') {
            return this.getFallbackResponse();
        }

        // Remove excessive whitespace
        let cleaned = response.trim();

        // Remove any potential harmful content or formatting issues
        cleaned = cleaned.replace(/```[\s\S]*?```/g, ''); // Remove code blocks
        cleaned = cleaned.replace(/`[^`]*`/g, ''); // Remove inline code
        cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove bold formatting
        cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1'); // Remove italic formatting
        cleaned = cleaned.replace(/#{1,6}\s+/g, ''); // Remove markdown headers

        // Truncate if too long
        if (cleaned.length > this.maxResponseLength) {
            cleaned = cleaned.substring(0, this.maxResponseLength - 3) + '...';
        }

        // Ensure response is not empty
        if (!cleaned || cleaned.length < 3) {
            return this.getFallbackResponse();
        }

        return cleaned;
    }

    /**
     * Get fallback response when AI fails
     * @returns {string} Fallback response
     */
    getFallbackResponse() {
        const fallbacks = [
            "I'm sorry, I'm having trouble processing your message right now. Please try again in a moment.",
            "I apologize, but I'm experiencing some technical difficulties. Could you please rephrase your question?",
            "I'm having trouble understanding that right now. Could you try asking in a different way?",
            "I'm sorry, I'm not able to respond properly at the moment. Please try again later.",
            "I'm experiencing some issues right now. Please give me a moment and try again."
        ];

        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    /**
     * Test AI response generation
     * @param {string} testMessage - Test message
     * @returns {Promise<Object>} Test result
     */
    async testResponse(testMessage = "Hello, this is a test message.") {
        try {
            const startTime = Date.now();
            const response = await this.generateResponse(testMessage, {}, 'TestUser');
            const endTime = Date.now();

            return {
                success: true,
                response,
                responseTime: endTime - startTime,
                responseLength: response.length
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                responseTime: 0,
                responseLength: 0
            };
        }
    }

    /**
     * Get response handler statistics
     * @returns {Object} Handler statistics
     */
    getStats() {
        return {
            maxResponseLength: this.maxResponseLength,
            responseDelay: this.responseDelay,
            geminiInfo: this.geminiAI.getModelInfo()
        };
    }

    /**
     * Update response settings
     * @param {Object} settings - New settings
     */
    updateSettings(settings) {
        if (settings.maxResponseLength) {
            this.maxResponseLength = settings.maxResponseLength;
            this.geminiAI.updateMaxResponseLength(settings.maxResponseLength);
        }

        if (settings.personality) {
            this.geminiAI.updatePersonality(settings.personality);
        }

        if (settings.responseDelay !== undefined) {
            this.responseDelay = settings.responseDelay;
        }

        logger.info('Response handler settings updated', settings);
    }

    /**
     * Test Gemini AI connection
     * @returns {Promise<boolean>} True if connection is working
     */
    async testConnection() {
        try {
            return await this.geminiAI.testConnection();
        } catch (error) {
            logger.error('Gemini AI connection test failed', { error: error.message });
            return false;
        }
    }

    /**
     * Get available personalities
     * @returns {Array} Array of available personalities
     */
    getAvailablePersonalities() {
        return ['friendly', 'professional', 'casual', 'humorous', 'neutral'];
    }

    /**
     * Set personality
     * @param {string} personality - Personality to set
     * @returns {boolean} True if personality was set successfully
     */
    setPersonality(personality) {
        const availablePersonalities = this.getAvailablePersonalities();
        if (!availablePersonalities.includes(personality)) {
            logger.warn('Invalid personality specified', { personality, available: availablePersonalities });
            return false;
        }

        this.geminiAI.updatePersonality(personality);
        logger.info('Personality updated', { personality });
        return true;
    }

    /**
     * Get current personality
     * @returns {string} Current personality
     */
    getCurrentPersonality() {
        return this.geminiAI.personality;
    }
}

module.exports = ResponseHandler;

