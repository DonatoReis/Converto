// src/utils/twoFactorAuth.js
/**
 * Two-factor authentication utility module for implementing TOTP (Time-based One-Time Password)
 * authentication. This module provides functions to generate 2FA secrets, validate codes,
 * and manage user 2FA settings.
 */

// Import necessary crypto libraries
import Database from './database';

// Constants for TOTP
const SECRET_LENGTH = 20; // Length of the secret key in bytes
const DIGITS = 6; // Length of the OTP code
const PERIOD = 30; // Period in seconds (standard for TOTP)
const WINDOW = 1; // Time window for validation (1 step before and after current time)

/**
 * Generates a random base32 string for use as a TOTP secret
 * @returns {string} - Random base32 encoded string
 */
const generateSecret = () => {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; // Base32 charset
  let secret = '';
  
  // Generate random bytes and convert to base32
  const randomValues = new Uint8Array(SECRET_LENGTH);
  window.crypto.getRandomValues(randomValues);
  
  for (let i = 0; i < SECRET_LENGTH; i++) {
    // Map each byte to a character in the base32 charset
    const index = randomValues[i] % charset.length;
    secret += charset[index];
  }
  
  return secret;
};

/**
 * Formats a TOTP secret with spaces for easier reading
 * @param {string} secret - Raw TOTP secret
 * @returns {string} - Formatted secret with spaces every 4 characters
 */
const formatSecret = (secret) => {
  let formatted = '';
  for (let i = 0; i < secret.length; i++) {
    if (i > 0 && i % 4 === 0) {
      formatted += ' ';
    }
    formatted += secret[i];
  }
  return formatted;
};

/**
 * Generates a URI for QR codes that can be scanned by authenticator apps
 * @param {string} secret - TOTP secret
 * @param {string} account - User account identifier (e.g., email)
 * @param {string} issuer - Service provider name
 * @returns {string} - URI that can be encoded in a QR code
 */
