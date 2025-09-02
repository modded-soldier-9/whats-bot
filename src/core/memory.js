const fs = require('fs-extra');
const path = require('path');
const config = require('../utils/config');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');

/**
 * Conversation memory management
 * Handles storing, retrieving, and optimizing conversation history
 */
class ConversationMemory {
    constructor() {
        this.conversationPath = config.get('memory.conversationPath');
        this.maxContextMessages = config.get('memory.maxContextMessages');
        this.summarizationThreshold = config.get('memory.summarizationThreshold');
        this.conversations = new Map(); // In-memory cache
        this.summaries = new Map(); // Conversation summaries
    }

    /**
     * Initialize conversation memory
     */
    async initialize() {
        try {
            await Helpers.ensureDir(this.conversationPath);
            await this.loadExistingConversations();
            logger.info('Conversation memory initialized');
        } catch (error) {
            logger.error('Failed to initialize conversation memory', { error: error.message });
            throw error;
        }
    }

    /**
     * Load existing conversations from disk
     */
    async loadExistingConversations() {
        try {
            const files = await fs.readdir(this.conversationPath);
            const conversationFiles = files.filter(file => file.endsWith('.json'));

            for (const file of conversationFiles) {
                const conversationId = file.replace('.json', '');
                const filePath = path.join(this.conversationPath, file);
                const conversation = await fs.readJson(filePath);
                
                this.conversations.set(conversationId, conversation);
                
                // Load summary if exists
                const summaryFile = path.join(this.conversationPath, `${conversationId}_summary.json`);
                if (await fs.pathExists(summaryFile)) {
                    const summary = await fs.readJson(summaryFile);
                    this.summaries.set(conversationId, summary);
                }
            }

            logger.info(`Loaded ${conversationFiles.length} existing conversations`);
        } catch (error) {
            logger.warn('Failed to load existing conversations', { error: error.message });
        }
    }

    /**
     * Add message to conversation
     * @param {string} conversationId - Unique conversation identifier
     * @param {Object} message - Message object
     */
    async addMessage(conversationId, message) {
        try {
            if (!this.conversations.has(conversationId)) {
                this.conversations.set(conversationId, {
                    id: conversationId,
                    messages: [],
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                });
            }

            const conversation = this.conversations.get(conversationId);
            conversation.messages.push({
                id: message.id,
                from: message.from,
                body: message.body,
                timestamp: message.timestamp,
                type: message.type,
                addedAt: Date.now()
            });
            conversation.updatedAt = Date.now();

            // Save to disk
            await this.saveConversation(conversationId);

            // Check if summarization is needed
            if (conversation.messages.length >= this.summarizationThreshold) {
                await this.summarizeConversation(conversationId);
            }

            logger.debug('Message added to conversation', { 
                conversationId, 
                messageCount: conversation.messages.length 
            });
        } catch (error) {
            logger.error('Failed to add message to conversation', { 
                conversationId, 
                error: error.message 
            });
        }
    }

    /**
     * Get conversation context for AI response
     * @param {string} conversationId - Conversation identifier
     * @param {number} maxMessages - Maximum messages to return
     * @returns {Object} Conversation context with messages and summary
     */
    getConversationContext(conversationId, maxMessages = null) {
        const conversation = this.conversations.get(conversationId);
        if (!conversation) {
            return { messages: [], summary: null };
        }

        const limit = maxMessages || this.maxContextMessages;
        const recentMessages = conversation.messages.slice(-limit);
        const summary = this.summaries.get(conversationId);

        return {
            messages: recentMessages,
            summary: summary,
            totalMessages: conversation.messages.length
        };
    }

    /**
     * Summarize conversation to reduce token usage
     * @param {string} conversationId - Conversation identifier
     */
    async summarizeConversation(conversationId) {
        try {
            const conversation = this.conversations.get(conversationId);
            if (!conversation || conversation.messages.length < this.summarizationThreshold) {
                return;
            }

            // Create summary of older messages
            const messagesToSummarize = conversation.messages.slice(0, -this.maxContextMessages);
            const recentMessages = conversation.messages.slice(-this.maxContextMessages);

            const summary = {
                conversationId,
                messageCount: messagesToSummarize.length,
                timeRange: {
                    start: messagesToSummarize[0]?.timestamp,
                    end: messagesToSummarize[messagesToSummarize.length - 1]?.timestamp
                },
                keyTopics: this.extractKeyTopics(messagesToSummarize),
                createdAt: Date.now()
            };

            this.summaries.set(conversationId, summary);

            // Keep only recent messages in memory
            conversation.messages = recentMessages;

            // Save summary to disk
            await this.saveSummary(conversationId, summary);

            logger.info('Conversation summarized', { 
                conversationId, 
                summarizedMessages: messagesToSummarize.length,
                remainingMessages: recentMessages.length
            });
        } catch (error) {
            logger.error('Failed to summarize conversation', { 
                conversationId, 
                error: error.message 
            });
        }
    }

