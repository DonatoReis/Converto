// src/utils/logger.js
/**
 * Logging levels
 */
const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

/**
 * Whether we're in development mode
 */
const isDev = process.env.NODE_ENV !== 'production';

/**
 * Log a message with context data
 * 
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 * @param {Error} [error] - Error object
 */
const log = (level, message, data = {}, error = null) => {
  // Format timestamp
  const timestamp = new Date().toISOString();
  
  // Create log payload
  const logPayload = {
    timestamp,
    level,
    message,
    ...data
  };
  
  // In development, log to console
  if (isDev) {
    const consoleMethod = level === LogLevel.ERROR ? 'error' 
      : level === LogLevel.WARN ? 'warn'
      : level === LogLevel.INFO ? 'info'
      : 'debug';
    
    console[consoleMethod](`[${timestamp}] ${level.toUpperCase()}: ${message}`, data);
    
    if (error) {
      console.error(error);
    }
  }
  
  // In production, we would send logs to a service like Sentry, LogRocket, etc.
  if (!isDev) {
    // This would be an API call to your logging service
    // Example: sendToLoggingService(logPayload);
    
    // For now, still log errors to console in production
    if (level === LogLevel.ERROR) {
      console.error(`[${timestamp}] ERROR: ${message}`);
      if (error) console.error(error);
    }
  }
  
  return logPayload;
};

/**
 * Log a debug message
 * 
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
export const logDebug = (message, data = {}) => {
  return log(LogLevel.DEBUG, message, data);
};

/**
 * Log an info message
 * 
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
export const logInfo = (message, data = {}) => {
  return log(LogLevel.INFO, message, data);
};

/**
 * Log a warning message
 * 
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
export const logWarning = (message, data = {}) => {
  return log(LogLevel.WARN, message, data);
};

/**
 * Log an error message
 * 
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 * @param {Error} [error] - Error object
 */
export const logError = (message, data = {}, error = null) => {
  return log(LogLevel.ERROR, message, data, error);
};

export default {
  logDebug,
  logInfo,
  logWarning,
  logError
};

