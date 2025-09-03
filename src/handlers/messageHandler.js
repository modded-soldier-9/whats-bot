const config = require('../utils/config');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');
const CommandHandler = require('./commandHandler');
const ResponseHandler = require('./responseHandler');
const ConversationMemory = require('../core/memory');

/**
 * Message handler for processing incoming WhatsApp messages
 * Coordinates between command handling, response generation, and memory management
 */
class MessageHandler {
  constructor() {
    this.commandHandler = new CommandHandler();
    this.responseHandler = new ResponseHandler();
    this.memory = new ConversationMemory();
    this.cooldownMap = new Map();
    this.responseFrequencyLimit = config.get(
      'filtering.responseFrequencyLimit'
    );
    this.ignoredContacts = new Set(config.get('filtering.ignoredContacts'));
    this.initialized = false;
  }

  /**
   * Initialize message handler
   */
  async initialize() {
    try {
      await this.memory.initialize();

      // Set personality loader reference in command handler
      this.commandHandler.personalityLoader =
        this.responseHandler.geminiAI.personalityLoader;

      this.initialized = true;
      logger.info('Message handler initialized successfully');
      console.log('✅ Message handler initialized');
    } catch (error) {
      logger.error('Failed to initialize message handler', {
        error: error.message,
      });
      console.error('❌ Failed to initialize message handler:', error.message);
      throw error;
    }
  }

  /**
   * Handle incoming message
   * @param {Object} message - WhatsApp message object
   */
  async handleMessage(message) {
    try {
      console.log('📨 Processing message:', {
        from: message.from,
        body:
          message.body?.substring(0, 50) +
          (message.body?.length > 50 ? '...' : ''),
        fromMe: message.fromMe,
      });

      // Skip if message is from ignored contact
      if (this.ignoredContacts.has(message.from)) {
        logger.debug('Message from ignored contact', { from: message.from });
        console.log('⏭️ Message from ignored contact');
        return;
      }

      // Skip if message is from group and groups are ignored
      if (
        Helpers.isGroupMessage(message) &&
        config.get('filtering.ignoreGroups')
      ) {
        logger.debug('Message from group (ignored)', { from: message.from });
        console.log('⏭️ Message from group (ignored)');
        return;
      }

      // Skip status broadcasts
      if (message.from === 'status@broadcast') {
        logger.debug('Message from status broadcast (ignored)', {
          from: message.from,
        });
        console.log('⏭️ Message from status broadcast (ignored)');
        return;
      }

      // Skip if message is from bot itself
      if (message.fromMe) {
        console.log('⏭️ Message from bot itself');
        return;
      }

      // Skip empty messages
      if (!message.body || message.body.trim().length === 0) {
        console.log('⏭️ Empty message (ignored)');
        return;
      }

      // Check cooldown
      const cooldownKey = Helpers.getCooldownKey(message.from);
      if (!Helpers.isCooldownExpired(this.cooldownMap, cooldownKey, 1000)) {
        logger.debug('Message ignored due to cooldown', { from: message.from });
        console.log('⏭️ Message ignored due to cooldown');
        return;
      }

      console.log('✅ Message passed all filters, processing...');

      // Add message to conversation memory
      const conversationId = Helpers.generateConversationId(message.from);
      await this.memory.addMessage(conversationId, message);

      // Check if message is a command
      const commandResponse = await this.commandHandler.processCommand(message);
      if (commandResponse) {
        console.log('🎯 Command detected, sending response...');
        await this.sendResponse(message.from, commandResponse);
        Helpers.updateCooldown(this.cooldownMap, cooldownKey);
        return;
      }

      // Check if user has responses enabled
      if (!this.commandHandler.isUserResponsesEnabled(message.from)) {
        logger.debug('Responses disabled for user', { from: message.from });
        console.log('⏭️ Responses disabled for user');
        return;
      }

      // Check response frequency limit
      if (!this.checkResponseFrequency(message.from)) {
        logger.debug('Response frequency limit reached', {
          from: message.from,
        });
        console.log('⏭️ Response frequency limit reached');
        return;
      }

      // Generate AI response
      console.log('🤖 Generating AI response...');
      const response = await this.generateAIResponse(message, conversationId);
      if (response) {
        console.log('💬 Sending AI response...');
        await this.sendResponse(message.from, response);
        Helpers.updateCooldown(this.cooldownMap, cooldownKey);
        console.log('✅ Response sent successfully!');
      } else {
        console.log('❌ No response generated');
      }
    } catch (error) {
      logger.error('Error handling message', {
        error: error.message,
        messageId: message.id._serialized,
        from: message.from,
      });
      console.error('❌ Error handling message:', error.message);
    }
  }

