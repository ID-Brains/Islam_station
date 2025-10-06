/**
 * Logger Utility - Centralized logging system
 *
 * Features:
 * - Log levels (debug, info, warn, error)
 * - Environment-aware (development vs production)
 * - Structured logging
 * - Performance timing
 * - No PII logging
 * - Optional remote logging integration
 */

class Logger {
  constructor() {
    this.levels = {
      DEBUG: 0,
      INFO: 1,
      WARN: 2,
      ERROR: 3,
      NONE: 4,
    };

    // Set log level based on environment
    this.currentLevel = this.getEnvironmentLogLevel();

    // Enable/disable logging
    this.enabled = true;

    // Store for remote logging
    this.logBuffer = [];
    this.maxBufferSize = 100;

    // Performance timers
    this.timers = new Map();
  }

  /**
   * Get log level based on environment
   * @returns {number}
   */
  getEnvironmentLogLevel() {
    if (typeof window === 'undefined') {
      // SSR environment
      return this.levels.INFO;
    }

    // Check environment variables
    if (import.meta.env?.MODE === 'production') {
      return this.levels.WARN;
    }

    if (import.meta.env?.MODE === 'development') {
      return this.levels.DEBUG;
    }

    // Default to INFO
    return this.levels.INFO;
  }

  /**
   * Check if log level should be output
   * @param {number} level
   * @returns {boolean}
   */
  shouldLog(level) {
    return this.enabled && level >= this.currentLevel;
  }

  /**
   * Format log message with metadata
   * @param {string} level
   * @param {Array} args
   * @returns {Object}
   */
  formatLogEntry(level, args) {
    const timestamp = new Date().toISOString();
    const message = args[0];
    const data = args.slice(1);

    return {
      timestamp,
      level,
      message,
      data: data.length > 0 ? data : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
    };
  }

