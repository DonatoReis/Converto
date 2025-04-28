// src/models/MessageModel.js
/**
 * Standard message format for the application
 * @typedef {Object} MessageModel
 * @property {string} id - Unique identifier for the message
 * @property {string} content - The actual text content of the message
 * @property {string} sender - ID of the sender
 * @property {string} time - Formatted time string (HH:MM)
 * @property {string} timestamp - ISO datetime string
 * @property {string} [type="text"] - Message type (text, audio, etc)
 * @property {number} [duration] - Duration in seconds (for audio messages)
 */

/**
 * Creates a standardized message object
 * @param {Object} messageData - Raw message data
 * @returns {MessageModel} Standardized message object
 */
export const createMessage = (messageData) => {
  // Extract content string if it's an object with content property
  let standardContent = messageData.content;
  if (typeof messageData.content === 'object' && messageData.content !== null) {
    standardContent = messageData.content.content || '';
  }

  return {
    id: messageData.id || `msg_${Date.now()}`,
    content: standardContent,
    sender: messageData.sender || 'user',
    time: messageData.time || new Date().toLocaleTimeString().slice(0, 5),
    timestamp: messageData.timestamp || new Date().toISOString(),
    type: messageData.type || 'text',
    ...(messageData.duration && { duration: messageData.duration }),
  };
};

/**
 * Standardizes message from different sources
 * @param {Object|string} message - Message in any format
 * @returns {Object} Standardized message
 */
export const standardizeMessage = (message) => {
  if (typeof message === 'string') {
    return createMessage({ content: message });
  }
  return createMessage(message);
};

export default {
  createMessage,
  standardizeMessage
};

