const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../utils/config');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');

/**
 * WhatsApp Web integration
 * Handles WhatsApp connection, session management, and message events
 */
class WhatsAppClient {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.sessionPath = config.get('whatsapp.sessionPath');
    this.qrCodeDisplay = config.get('whatsapp.qrCodeDisplay');
    this.sessionTimeout = config.get('whatsapp.sessionTimeout');
    this.messageHandlers = [];
    this.initialize();
  }

  /**
   * Initialize WhatsApp client
   */
  initialize() {
    try {
      this.client = new Client({
        authStrategy: new LocalAuth({
          clientId: 'whatsai-bot',
          dataPath: this.sessionPath,
        }),
        puppeteer: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu',
          ],
        },
        webVersionCache: {
          type: 'remote',
          remotePath:
            'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html',
        },
      });

      this.setupEventHandlers();
      logger.info('WhatsApp client initialized');
    } catch (error) {
      logger.error('Failed to initialize WhatsApp client', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Setup WhatsApp event handlers
   */
  setupEventHandlers() {
    // QR Code generation
    this.client.on('qr', (qr) => {
      logger.whatsapp('QR code generated');
      if (this.qrCodeDisplay) {
        console.log('\n📱 WhatsApp QR Code:');
        qrcode.generate(qr, { small: true });
        console.log('\nScan the QR code above with your WhatsApp mobile app\n');
      }
    });

    // Client ready
    this.client.on('ready', () => {
      this.isReady = true;
      const info = this.client.info;
      logger.whatsapp('Client ready', {
        name: info.pushname,
        wid: info.wid._serialized,
        platform: info.platform,
      });
      console.log(`✅ WhatsApp bot is ready! Logged in as: ${info.pushname}`);
      console.log('💬 Bot is now listening for messages...');
    });

    // Authentication success
    this.client.on('authenticated', (session) => {
      logger.whatsapp('Authentication successful', {
        sessionExists: !!session,
      });
      console.log('✅ WhatsApp authentication successful! Session saved.');
    });

    // Authentication failure
    this.client.on('auth_failure', (msg) => {
      logger.error('WhatsApp authentication failed', { message: msg });
      console.log('❌ WhatsApp authentication failed:', msg);
    });

    // Client disconnected
    this.client.on('disconnected', (reason) => {
      this.isReady = false;
      logger.whatsapp('Client disconnected', { reason });
      console.log(`⚠️ WhatsApp client disconnected: ${reason}`);
    });

    // Message received
    this.client.on('message', async (message) => {
      try {
        await this.handleIncomingMessage(message);
      } catch (error) {
        logger.error('Error handling incoming message', {
          error: error.message,
          messageId: message.id._serialized,
        });
      }
    });

    // Message creation (sent messages)
    this.client.on('message_create', (message) => {
      // Log sent messages for debugging
      if (message.fromMe) {
        logger.debug('Message sent', Helpers.formatMessageForLog(message));
      }
    });

    // Session timeout
    if (this.sessionTimeout > 0) {
      setInterval(() => {
        if (this.isReady) {
          this.client
            .getState()
            .then((state) => {
              if (state !== 'CONNECTED') {
                logger.warn('Session timeout detected, reconnecting...');
                this.reconnect();
              }
            })
            .catch(() => {
              logger.warn('Session check failed, reconnecting...');
              this.reconnect();
            });
        }
      }, this.sessionTimeout);
    }
  }

  /**
   * Handle incoming message
   * @param {Object} message - WhatsApp message object
   */
  async handleIncomingMessage(message) {
    try {
      // Skip if message is from bot itself
      if (message.fromMe) {
        return;
      }

      // Skip if message is from group and groups are ignored
      if (
        Helpers.isGroupMessage(message) &&
        config.get('filtering.ignoreGroups')
      ) {
        return;
      }

      // Log incoming message
      logger.message('Message received', Helpers.formatMessageForLog(message));

      // Notify all registered message handlers
      for (const handler of this.messageHandlers) {
        try {
          await handler(message);
        } catch (error) {
          logger.error('Error in message handler', {
            error: error.message,
            handler: handler.name || 'anonymous',
          });
        }
      }
    } catch (error) {
      logger.error('Error in handleIncomingMessage', {
        error: error.message,
        messageId: message.id._serialized,
      });
    }
  }

  /**
   * Register message handler
   * @param {Function} handler - Message handler function
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
    logger.debug('Message handler registered', {
      handlerCount: this.messageHandlers.length,
    });
  }

  /**
   * Send message to contact
   * @param {string} contactId - WhatsApp contact ID
   * @param {string} message - Message to send
   * @returns {Promise<Object>} Sent message object
   */
  async sendMessage(contactId, message) {
    try {
      if (!this.isReady) {
        throw new Error('WhatsApp client is not ready');
      }

      const sentMessage = await this.client.sendMessage(contactId, message);

      logger.message('Message sent', {
        to: contactId,
        messageId: sentMessage.id._serialized,
        messageLength: message.length,
      });

      return sentMessage;
    } catch (error) {
      logger.error('Failed to send message', {
        error: error.message,
        contactId,
        messageLength: message.length,
      });
      throw error;
    }
  }

  /**
   * Get contact information
   * @param {string} contactId - WhatsApp contact ID
   * @returns {Promise<Object>} Contact information
   */
  async getContactInfo(contactId) {
    try {
      const contact = await this.client.getContactById(contactId);
      return {
        id: contact.id._serialized,
        name: contact.name || contact.pushname || 'Unknown',
        number: contact.number,
        isGroup: contact.isGroup,
        isUser: contact.isUser,
        isWAContact: contact.isWAContact,
      };
    } catch (error) {
      logger.error('Failed to get contact info', {
        error: error.message,
        contactId,
      });
      return null;
    }
  }

  /**
   * Get client state
   * @returns {Promise<string>} Client state
   */
  async getState() {
    try {
      return await this.client.getState();
    } catch (error) {
      logger.error('Failed to get client state', { error: error.message });
      return 'UNKNOWN';
    }
  }

  /**
   * Get client info
   * @returns {Object} Client information
   */
  getInfo() {
    if (!this.isReady || !this.client.info) {
      return null;
    }

    return {
      name: this.client.info.pushname,
      wid: this.client.info.wid._serialized,
      platform: this.client.info.platform,
      isReady: this.isReady,
    };
  }

  /**
   * Start WhatsApp client
   */
  async start() {
    try {
      logger.info('Starting WhatsApp client...');
      await this.client.initialize();
    } catch (error) {
      logger.error('Failed to start WhatsApp client', { error: error.message });
      throw error;
    }
  }

  /**
   * Stop WhatsApp client
   */
  async stop() {
    try {
      if (this.client) {
        await this.client.destroy();
        this.isReady = false;
        logger.info('WhatsApp client stopped');
      }
    } catch (error) {
      logger.error('Failed to stop WhatsApp client', { error: error.message });
    }
  }

  /**
   * Reconnect WhatsApp client
   */
  async reconnect() {
    try {
      logger.info('Reconnecting WhatsApp client...');
      await this.stop();
      await Helpers.sleep(2000); // Wait 2 seconds
      await this.start();
    } catch (error) {
      logger.error('Failed to reconnect WhatsApp client', {
        error: error.message,
      });
    }
  }

  /**
   * Check if client is ready
   * @returns {boolean} True if client is ready
   */
  isClientReady() {
    return this.isReady;
  }

  /**
   * Get session statistics
   * @returns {Object} Session statistics
   */
  getStats() {
    return {
      isReady: this.isReady,
      messageHandlers: this.messageHandlers.length,
      sessionPath: this.sessionPath,
      info: this.getInfo(),
    };
  }
}

module.exports = WhatsAppClient;