const generateTotpUri = (secret, account, issuer = 'Mercatrix') => {
  // Remove spaces from the secret if formatted
  const cleanSecret = secret.replace(/\s/g, '');
  
  // Build the URI according to the otpauth spec
  // https://github.com/google/google-authenticator/wiki/Key-Uri-Format
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedAccount = encodeURIComponent(account);
  
  return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${cleanSecret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD}`;
};

/**
 * Calculates a TOTP code based on the secret and current time
 * @param {string} secret - TOTP secret
 * @param {number} [time] - Timestamp (defaults to current time)
 * @returns {Promise<string>} - The generated TOTP code
 */
const generateCode = async (secret, time = Math.floor(Date.now() / 1000)) => {
  try {
    // Remove spaces from the secret if formatted
    const cleanSecret = secret.replace(/\s/g, '');
    
    // Convert base32 secret to Uint8Array
    const secretBytes = base32ToBytes(cleanSecret);
    
    // Calculate the time counter (number of periods since Unix epoch)
    let counter = Math.floor(time / PERIOD);
    
    // Convert counter to byte array
    const counterBytes = new Uint8Array(8);
    for (let i = 7; i >= 0; i--) {
      counterBytes[i] = counter & 0xff;
      counter = counter >> 8;
    }
    
    // Import the secret as a HMAC key
    const key = await window.crypto.subtle.importKey(
      'raw',
      secretBytes,
      { name: 'HMAC', hash: { name: 'SHA-1' } },
      false,
      ['sign']
    );
    
    // Generate HMAC
    const signature = await window.crypto.subtle.sign(
      'HMAC',
      key,
      counterBytes
    );
    
    // Convert signature to byte array
    const signatureBytes = new Uint8Array(signature);
    
    // Get the offset
    const offset = signatureBytes[signatureBytes.length - 1] & 0xf;
    
    // Extract 4 bytes from the signature starting at the offset
    let binaryCode = ((signatureBytes[offset] & 0x7f) << 24) |
                      ((signatureBytes[offset + 1] & 0xff) << 16) |
                      ((signatureBytes[offset + 2] & 0xff) << 8) |
                      (signatureBytes[offset + 3] & 0xff);
    
    // Convert to a 6-digit code
    let code = binaryCode % Math.pow(10, DIGITS);
    code = code.toString().padStart(DIGITS, '0');
    
    return code;
  } catch (error) {
    console.error('Error generating TOTP code:', error);
    throw new Error('Failed to generate TOTP code');
  }
};

/**
 * Helper function to convert base32 to bytes
 * @param {string} base32 - Base32 encoded string
 * @returns {Uint8Array} - Byte array
 */
const base32ToBytes = (base32) => {
  // Normalize base32 string (remove spaces)
  const normalizedBase32 = base32.toUpperCase().replace(/\s/g, '');
  
  // Base32 character set
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  
  let bits = 0;
  let value = 0;
  let bytes = [];
  
  for (let i = 0; i < normalizedBase32.length; i++) {
    const char = normalizedBase32[i];
    const val = charset.indexOf(char);
    
    if (val === -1) {
      throw new Error(`Invalid character in base32: ${char}`);
    }
    
    // Append 5 bits from this character to the buffer
    value = (value << 5) | val;
    bits += 5;
    
    // If we have at least 8 bits, extract a byte
    if (bits >= 8) {
      bits -= 8;
      bytes.push((value >> bits) & 0xFF);
    }
  }
  
  return new Uint8Array(bytes);
};

/**
 * Validates a TOTP code against a secret
 * @param {string} secret - TOTP secret
 * @param {string} code - User-provided TOTP code
 * @returns {Promise<boolean>} - True if the code is valid
 */
const validateCode = async (secret, code) => {
  try {
    // Clean up inputs
    const cleanSecret = secret.replace(/\s/g, '');
    const cleanCode = code.replace(/\s/g, '');
    
    if (cleanCode.length !== DIGITS) {
      return false;
    }
    
    // Get the current time
    const now = Math.floor(Date.now() / 1000);
    
    // Check the code against the current time period and the window before and after
    for (let i = -WINDOW; i <= WINDOW; i++) {
      const time = now + (i * PERIOD);
      const expectedCode = await generateCode(cleanSecret, time);
      
      if (expectedCode === cleanCode) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error validating TOTP code:', error);
    return false;
  }
};

/**
 * Generates recovery codes for backup authentication
 * @param {number} [count=8] - Number of recovery codes to generate
 * @param {number} [segmentLength=4] - Length of each segment in the code
 * @returns {string[]} - Array of recovery codes
 */
const generateRecoveryCodes = (count = 8, segmentLength = 4) => {
  const charset = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    // Generate a recovery code with 2 segments
    let code = '';
    
    for (let j = 0; j < 2; j++) {
      // Generate one segment
      let segment = '';
      
      for (let k = 0; k < segmentLength; k++) {
        const randomBytes = new Uint8Array(1);
        window.crypto.getRandomValues(randomBytes);
        segment += charset[randomBytes[0] % charset.length];
      }
      
      code += segment;
      
      // Add hyphen between segments
      if (j < 1) {
        code += '-';
      }
    }
    
    codes.push(code);
  }
  
  return codes;
};

/**
 * Saves 2FA settings for a user
 * @param {string} userId - User ID
 * @param {Object} twoFactorSettings - 2FA settings object
 * @returns {Promise<Object>} - Updated user security settings
 */
const saveUserTwoFactorSettings = async (userId, twoFactorSettings) => {
  return Database.updateSecuritySettings(userId, {
    twoFactorAuth: twoFactorSettings.enabled,
    twoFactorMethod: twoFactorSettings.method,
    twoFactorSecret: twoFactorSettings.secret,
    recoveryCodes: twoFactorSettings.recoveryCodes,
    lastVerified: twoFactorSettings.enabled ? new Date() : null
  });
};

/**
 * Gets 2FA settings for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - User's 2FA settings
 */
const getUserTwoFactorSettings = (userId) => {
  const userSettings = Database.getUserSettings(userId);
  
  if (!userSettings || !userSettings.security) {
    return {
      enabled: false,
      method: null,
      secret: null,
      recoveryCodes: []
    };
  }
  
  return {
    enabled: userSettings.security.twoFactorAuth || false,
    method: userSettings.security.twoFactorMethod || 'app',
    secret: userSettings.security.twoFactorSecret || null,
    recoveryCodes: userSettings.security.recoveryCodes || []
  };
};

/**
 * Verifies a recovery code
 * @param {string} userId - User ID
 * @param {string} recoveryCode - Recovery code to verify
 * @returns {Promise<boolean>} - True if the recovery code is valid
 */
const verifyAndUseRecoveryCode = async (userId, recoveryCode) => {
  const userSettings = Database.getUserSettings(userId);
  
  if (!userSettings || !userSettings.security || !userSettings.security.recoveryCodes) {
    return false;
  }
  
  // Normalize recovery code
  const normalizedCode = recoveryCode.toUpperCase().replace(/\s/g, '');
  
  // Find the code in the user's recovery codes
  const codeIndex = userSettings.security.recoveryCodes.findIndex(
    code => code.replace(/\s/g, '') === normalizedCode
  );
  
  if (codeIndex !== -1) {
    // Remove the used code
    const remainingCodes = [...userSettings.security.recoveryCodes];
    remainingCodes.splice(codeIndex, 1);
    
    // Update the user's recovery codes
    await Database.updateSecuritySettings(userId, {
      recoveryCodes: remainingCodes
    });
    
    return true;
  }
  
  return false;
};

/**
 * Generates QR code data for TOTP setup
 * @param {string} secret - TOTP secret
 * @param {string} account - User account identifier (e.g., email)
 * @param {string} [issuer='Mercatrix'] - Service provider name
 * @returns {string} - Data URL for QR code
 */
const generateQrCodeUrl = (secret, account, issuer = 'Mercatrix') => {
  const totpUri = generateTotpUri(secret, account, issuer);
  // Note: The actual QR code generation would typically use a library like qrcode.js
  // For now, we'll return the URI which can be passed to a QR code component
  return totpUri;
};

/**
 * Sets up the initial 2FA for a user
 * @param {string} userId - User ID
 * @param {string} method - 2FA method (app, sms, email)
 * @returns {Promise<Object>} - 2FA setup data including secret and QR code
 */
const setupTwoFactor = async (userId) => {
  const user = Database.getUser(userId);
  
  if (!user) {
    throw new Error('User not found');
  }
  
  // Generate a new secret
  const secret = generateSecret();
  const formattedSecret = formatSecret(secret);
  
  // Generate recovery codes
  const recoveryCodes = generateRecoveryCodes();
  
  // Generate QR code data
  const qrCodeUrl = generateQrCodeUrl(secret, user.email);
  
  // Return setup data without saving yet (user needs to verify first)
  return {
    secret: formattedSecret,
    qrCodeUrl,
    recoveryCodes
  };
};

// Export the 2FA API
export const TwoFactorAuth = {
  // Setup and configuration
  generateSecret,
  formatSecret,
  generateTotpUri,
  generateQrCodeUrl,
  setupTwoFactor,
  
  // Code generation and validation
  generateCode,
  validateCode,
  
  // Recovery codes
  generateRecoveryCodes,
  verifyAndUseRecoveryCode,
  
  // User settings management
  saveUserTwoFactorSettings,
  getUserTwoFactorSettings
};

export default TwoFactorAuth;