const config = require('../utils/config');
const logger = require('../utils/logger');
const Helpers = require('../utils/helpers');

/**
 * Command handler for bot commands
 * Processes and responds to bot commands like /help, /status, etc.
 */
class CommandHandler {
  constructor() {
    this.prefix = config.get('commands.prefix');
    this.enabled = config.get('commands.enabled');
    this.availableCommands = config.get('commands.availableCommands');
    this.personalityLoader = null; // Will be set by message handler
    this.userSettings = new Map(); // Store user preferences
    this.commands = this.initializeCommands();
  }

  /**
   * Initialize available commands
   * @returns {Object} Commands object with handlers
   */
  initializeCommands() {
    return {
      help: this.handleHelp.bind(this),
      status: this.handleStatus.bind(this),
      stop: this.handleStop.bind(this),
      start: this.handleStart.bind(this),
      info: this.handleInfo.bind(this),
      personalities: this.handlePersonalities.bind(this),
    };
  }

  /**
   * Process command if message is a command
   * @param {Object} message - WhatsApp message object
   * @returns {Promise<string|null>} Command response or null if not a command
   */
  async processCommand(message) {
    try {
      if (!this.enabled || !message.body) {
        return null;
      }

      const command = Helpers.parseCommand(message.body, this.prefix);
      if (!command.name) {
        return null;
      }

      if (!this.availableCommands.includes(command.name)) {
        return `❌ Unknown command: ${command.name}\nType ${this.prefix}help to see available commands.`;
      }

      if (!this.commands[command.name]) {
        return `❌ Command ${command.name} is not implemented yet.`;
      }

      logger.info('Command processed', {
        command: command.name,
        args: command.args,
        from: message.from,
      });

      return await this.commands[command.name](message, command.args);
    } catch (error) {
      logger.error('Error processing command', {
        error: error.message,
        message: message.body,
      });
      return '❌ An error occurred while processing your command.';
    }
  }

  /**
   * Handle /help command
   * @param {Object} message - WhatsApp message object
   * @param {Array} args - Command arguments
   * @returns {string} Help response
   */
  async handleHelp(_message, _args) {
    const helpText = `🤖 *WhatsApp AI Bot Commands*

${this.prefix}help - Show this help message
${this.prefix}status - Check bot status and information
${this.prefix}stop - Disable auto-responses for you
${this.prefix}start - Enable auto-responses for you
${this.prefix}info - Show bot configuration and personality
${this.prefix}personalities - List available personality profiles

*Usage:*
Just send any message and I'll respond with AI! Use commands to control my behavior.

*Note:* I only respond to direct messages, not group chats.`;

    return helpText;
  }

  /**
   * Handle /status command
   * @param {Object} message - WhatsApp message object
   * @param {Array} args - Command arguments
   * @returns {string} Status response
   */
  async handleStatus(message, _args) {
    const userSettings = this.getUserSettings(message.from);
    const status = userSettings.responsesEnabled ? '✅ Enabled' : '❌ Disabled';
    const personality =
      config.get('bot.personality') === 'custom'
        ? 'Custom (Your Style)'
        : config.get('bot.personality');

    return `🤖 *Bot Status*

*Your Settings:*
• Auto-responses: ${status}
• Personality: ${personality}

*Bot Info:*
• Commands: ${this.enabled ? '✅ Enabled' : '❌ Disabled'}
• Max response length: ${config.get('bot.maxResponseLength')} characters
• Response delay: ${config.get('bot.responseDelay')}ms

I'm ready to chat! Send me any message and I'll respond with AI.`;
  }

  /**
   * Handle /stop command
   * @param {Object} message - WhatsApp message object
   * @param {Array} args - Command arguments
   * @returns {string} Stop response
   */
  async handleStop(message, _args) {
    this.setUserSettings(message.from, { responsesEnabled: false });

    logger.info('User disabled responses', { from: message.from });

    return `✅ *Auto-responses disabled*

I won't respond to your messages anymore. Use ${this.prefix}start to re-enable responses.

You can still use commands like ${this.prefix}help and ${this.prefix}status.`;
  }

  /**
   * Handle /start command
   * @param {Object} message - WhatsApp message object
   * @param {Array} args - Command arguments
   * @returns {string} Start response
   */
  async handleStart(message, _args) {
    this.setUserSettings(message.from, { responsesEnabled: true });

    logger.info('User enabled responses', { from: message.from });

    const personality =
      config.get('bot.personality') === 'custom'
        ? 'Custom (Your Style)'
        : config.get('bot.personality');

    return `✅ *Auto-responses enabled*

I'll now respond to your messages with AI! 

*Current personality:* ${personality}
*Max response length:* ${config.get('bot.maxResponseLength')} characters

Send me any message and I'll respond naturally. Use ${this.prefix}help for more commands.`;
  }

