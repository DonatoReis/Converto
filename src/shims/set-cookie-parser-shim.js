/**
 * Shim for the set-cookie-parser module
 * 
 * This shim re-exports the functions from set-cookie-parser-es to ensure compatibility
 * with ESM imports.
 */

import * as setCookieParserLib from 'set-cookie-parser-es';

// Export the splitCookiesString function which is specifically used by react-router
export const splitCookiesString = setCookieParserLib.splitCookiesString;

// Export other functions for compatibility
export const parse = setCookieParserLib.parse;
export const parseString = setCookieParserLib.parseString;

// Default export for compatibility
export default {
  parse,
  parseString,
  splitCookiesString
};

