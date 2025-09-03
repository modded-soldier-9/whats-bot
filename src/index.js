const config = require('./utils/config');
const logger = require('./utils/logger');
const WhatsAppClient = require('./core/whatsapp');
const MessageHandler = require('./handlers/messageHandler');
const Helpers = require('./utils/helpers');

/**
 * WhatsApp AI Bot Main Application
 * Entry point for the WhatsApp AI bot using Gemini AI
 */
class WhatsAppAIBot {
  constructor() {
    this.whatsappClient = null;
    this.messageHandler = null;
    this.isRunning = false;
    this.cleanupInterval = null;
  }

  /**
   * Initialize the bot
   */
  async initialize() {
    try {
      logger.info('Initializing WhatsApp AI Bot...');
      console.log('🚀 Initializing WhatsApp AI Bot...');

      // Validate configuration
      config.validate();
      console.log('✅ Configuration validated');

      // Initialize WhatsApp client
      this.whatsappClient = new WhatsAppClient();
      console.log('✅ WhatsApp client initialized');

      // Initialize message handler (this will initialize Gemini AI with personality loader)
      this.messageHandler = new MessageHandler();
      await this.messageHandler.initialize();
      console.log('✅ Message handler initialized');

      // Set up message handler callbacks
      this.messageHandler.setContactInfoCallback(
        this.getContactInfo.bind(this)
      );
      this.messageHandler.setSendMessageCallback(this.sendMessage.bind(this));
      console.log('✅ Callbacks set up');

      // Register message handler with WhatsApp client
      this.whatsappClient.onMessage(
        this.messageHandler.handleMessage.bind(this.messageHandler)
      );
      console.log('✅ Message handler registered');

      logger.info('WhatsApp AI Bot initialized successfully');
      console.log('✅ WhatsApp AI Bot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp AI Bot', {
        error: error.message,
      });
      console.error('❌ Failed to initialize WhatsApp AI Bot:', error.message);
      throw error;
    }
  }

  /**
   * Start the bot
   */
  async start() {
    try {
      if (this.isRunning) {
        logger.warn('Bot is already running');
        return;
      }

      logger.info('Starting WhatsApp AI Bot...');

      // Start WhatsApp client
      await this.whatsappClient.start();

      // Set up cleanup interval
      this.setupCleanupInterval();

      this.isRunning = true;

      logger.info('WhatsApp AI Bot started successfully');
      console.log('🚀 WhatsApp AI Bot is now running!');
      console.log(
        '📱 Scan the QR code when it appears to connect your WhatsApp account'
      );
      console.log('💬 Send messages to your bot to start chatting!');
      console.log('⚙️  Use /help command to see available commands');
      console.log('🛑 Press Ctrl+C to stop the bot\n');
    } catch (error) {
      logger.error('Failed to start WhatsApp AI Bot', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop the bot
   */
  async stop() {
    try {
      if (!this.isRunning) {
        logger.warn('Bot is not running');
        return;
      }

      logger.info('Stopping WhatsApp AI Bot...');

      // Clear cleanup interval
      if (this.cleanupInterval) {
        clearInterval(this.cleanupInterval);
        this.cleanupInterval = null;
      }

      // Stop WhatsApp client
      if (this.whatsappClient) {
        await this.whatsappClient.stop();
      }

      // Cleanup message handler
      if (this.messageHandler) {
        await this.messageHandler.cleanup();
      }

      this.isRunning = false;

      logger.info('WhatsApp AI Bot stopped successfully');
      console.log('🛑 WhatsApp AI Bot has been stopped');
    } catch (error) {
      logger.error('Error stopping WhatsApp AI Bot', { error: error.message });
    }
  }

  /**
   * Get contact information
   * @param {string} contactId - WhatsApp contact ID
   * @returns {Promise<Object|null>} Contact information
   */
  async getContactInfo(contactId) {
    try {
      if (!this.whatsappClient || !this.whatsappClient.isClientReady()) {
        return null;
      }

      return await this.whatsappClient.getContactInfo(contactId);
    } catch (error) {
      logger.error('Error getting contact info', {
        error: error.message,
        contactId,
      });
      return null;
    }
  }

  /**
   * Send message to contact
   * @param {string} contactId - WhatsApp contact ID
   * @param {string} message - Message to send
   */
  async sendMessage(contactId, message) {
    try {
      if (!this.whatsappClient || !this.whatsappClient.isClientReady()) {
        logger.warn('WhatsApp client not ready, cannot send message', {
          contactId,
        });
        return;
      }

      await this.whatsappClient.sendMessage(contactId, message);
    } catch (error) {
      logger.error('Error sending message', {
        error: error.message,
        contactId,
        messageLength: message.length,
      });
    }
  }

  /**
   * Setup cleanup interval for periodic maintenance
   */
  setupCleanupInterval() {
    // Run cleanup every hour
    this.cleanupInterval = setInterval(
      async () => {
        try {
          await this.performCleanup();
        } catch (error) {
          logger.error('Error during cleanup', { error: error.message });
        }
      },
      60 * 60 * 1000
    ); // 1 hour
  }

  /**
   * Perform periodic cleanup
   */
  async performCleanup() {
    try {
      logger.info('Performing periodic cleanup...');

      if (this.messageHandler) {
        await this.messageHandler.cleanup();
      }

      logger.info('Periodic cleanup completed');
    } catch (error) {
      logger.error('Error during periodic cleanup', { error: error.message });
    }
  }

  /**
   * Get bot statistics
   * @returns {Object} Bot statistics
   */
  getStats() {
    const whatsappStats = this.whatsappClient
      ? this.whatsappClient.getStats()
      : null;
    const messageStats = this.messageHandler
      ? this.messageHandler.getStats()
      : null;

    return {
      isRunning: this.isRunning,
      whatsapp: whatsappStats,
      messageHandler: messageStats,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
    };
  }

  /**
   * Handle graceful shutdown
   */
  async handleShutdown() {
    console.log('\n🛑 Shutting down WhatsApp AI Bot...');

    try {
      await this.stop();
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error: error.message });
      process.exit(1);
    }
  }
}

// Create bot instance
const bot = new WhatsAppAIBot();

// Handle process signals for graceful shutdown
process.on('SIGINT', () => bot.handleShutdown());
process.on('SIGTERM', () => bot.handleShutdown());

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', {
    error: error.message,
    stack: error.stack,
  });
  bot.handleShutdown();
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled promise rejection', { reason, promise });
  bot.handleShutdown();
});

// Start the bot
async function main() {
  try {
    await bot.initialize();
    await bot.start();
  } catch (error) {
    logger.error('Failed to start bot', { error: error.message });
    console.error('❌ Failed to start WhatsApp AI Bot:', error.message);
    process.exit(1);
  }
}

// Run the bot
if (require.main === module) {
  main();
}

module.exports = WhatsAppAIBot;
