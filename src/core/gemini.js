const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../utils/config');
const logger = require('../utils/logger');
const PersonalityLoader = require('../utils/personalityLoader');

/**
 * Gemini AI integration
 * Handles AI response generation using Google's Gemini API
 */
class GeminiAI {
    constructor() {
        this.apiKey = config.get('gemini.apiKey');
        this.personality = config.get('bot.personality');
        this.maxResponseLength = config.get('bot.maxResponseLength');
        this.genAI = null;
        this.model = null;
        this.personalityLoader = new PersonalityLoader();
        this.initialize();
    }

    /**
     * Initialize Gemini AI client
     */
    async initialize() {
        try {
            if (!this.apiKey) {
                throw new Error('Gemini API key is required');
            }

            this.genAI = new GoogleGenerativeAI(this.apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            
            // Initialize personality loader
            await this.personalityLoader.initialize();
            
            logger.info('Gemini AI initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Gemini AI', { error: error.message });
            throw error;
        }
    }

    /**
     * Generate AI response for a message
     * @param {string} message - User message
     * @param {Object} context - Conversation context
     * @param {string} contactName - Contact name for personalization
     * @returns {Promise<string>} AI generated response
     */
    async generateResponse(message, context = {}, contactName = 'User') {
        try {
            const prompt = this.buildPrompt(message, context, contactName);
            
            logger.gemini('Generating response', { 
                messageLength: message.length,
                hasContext: !!context.messages?.length,
                hasSummary: !!context.summary
            });

            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            // Truncate response if too long
            const finalResponse = text.length > this.maxResponseLength 
                ? text.substring(0, this.maxResponseLength - 3) + '...'
                : text;

            logger.gemini('Response generated', { 
                responseLength: finalResponse.length,
                originalLength: text.length
            });

            return finalResponse;
        } catch (error) {
            logger.error('Failed to generate AI response', { 
                error: error.message,
                message: message.substring(0, 100)
            });
            
            // Return fallback response
            return this.getFallbackResponse();
        }
    }

    /**
     * Build prompt for Gemini AI
     * @param {string} message - User message
     * @param {Object} context - Conversation context
     * @param {string} contactName - Contact name
     * @returns {string} Formatted prompt
     */
    buildPrompt(message, context, contactName) {
        const personalityPrompt = this.getPersonalityPrompt();
        const contextPrompt = this.buildContextPrompt(context);
        const languageInstruction = this.getLanguageInstruction(message);
        
        return `${personalityPrompt}

${contextPrompt}

Current message from ${contactName}: "${message}"

${languageInstruction}

Please respond naturally and helpfully. Keep your response concise and relevant.`;
    }

    /**
     * Get personality prompt based on configuration
     * @returns {string} Personality prompt
     */
    getPersonalityPrompt() {
        return this.personalityLoader.getPersonalityPrompt(this.personality);
    }

    /**
     * Get language instruction based on message content
     * @param {string} message - User message
     * @returns {string} Language instruction
     */
    getLanguageInstruction(message) {
        return this.personalityLoader.getLanguageInstruction(this.personality, message);
    }

    /**
     * Build context prompt from conversation history
     * @param {Object} context - Conversation context
     * @returns {string} Context prompt
     */
    buildContextPrompt(context) {
        let contextPrompt = '';

        // Add conversation summary if available
        if (context.summary) {
            contextPrompt += `Previous conversation summary (${context.summary.messageCount} messages):\n`;
            contextPrompt += `Key topics discussed: ${context.summary.keyTopics.join(', ')}\n`;
            contextPrompt += `Time period: ${new Date(context.summary.timeRange.start).toLocaleString()} to ${new Date(context.summary.timeRange.end).toLocaleString()}\n\n`;
        }

        // Add recent messages if available
        if (context.messages && context.messages.length > 0) {
            contextPrompt += 'Recent conversation:\n';
            context.messages.forEach(msg => {
                const sender = msg.from.includes('@c.us') ? 'User' : 'Assistant';
                const timestamp = new Date(msg.timestamp * 1000).toLocaleTimeString();
                contextPrompt += `[${timestamp}] ${sender}: ${msg.body}\n`;
            });
            contextPrompt += '\n';
        }

        return contextPrompt;
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
            "I'm sorry, I'm not able to respond properly at the moment. Please try again later."
        ];

        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    /**
     * Test Gemini AI connection
     * @returns {Promise<boolean>} True if connection is working
     */
    async testConnection() {
        try {
            const testMessage = "Hello, this is a test message.";
            const response = await this.generateResponse(testMessage);
            
            logger.info('Gemini AI connection test successful', { 
                responseLength: response.length 
            });
            
            return true;
        } catch (error) {
            logger.error('Gemini AI connection test failed', { 
                error: error.message 
            });
            
            return false;
        }
    }

    /**
     * Get AI model information
     * @returns {Object} Model information
     */
    getModelInfo() {
        return {
            model: 'gemini-1.5-flash',
            personality: this.personality,
            maxResponseLength: this.maxResponseLength,
            apiKeyConfigured: !!this.apiKey
        };
    }

    /**
     * Update personality setting
     * @param {string} newPersonality - New personality setting
     */
    updatePersonality(newPersonality) {
        this.personality = newPersonality;
        logger.info('Personality updated', { newPersonality });
    }

    /**
     * Update max response length
     * @param {number} newLength - New maximum response length
     */
    updateMaxResponseLength(newLength) {
        this.maxResponseLength = newLength;
        logger.info('Max response length updated', { newLength });
    }
}

module.exports = GeminiAI;