  /**
   * Handle /info command
   * @param {Object} message - WhatsApp message object
   * @param {Array} args - Command arguments
   * @returns {string} Info response
   */
  async handleInfo(message, _args) {
    const userSettings = this.getUserSettings(message.from);
    const personality =
      config.get('bot.personality') === 'custom'
        ? 'Custom (Your Style)'
        : config.get('bot.personality');

    return `🤖 *Bot Information*

*Configuration:*
• Personality: ${personality}
• Auto-responses: ${config.get('bot.autoResponsesEnabled') ? '✅ Enabled' : '❌ Disabled'}
• Response delay: ${config.get('bot.responseDelay')}ms
• Max response length: ${config.get('bot.maxResponseLength')} characters

*Your Settings:*
• Responses: ${userSettings.responsesEnabled ? '✅ Enabled' : '❌ Disabled'}

*Features:*
• AI-powered responses using Google Gemini
• Conversation memory and context
• Persistent WhatsApp sessions
• Command system
• Token optimization
• Custom personality matching your style

*Note:* I remember our conversation history to provide better responses!`;
  }

  /**
   * Handle /personalities command
   * @param {Object} message - WhatsApp message object
   * @param {Array} args - Command arguments
   * @returns {string} Personalities response
   */
  async handlePersonalities(_message, _args) {
    if (!this.personalityLoader) {
      return '❌ Personality system not available.';
    }

    const personalities = this.personalityLoader.getAllPersonalities();
    const currentPersonality = config.get('bot.personality');

    let response = '🎭 *Available Personalities*\n\n';

    personalities.forEach((personality) => {
      const isCurrent = personality.name === currentPersonality ? ' ✅' : '';
      response += `• *${personality.displayName}*${isCurrent}\n`;
      response += `  ${personality.description}\n\n`;
    });

    response += `*Current:* ${currentPersonality}\n`;
    response += `*Note:* Personality can be changed in config files.`;

    return response;
  }

  /**
   * Check if user has responses enabled
   * @param {string} contactId - WhatsApp contact ID
   * @returns {boolean} True if responses are enabled
   */
  isUserResponsesEnabled(contactId) {
    const settings = this.getUserSettings(contactId);
    return settings.responsesEnabled;
  }

  /**
   * Get user settings
   * @param {string} contactId - WhatsApp contact ID
   * @returns {Object} User settings
   */
  getUserSettings(contactId) {
    if (!this.userSettings.has(contactId)) {
      this.userSettings.set(contactId, {
        responsesEnabled: config.get('bot.autoResponsesEnabled'),
        lastCommand: null,
        commandCount: 0,
      });
    }
    return this.userSettings.get(contactId);
  }

  /**
   * Set user settings
   * @param {string} contactId - WhatsApp contact ID
   * @param {Object} settings - Settings to update
   */
  setUserSettings(contactId, settings) {
    const currentSettings = this.getUserSettings(contactId);
    const updatedSettings = { ...currentSettings, ...settings };
    this.userSettings.set(contactId, updatedSettings);
  }

  /**
   * Get command statistics
   * @returns {Object} Command statistics
   */
  getStats() {
    const totalUsers = this.userSettings.size;
    const enabledUsers = Array.from(this.userSettings.values()).filter(
      (settings) => settings.responsesEnabled
    ).length;
    const disabledUsers = totalUsers - enabledUsers;

    return {
      totalUsers,
      enabledUsers,
      disabledUsers,
      availableCommands: this.availableCommands.length,
      commandsEnabled: this.enabled,
    };
  }

  /**
   * Clean up old user settings
   * @param {number} maxAge - Maximum age in milliseconds
   */
  cleanupOldSettings(maxAge = 7 * 24 * 60 * 60 * 1000) {
    // 7 days
    const now = Date.now();
    const toDelete = [];

    for (const [contactId, settings] of this.userSettings.entries()) {
      if (settings.lastCommand && now - settings.lastCommand > maxAge) {
        toDelete.push(contactId);
      }
    }

    for (const contactId of toDelete) {
      this.userSettings.delete(contactId);
    }

    if (toDelete.length > 0) {
      logger.info(`Cleaned up ${toDelete.length} old user settings`);
    }
  }
}

module.exports = CommandHandler;