    /**
     * Extract key topics from messages for summary
     * @param {Array} messages - Messages to analyze
     * @returns {Array} Array of key topics
     */
    extractKeyTopics(messages) {
        // Simple keyword extraction - can be enhanced with NLP
        const wordCount = {};
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);

        messages.forEach(message => {
            if (message.body) {
                const words = message.body.toLowerCase()
                    .replace(/[^\w\s]/g, '')
                    .split(/\s+/)
                    .filter(word => word.length > 2 && !stopWords.has(word));

                words.forEach(word => {
                    wordCount[word] = (wordCount[word] || 0) + 1;
                });
            }
        });

        return Object.entries(wordCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([word]) => word);
    }

    /**
     * Save conversation to disk
     * @param {string} conversationId - Conversation identifier
     */
    async saveConversation(conversationId) {
        try {
            const conversation = this.conversations.get(conversationId);
            if (!conversation) return;

            const filePath = path.join(this.conversationPath, `${conversationId}.json`);
            await fs.writeJson(filePath, conversation, { spaces: 2 });
        } catch (error) {
            logger.error('Failed to save conversation', { 
                conversationId, 
                error: error.message 
            });
        }
    }

    /**
     * Save conversation summary to disk
     * @param {string} conversationId - Conversation identifier
     * @param {Object} summary - Summary object
     */
    async saveSummary(conversationId, summary) {
        try {
            const filePath = path.join(this.conversationPath, `${conversationId}_summary.json`);
            await fs.writeJson(filePath, summary, { spaces: 2 });
        } catch (error) {
            logger.error('Failed to save conversation summary', { 
                conversationId, 
                error: error.message 
            });
        }
    }

    /**
     * Get conversation statistics
     * @returns {Object} Statistics about conversations
     */
    getStats() {
        const totalConversations = this.conversations.size;
        const totalMessages = Array.from(this.conversations.values())
            .reduce((sum, conv) => sum + conv.messages.length, 0);
        const totalSummaries = this.summaries.size;

        return {
            totalConversations,
            totalMessages,
            totalSummaries,
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Clean up old conversations
     * @param {number} maxAge - Maximum age in milliseconds
     */
    async cleanupOldConversations(maxAge = 30 * 24 * 60 * 60 * 1000) { // 30 days
        try {
            const now = Date.now();
            const toDelete = [];

            for (const [conversationId, conversation] of this.conversations.entries()) {
                if (now - conversation.updatedAt > maxAge) {
                    toDelete.push(conversationId);
                }
            }

            for (const conversationId of toDelete) {
                await this.deleteConversation(conversationId);
            }

            if (toDelete.length > 0) {
                logger.info(`Cleaned up ${toDelete.length} old conversations`);
            }
        } catch (error) {
            logger.error('Failed to cleanup old conversations', { error: error.message });
        }
    }

    /**
     * Delete conversation and its files
     * @param {string} conversationId - Conversation identifier
     */
    async deleteConversation(conversationId) {
        try {
            // Remove from memory
            this.conversations.delete(conversationId);
            this.summaries.delete(conversationId);

            // Remove files
            const conversationFile = path.join(this.conversationPath, `${conversationId}.json`);
            const summaryFile = path.join(this.conversationPath, `${conversationId}_summary.json`);

            await Promise.all([
                fs.remove(conversationFile).catch(() => {}),
                fs.remove(summaryFile).catch(() => {})
            ]);

            logger.debug('Conversation deleted', { conversationId });
        } catch (error) {
            logger.error('Failed to delete conversation', { 
                conversationId, 
                error: error.message 
            });
        }
    }
}

module.exports = ConversationMemory;

