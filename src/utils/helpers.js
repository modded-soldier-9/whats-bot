const fs = require('fs-extra');
const path = require('path');

/**
 * Helper utility functions
 * Common utility functions used across the application
 */
class Helpers {
    /**
     * Ensure directory exists, create if it doesn't
     * @param {string} dirPath - Directory path
     */
    static async ensureDir(dirPath) {
        try {
            await fs.ensureDir(dirPath);
        } catch (error) {
            throw new Error(`Failed to create directory ${dirPath}: ${error.message}`);
        }
    }

    /**
     * Generate unique conversation ID from contact
     * @param {string} contactId - WhatsApp contact ID
     * @returns {string} Unique conversation ID
     */
    static generateConversationId(contactId) {
        // Remove @c.us suffix and sanitize
        return contactId.replace('@c.us', '').replace(/[^a-zA-Z0-9]/g, '_');
    }

    /**
     * Check if message is from a group
     * @param {Object} message - WhatsApp message object
     * @returns {boolean} True if message is from group
     */
    static isGroupMessage(message) {
        return message.from.includes('@g.us');
    }

    /**
     * Check if message is from bot itself
     * @param {Object} message - WhatsApp message object
     * @param {string} botNumber - Bot's phone number
     * @returns {boolean} True if message is from bot
     */
    static isFromBot(message, botNumber) {
        return message.from === `${botNumber}@c.us`;
    }

    /**
     * Extract contact number from WhatsApp ID
     * @param {string} whatsappId - WhatsApp contact ID
     * @returns {string} Phone number
     */
    static extractPhoneNumber(whatsappId) {
        return whatsappId.replace('@c.us', '').replace('@g.us', '');
    }

    /**
     * Format message for logging
     * @param {Object} message - WhatsApp message object
     * @returns {Object} Formatted message object
     */
    static formatMessageForLog(message) {
        return {
            id: message.id._serialized,
            from: message.from,
            to: message.to,
            body: message.body?.substring(0, 100) + (message.body?.length > 100 ? '...' : ''),
            timestamp: message.timestamp,
            type: message.type
        };
    }

    /**
     * Sleep for specified milliseconds
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise} Promise that resolves after delay
     */
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    static truncateText(text, maxLength) {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength - 3) + '...';
    }

    /**
     * Check if text contains command
     * @param {string} text - Text to check
     * @param {string} prefix - Command prefix
     * @returns {boolean} True if text is a command
     */
    static isCommand(text, prefix = '/') {
        return text && text.startsWith(prefix);
    }

    /**
     * Extract command and arguments from text
     * @param {string} text - Command text
     * @param {string} prefix - Command prefix
     * @returns {Object} Command object with name and args
     */
    static parseCommand(text, prefix = '/') {
        if (!this.isCommand(text, prefix)) {
            return { name: null, args: [] };
        }

        const parts = text.substring(prefix.length).trim().split(' ');
        return {
            name: parts[0].toLowerCase(),
            args: parts.slice(1)
        };
    }

    /**
     * Generate response cooldown key
     * @param {string} contactId - Contact ID
     * @returns {string} Cooldown key
     */
    static getCooldownKey(contactId) {
        return `cooldown_${contactId}`;
    }

    /**
     * Check if enough time has passed since last response
     * @param {Object} cooldownMap - Map of cooldown timestamps
     * @param {string} key - Cooldown key
     * @param {number} cooldownMs - Cooldown duration in milliseconds
     * @returns {boolean} True if cooldown period has passed
     */
    static isCooldownExpired(cooldownMap, key, cooldownMs) {
        const lastResponse = cooldownMap.get(key);
        if (!lastResponse) return true;
        
        return Date.now() - lastResponse >= cooldownMs;
    }

    /**
     * Update cooldown timestamp
     * @param {Object} cooldownMap - Map of cooldown timestamps
     * @param {string} key - Cooldown key
     */
    static updateCooldown(cooldownMap, key) {
        cooldownMap.set(key, Date.now());
    }

    /**
     * Clean up old cooldown entries
     * @param {Object} cooldownMap - Map of cooldown timestamps
     * @param {number} maxAge - Maximum age in milliseconds
     */
    static cleanupCooldowns(cooldownMap, maxAge = 24 * 60 * 60 * 1000) { // 24 hours
        const now = Date.now();
        for (const [key, timestamp] of cooldownMap.entries()) {
            if (now - timestamp > maxAge) {
                cooldownMap.delete(key);
            }
        }
    }
}

module.exports = Helpers;

