const winston = require('winston');
const path = require('path');
const config = require('./config');

/**
 * Logger utility using Winston
 * Provides structured logging with different levels and file rotation
 */
class Logger {
  constructor() {
    this.logger = this.createLogger();
  }

  /**
   * Create Winston logger instance
   * @returns {winston.Logger} Configured logger instance
   */
  createLogger() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss',
      }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss',
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
      })
    );

    return winston.createLogger({
      level: config.get('logging.level'),
      format: logFormat,
      defaultMeta: { service: 'whatsai-bot' },
      transports: [
        // Console transport
        new winston.transports.Console({
          format: consoleFormat,
        }),
        // File transport for errors
        new winston.transports.File({
          filename: path.join(config.get('logging.logPath'), 'error.log'),
          level: 'error',
          maxsize: this.parseSize(config.get('logging.fileMaxSize')),
          maxFiles: config.get('logging.fileMaxFiles'),
        }),
        // File transport for all logs
        new winston.transports.File({
          filename: path.join(config.get('logging.logPath'), 'combined.log'),
          maxsize: this.parseSize(config.get('logging.fileMaxSize')),
          maxFiles: config.get('logging.fileMaxFiles'),
        }),
      ],
    });
  }

  /**
   * Parse size string to bytes
   * @param {string} sizeStr - Size string like "10m", "1g"
   * @returns {number} Size in bytes
   */
  parseSize(sizeStr) {
    const units = { b: 1, k: 1024, m: 1024 * 1024, g: 1024 * 1024 * 1024 };
    const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)([bkmg]?)$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB

    const size = parseFloat(match[1]);
    const unit = match[2] || 'b';
    return Math.floor(size * units[unit]);
  }

  /**
   * Log info message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  info(message, meta = {}) {
    this.logger.info(message, meta);
  }

  /**
   * Log warning message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  warn(message, meta = {}) {
    this.logger.warn(message, meta);
  }

  /**
   * Log error message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  error(message, meta = {}) {
    this.logger.error(message, meta);
  }

  /**
   * Log debug message
   * @param {string} message - Log message
   * @param {Object} meta - Additional metadata
   */
  debug(message, meta = {}) {
    this.logger.debug(message, meta);
  }

  /**
   * Log WhatsApp specific events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  whatsapp(event, data = {}) {
    this.info(`WhatsApp: ${event}`, { type: 'whatsapp', ...data });
  }

  /**
   * Log Gemini AI specific events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  gemini(event, data = {}) {
    this.info(`Gemini: ${event}`, { type: 'gemini', ...data });
  }

  /**
   * Log message processing events
   * @param {string} event - Event type
   * @param {Object} data - Event data
   */
  message(event, data = {}) {
    this.info(`Message: ${event}`, { type: 'message', ...data });
  }
}

module.exports = new Logger();
