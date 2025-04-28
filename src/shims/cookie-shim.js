/**
 * Shim for the cookie module
 * 
 * This shim re-exports the functions from the cookie module in a way that works with ESM imports
 */

// Import the original cookie module (this will be handled by the Node.js module resolution)
import * as cookieLib from 'cookie-es';

// Re-export the functions
export const parse = cookieLib.parse;
export const serialize = cookieLib.serialize;

// Default export for compatibility
export default {
  parse,
  serialize
};

