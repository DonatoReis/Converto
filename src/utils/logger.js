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

/**
 * Enhanced error logging utility for Firestore errors
 * 
 * @param {string} message - Log message
 * @param {Object} [data] - The data being sent to Firestore that caused the error
 * @param {Error} [error] - Firestore error object
 */
export const logFirestoreError = (message, data, error = null) => {
  console.group("🔥 FIRESTORE ERROR DETAILS 🔥");
  console.error(`${message}`);
  
  // Log the original error
  console.error("Original error:", error);
  
  // Extract Firestore error details if available
  if (error && error.message && error.message.includes("FIRESTORE")) {
    try {
      // Extract the JSON context part if it exists
      const contextMatch = error.message.match(/CONTEXT: ({.*})/);
      if (contextMatch && contextMatch[1]) {
        const contextData = JSON.parse(contextMatch[1]);
        console.error("Firestore error context:", contextData);
        
        // Extract the nested error message
        if (contextData.ec && typeof contextData.ec === 'string') {
          console.error("Nested error:", contextData.ec);
        }
      }
    } catch (parseError) {
      console.error("Failed to parse Firestore error context", parseError);
    }
  }
  
  // Deep inspection of the data being sent to Firestore
  if (data) {
    console.group("Data inspection:");
    
    // Function to inspect object for null/undefined values
    const inspectObject = (obj, path = '') => {
      if (obj === null) {
        console.warn(`⚠️ NULL VALUE at path: ${path || 'root'}`);
        return;
      }
      
      if (obj === undefined) {
        console.warn(`⚠️ UNDEFINED VALUE at path: ${path || 'root'}`);
        return;
      }
      
      if (typeof obj !== 'object') return;
      
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          inspectObject(item, `${path}[${index}]`);
        });
        return;
      }
      
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = path ? `${path}.${key}` : key;
        
        if (value === null) {
          console.warn(`⚠️ NULL VALUE at path: ${newPath}`);
        } else if (value === undefined) {
          console.warn(`⚠️ UNDEFINED VALUE at path: ${newPath}`);
        } else if (typeof value === 'object') {
          inspectObject(value, newPath);
        }
      });
    };
    
    // Deep inspection of data being sent to Firestore
    inspectObject(data);
    console.groupEnd();
  }
  
  console.groupEnd();
  
  // Also log to the regular error log system
  return log(LogLevel.ERROR, message, { error: error?.message || 'Firestore error' }, error);
};

export default {
  logDebug,
  logInfo,
  logWarning,
  logError,
  logFirestoreError
};

