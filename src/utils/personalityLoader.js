const fs = require('fs-extra');
const path = require('path');
const logger = require('./logger');

/**
 * Personality loader utility
 * Loads personality profiles from JSON files
 */
class PersonalityLoader {
  constructor() {
    this.personalitiesPath = path.join(process.cwd(), 'personalities');
    this.personalities = new Map();
    this.defaultPersonality = 'neutral';
  }

  /**
   * Initialize personality loader
   */
  async initialize() {
    try {
      await this.loadPersonalities();
      logger.info('Personality loader initialized', {
        loadedPersonalities: Array.from(this.personalities.keys()),
      });
    } catch (error) {
      logger.error('Failed to initialize personality loader', {
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Load all personality files
   */
  async loadPersonalities() {
    try {
      if (!(await fs.pathExists(this.personalitiesPath))) {
        logger.warn('Personalities directory does not exist', {
          path: this.personalitiesPath,
        });
        return;
      }

      const files = await fs.readdir(this.personalitiesPath);
      const personalityFiles = files.filter((file) => file.endsWith('.json'));

      for (const file of personalityFiles) {
        try {
          const filePath = path.join(this.personalitiesPath, file);
          const personality = await fs.readJson(filePath);

          // Validate personality structure
          if (this.validatePersonality(personality)) {
            this.personalities.set(personality.name, personality);
            logger.debug('Loaded personality', { name: personality.name });
          } else {
            logger.warn('Invalid personality file', {
              file,
              errors: this.getValidationErrors(personality),
            });
          }
        } catch (error) {
          logger.error('Failed to load personality file', {
            file,
            error: error.message,
          });
        }
      }

      if (this.personalities.size === 0) {
        logger.warn('No valid personalities loaded');
      }
    } catch (error) {
      logger.error('Failed to load personalities', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate personality structure
   * @param {Object} personality - Personality object to validate
   * @returns {boolean} True if valid
   */
  validatePersonality(personality) {
    const requiredFields = ['name', 'displayName', 'description', 'prompt'];

    for (const field of requiredFields) {
      if (!personality[field] || typeof personality[field] !== 'string') {
        return false;
      }
    }

    // Validate optional fields with defaults
    if (
      personality.maxResponseLength &&
      typeof personality.maxResponseLength !== 'number'
    ) {
      return false;
    }

    if (
      personality.responseDelay &&
      typeof personality.responseDelay !== 'number'
    ) {
      return false;
    }

    return true;
  }

  /**
   * Get validation errors for a personality
   * @param {Object} personality - Personality object to validate
   * @returns {Array} Array of validation errors
   */
  getValidationErrors(personality) {
    const errors = [];
    const requiredFields = ['name', 'displayName', 'description', 'prompt'];

    for (const field of requiredFields) {
      if (!personality[field] || typeof personality[field] !== 'string') {
        errors.push(`Missing or invalid field: ${field}`);
      }
    }

    return errors;
  }

  /**
   * Get personality by name
   * @param {string} name - Personality name
   * @returns {Object|null} Personality object or null if not found
   */
  getPersonality(name) {
    return (
      this.personalities.get(name) ||
      this.personalities.get(this.defaultPersonality)
    );
  }

  /**
   * Get all available personalities
   * @returns {Array} Array of personality objects
   */
  getAllPersonalities() {
    return Array.from(this.personalities.values());
  }

  /**
   * Get personality names
   * @returns {Array} Array of personality names
   */
  getPersonalityNames() {
    return Array.from(this.personalities.keys());
  }

  /**
   * Check if personality exists
   * @param {string} name - Personality name
   * @returns {boolean} True if exists
   */
  hasPersonality(name) {
    return this.personalities.has(name);
  }

  /**
   * Reload personalities from files
   */
  async reloadPersonalities() {
    this.personalities.clear();
    await this.loadPersonalities();
    logger.info('Personalities reloaded');
  }

  /**
   * Get personality prompt
   * @param {string} name - Personality name
   * @returns {string} Personality prompt
   */
  getPersonalityPrompt(name) {
    const personality = this.getPersonality(name);
    return personality ? personality.prompt : '';
  }

  /**
   * Get personality settings
   * @param {string} name - Personality name
   * @returns {Object} Personality settings
   */
  getPersonalitySettings(name) {
    const personality = this.getPersonality(name);
    if (!personality) {
      return {
        maxResponseLength: 500,
        responseDelay: 0,
        languageSupport: { english: true, arabic: false },
      };
    }

    return {
      maxResponseLength: personality.maxResponseLength || 500,
      responseDelay: personality.responseDelay || 0,
      languageSupport: personality.languageSupport || {
        english: true,
        arabic: false,
      },
      slang: personality.slang || {},
      emojis: personality.emojis || {},
    };
  }

  /**
   * Get language instruction for personality
   * @param {string} name - Personality name
   * @param {string} message - User message
   * @returns {string} Language instruction
   */
  getLanguageInstruction(name, message) {
    const personality = this.getPersonality(name);
    if (!personality || !personality.languageSupport) {
      return 'Respond in English.';
    }

    // Check if message contains Arabic script
    const hasArabic = /[\u0600-\u06FF]/.test(message);

    if (hasArabic && personality.languageSupport.arabic) {
      return (
        personality.languageSupport.arabicInstruction ||
        'The user wrote in Arabic. Respond in Arabic using the same style.'
      );
    }

    return 'Respond in English using the style described above.';
  }
}

module.exports = PersonalityLoader;