  /**
   * Add to buffer for remote logging
   * @param {Object} entry
   */
  addToBuffer(entry) {
    this.logBuffer.push(entry);

    // Keep buffer size manageable
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }
  }

  /**
   * Sanitize data to remove PII
   * @param {*} data
   * @returns {*}
   */
  sanitize(data) {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    // Create a copy
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    // List of keys that might contain PII
    const piiKeys = [
      'password',
      'token',
      'apiKey',
      'api_key',
      'secret',
      'ssn',
      'creditCard',
      'credit_card',
      'email',
      'phone',
      'phoneNumber',
      'phone_number',
    ];

    // Recursively sanitize
    for (const key in sanitized) {
      if (piiKeys.some(piiKey => key.toLowerCase().includes(piiKey.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Debug level log
   * @param {...any} args
   */
  debug(...args) {
    if (!this.shouldLog(this.levels.DEBUG)) return;

    const entry = this.formatLogEntry('DEBUG', args);

    if (typeof console !== 'undefined' && console.debug) {
      console.debug(`[DEBUG] ${entry.timestamp}:`, ...args);
    }

    this.addToBuffer(entry);
  }

  /**
   * Info level log
   * @param {...any} args
   */
  info(...args) {
    if (!this.shouldLog(this.levels.INFO)) return;

    const entry = this.formatLogEntry('INFO', args);

    if (typeof console !== 'undefined' && console.info) {
      console.info(`[INFO] ${entry.timestamp}:`, ...args);
    }

    this.addToBuffer(entry);
  }

  /**
   * Warn level log
   * @param {...any} args
   */
  warn(...args) {
    if (!this.shouldLog(this.levels.WARN)) return;

    const entry = this.formatLogEntry('WARN', args);

    if (typeof console !== 'undefined' && console.warn) {
      console.warn(`[WARN] ${entry.timestamp}:`, ...args);
    }

    this.addToBuffer(entry);
  }

  /**
   * Error level log
   * @param {...any} args
   */
  error(...args) {
    if (!this.shouldLog(this.levels.ERROR)) return;

    const entry = this.formatLogEntry('ERROR', args);

    // Sanitize error data
    const sanitizedEntry = {
      ...entry,
      data: entry.data ? this.sanitize(entry.data) : undefined,
    };

    if (typeof console !== 'undefined' && console.error) {
      console.error(`[ERROR] ${entry.timestamp}:`, ...args);
    }

    this.addToBuffer(sanitizedEntry);

    // In production, you might want to send errors to a service like Sentry
    if (import.meta.env?.MODE === 'production') {
      this.sendToRemote(sanitizedEntry);
    }
  }

  /**
   * Log with custom level
   * @param {string} level
   * @param {...any} args
   */
  log(level, ...args) {
    const levelValue = this.levels[level.toUpperCase()] ?? this.levels.INFO;

    if (!this.shouldLog(levelValue)) return;

    const entry = this.formatLogEntry(level.toUpperCase(), args);

    if (typeof console !== 'undefined' && console.log) {
      console.log(`[${level.toUpperCase()}] ${entry.timestamp}:`, ...args);
    }

    this.addToBuffer(entry);
  }

  /**
   * Start a performance timer
   * @param {string} label
   */
  time(label) {
    this.timers.set(label, performance.now());
  }

  /**
   * End a performance timer and log the duration
   * @param {string} label
   */
  timeEnd(label) {
    if (!this.timers.has(label)) {
      this.warn(`Timer "${label}" does not exist`);
      return;
    }

    const startTime = this.timers.get(label);
    const duration = performance.now() - startTime;
    this.timers.delete(label);

    this.debug(`Timer "${label}": ${duration.toFixed(2)}ms`);
    return duration;
  }

  /**
   * Log with grouping (for related logs)
   * @param {string} label
   */
  group(label) {
    if (typeof console !== 'undefined' && console.group) {
      console.group(label);
    }
  }

  /**
   * End log grouping
   */
  groupEnd() {
    if (typeof console !== 'undefined' && console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * Log a table (useful for arrays of objects)
   * @param {Array|Object} data
   */
  table(data) {
    if (!this.shouldLog(this.levels.DEBUG)) return;

    if (typeof console !== 'undefined' && console.table) {
      console.table(data);
    }
  }

  /**
   * Assert condition and log error if false
   * @param {boolean} condition
   * @param {...any} args
   */
  assert(condition, ...args) {
    if (!condition) {
      this.error('Assertion failed:', ...args);
    }
  }

  /**
   * Send log to remote service
   * @param {Object} entry
   */
  async sendToRemote(entry) {
    // Implement remote logging here
    // Example: Send to Sentry, LogRocket, or custom endpoint

    // For now, just a placeholder
    try {
      // Example implementation:
      // await fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry),
      // });
    } catch (error) {
      // Silently fail - don't let logging errors break the app
      if (typeof console !== 'undefined' && console.error) {
        console.error('Failed to send log to remote:', error);
      }
    }
  }

  /**
   * Get all buffered logs
   * @returns {Array}
   */
  getBuffer() {
    return [...this.logBuffer];
  }

  /**
   * Clear log buffer
   */
  clearBuffer() {
    this.logBuffer = [];
  }

  /**
   * Set log level
   * @param {string} level - 'DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE'
   */
  setLevel(level) {
    const levelValue = this.levels[level.toUpperCase()];
    if (levelValue !== undefined) {
      this.currentLevel = levelValue;
      this.info(`Log level set to: ${level.toUpperCase()}`);
    } else {
      this.warn(`Invalid log level: ${level}`);
    }
  }

  /**
   * Enable logging
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable logging
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Get current log level name
   * @returns {string}
   */
  getCurrentLevel() {
    const levelName = Object.keys(this.levels).find(
      key => this.levels[key] === this.currentLevel
    );
    return levelName || 'UNKNOWN';
  }
}

// Create singleton instance
const logger = new Logger();

// Export singleton and class
export default logger;
export { Logger };
