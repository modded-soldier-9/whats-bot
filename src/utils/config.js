const fs = require('fs-extra');
const path = require('path');
require('dotenv').config();

/**
 * Configuration management utility
 * Loads configuration from environment variables and default config file
 */
class Config {
    constructor() {
        this.config = this.loadConfig();
    }

    /**
     * Load configuration from default.json and environment variables
     * @returns {Object} Merged configuration object
     */
    loadConfig() {
        try {
            // Load default configuration
            const defaultConfigPath = path.join(__dirname, '../../config/default.json');
            const defaultConfig = fs.readJsonSync(defaultConfigPath);

            // Override with environment variables
            const envConfig = {
                gemini: {
                    apiKey: process.env.GEMINI_API_KEY
                },
                bot: {
                    personality: process.env.BOT_PERSONALITY || defaultConfig.bot.personality,
                    responseDelay: parseInt(process.env.RESPONSE_DELAY) || defaultConfig.bot.responseDelay,
                    maxResponseLength: parseInt(process.env.MAX_RESPONSE_LENGTH) || defaultConfig.bot.maxResponseLength,
                    autoResponsesEnabled: process.env.AUTO_RESPONSES_ENABLED === 'true' || defaultConfig.bot.autoResponsesEnabled
                },
                whatsapp: {
                    sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || defaultConfig.whatsapp.sessionTimeout,
                    qrCodeDisplay: process.env.QR_CODE_DISPLAY === 'true' || defaultConfig.whatsapp.qrCodeDisplay,
                    sessionPath: defaultConfig.whatsapp.sessionPath
                },
                logging: {
                    level: process.env.LOG_LEVEL || defaultConfig.logging.level,
                    fileMaxSize: process.env.LOG_FILE_MAX_SIZE || defaultConfig.logging.fileMaxSize,
                    fileMaxFiles: parseInt(process.env.LOG_FILE_MAX_FILES) || defaultConfig.logging.fileMaxFiles,
                    logPath: defaultConfig.logging.logPath
                },
                commands: {
                    prefix: process.env.COMMAND_PREFIX || defaultConfig.commands.prefix,
                    enabled: process.env.ENABLE_COMMANDS === 'true' || defaultConfig.commands.enabled,
                    availableCommands: defaultConfig.commands.availableCommands
                },
                filtering: {
                    ignoreGroups: process.env.IGNORE_GROUPS === 'true' || defaultConfig.filtering.ignoreGroups,
                    responseFrequencyLimit: parseInt(process.env.RESPONSE_FREQUENCY_LIMIT) || defaultConfig.filtering.responseFrequencyLimit,
                    ignoredContacts: defaultConfig.filtering.ignoredContacts
                },
                memory: {
                    maxContextMessages: defaultConfig.memory.maxContextMessages,
                    summarizationThreshold: defaultConfig.memory.summarizationThreshold,
                    conversationPath: defaultConfig.memory.conversationPath
                }
            };

            return envConfig;
        } catch (error) {
            console.error('Error loading configuration:', error);
            throw new Error('Failed to load configuration');
        }
    }

    /**
     * Get configuration value by key path
     * @param {string} keyPath - Dot notation path to config value
     * @returns {*} Configuration value
     */
    get(keyPath) {
        return keyPath.split('.').reduce((obj, key) => obj?.[key], this.config);
    }

    /**
     * Get entire configuration object
     * @returns {Object} Complete configuration
     */
    getAll() {
        return this.config;
    }

    /**
     * Validate required configuration
     * @throws {Error} If required configuration is missing
     */
    validate() {
        if (!this.get('gemini.apiKey')) {
            throw new Error('GEMINI_API_KEY is required in environment variables');
        }
    }
}

module.exports = new Config();