  /**
   * Generate AI response for message
   * @param {Object} message - WhatsApp message object
   * @param {string} conversationId - Conversation identifier
   * @returns {Promise<string|null>} AI response or null
   */
  async generateAIResponse(message, conversationId) {
    try {
      // Get conversation context
      const context = this.memory.getConversationContext(conversationId);

      // Get contact information
      const contactInfo = await this.getContactInfo(message.from);
      const contactName = contactInfo ? contactInfo.name : 'User';

      // Generate response using AI
      const response = await this.responseHandler.generateResponse(
        message.body,
        context,
        contactName
      );

      // Add bot response to conversation memory
      if (response) {
        const botMessage = {
          id: `bot_${Date.now()}`,
          from: 'bot',
          body: response,
          timestamp: Math.floor(Date.now() / 1000),
          type: 'text',
        };
        await this.memory.addMessage(conversationId, botMessage);
      }

      return response;
    } catch (error) {
      logger.error('Error generating AI response', {
        error: error.message,
        conversationId,
        messageId: message.id._serialized,
      });
      return null;
    }
  }

  /**
   * Send response to contact
   * @param {string} contactId - WhatsApp contact ID
   * @param {string} response - Response message
   */
  async sendResponse(contactId, response) {
    try {
      // Apply response delay if configured
      const delay = config.get('bot.responseDelay');
      if (delay > 0) {
        await Helpers.sleep(delay);
      }

      // Send response using the callback
      if (this.sendMessageCallback) {
        await this.sendMessageCallback(contactId, response);
      } else {
        logger.warn('No send message callback set', { contactId });
      }

      logger.message('Response sent', {
        to: contactId,
        responseLength: response.length,
      });
    } catch (error) {
      logger.error('Error sending response', {
        error: error.message,
        contactId,
        responseLength: response.length,
      });
    }
  }

  /**
   * Get contact information
   * @param {string} contactId - WhatsApp contact ID
   * @returns {Promise<Object|null>} Contact information
   */
  async getContactInfo(contactId) {
    try {
      // This will be set by the main app
      if (this.getContactInfoCallback) {
        return await this.getContactInfoCallback(contactId);
      }
      return null;
    } catch (error) {
      logger.error('Error getting contact info', {
        error: error.message,
        contactId,
      });
      return null;
    }
  }

  /**
   * Set contact info callback
   * @param {Function} callback - Callback function to get contact info
   */
  setContactInfoCallback(callback) {
    this.getContactInfoCallback = callback;
  }

  /**
   * Set send message callback
   * @param {Function} callback - Callback function to send messages
   */
  setSendMessageCallback(callback) {
    this.sendMessageCallback = callback;
  }

  /**
   * Check response frequency limit
   * @param {string} contactId - WhatsApp contact ID
   * @returns {boolean} True if within frequency limit
   */
  checkResponseFrequency(contactId) {
    const key = `frequency_${contactId}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute window

    if (!this.cooldownMap.has(key)) {
      this.cooldownMap.set(key, []);
    }

    const timestamps = this.cooldownMap.get(key);

    // Remove old timestamps outside the window
    const cutoff = now - windowMs;
    const recentTimestamps = timestamps.filter((ts) => ts > cutoff);

    // Check if within limit
    if (recentTimestamps.length >= this.responseFrequencyLimit) {
      return false;
    }

    // Add current timestamp
    recentTimestamps.push(now);
    this.cooldownMap.set(key, recentTimestamps);

    return true;
  }

  /**
   * Get message handler statistics
   * @returns {Object} Handler statistics
   */
  getStats() {
    const memoryStats = this.memory.getStats();
    const commandStats = this.commandHandler.getStats();

    return {
      memory: memoryStats,
      commands: commandStats,
      cooldownEntries: this.cooldownMap.size,
      ignoredContacts: this.ignoredContacts.size,
      responseFrequencyLimit: this.responseFrequencyLimit,
    };
  }

  /**
   * Clean up old data
   */
  async cleanup() {
    try {
      // Clean up old conversations
      await this.memory.cleanupOldConversations();

      // Clean up old cooldowns
      Helpers.cleanupCooldowns(this.cooldownMap);

      // Clean up old command settings
      this.commandHandler.cleanupOldSettings();

      logger.info('Message handler cleanup completed');
    } catch (error) {
      logger.error('Error during cleanup', { error: error.message });
    }
  }

  /**
   * Add ignored contact
   * @param {string} contactId - Contact ID to ignore
   */
  addIgnoredContact(contactId) {
    this.ignoredContacts.add(contactId);
    logger.info('Contact added to ignore list', { contactId });
  }

  /**
   * Remove ignored contact
   * @param {string} contactId - Contact ID to remove from ignore list
   */
  removeIgnoredContact(contactId) {
    this.ignoredContacts.delete(contactId);
    logger.info('Contact removed from ignore list', { contactId });
  }

  /**
   * Get ignored contacts list
   * @returns {Array} Array of ignored contact IDs
   */
  getIgnoredContacts() {
    return Array.from(this.ignoredContacts);
  }
}

module.exports = MessageHandler;
