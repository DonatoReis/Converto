// src/utils/encryption.js
/**
 * Encryption utility module for implementing end-to-end encryption
 * using the Web Crypto API. This module provides functions to generate
 * encryption keys, encrypt and decrypt messages, and manage user encryption settings.
 */

// Constants for encryption
const KEY_ALGORITHM = { name: 'AES-GCM', length: 256 };
const KEY_EXTRACTABLE = true;
const KEY_USAGES = ['encrypt', 'decrypt'];
const IV_LENGTH = 12; // 96 bits for AES-GCM
const SALT_LENGTH = 16;
const ITERATIONS = 100000;
const KEY_FORMAT = 'jwk';

/**
 * Converts a string to an ArrayBuffer
 * @param {string} str - The string to convert
 * @returns {ArrayBuffer} - The resulting ArrayBuffer
 */
const stringToBuffer = (str) => {
  return new TextEncoder().encode(str);
};

/**
 * Converts an ArrayBuffer to a string
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} - The resulting string
 */
const bufferToString = (buffer) => {
  return new TextDecoder().decode(buffer);
};

/**
 * Converts an ArrayBuffer to a Base64 string for safe storage
 * @param {ArrayBuffer} buffer - The buffer to convert
 * @returns {string} - Base64 encoded string
 */
const bufferToBase64 = (buffer) => {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  return window.btoa(binary);
};

/**
 * Converts a Base64 string back to an ArrayBuffer
 * @param {string} base64 - Base64 encoded string
 * @returns {ArrayBuffer} - The resulting ArrayBuffer
 */
const base64ToBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generates a random initialization vector
 * @returns {ArrayBuffer} - Random IV as ArrayBuffer
 */
const generateIV = () => {
  return window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
};

/**
 * Generates a random salt for key derivation
 * @returns {ArrayBuffer} - Random salt as ArrayBuffer
 */
const generateSalt = () => {
  return window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
};

/**
 * Generates a cryptographic key from a user password
 * @param {string} password - The user's password or passphrase
 * @param {ArrayBuffer} salt - Salt for PBKDF2
 * @returns {Promise<CryptoKey>} - The derived crypto key
 */
const deriveKeyFromPassword = async (password, salt) => {
  // Import the password as a raw key
  const baseKey = await window.crypto.subtle.importKey(
    'raw',
    stringToBuffer(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  // Derive a key using PBKDF2
  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    baseKey,
    KEY_ALGORITHM,
    KEY_EXTRACTABLE,
    KEY_USAGES
  );
};

/**
 * Generates a random encryption key
 * @returns {Promise<CryptoKey>} - A new random crypto key
 */
const generateEncryptionKey = async () => {
  return window.crypto.subtle.generateKey(
    KEY_ALGORITHM,
    KEY_EXTRACTABLE,
    KEY_USAGES
  );
};

/**
 * Exports a CryptoKey to JSON Web Key format
 * @param {CryptoKey} key - The key to export
 * @returns {Promise<string>} - Base64 encoded JWK string
 */
const exportKey = async (key) => {
  const exportedKey = await window.crypto.subtle.exportKey(KEY_FORMAT, key);
  return JSON.stringify(exportedKey);
};

/**
 * Imports a key from a JSON Web Key string
 * @param {string} jwkString - The JWK string to import
 * @returns {Promise<CryptoKey>} - The imported crypto key
 */
const importKey = async (jwkString) => {
  const jwk = JSON.parse(jwkString);
  return window.crypto.subtle.importKey(
    KEY_FORMAT,
    jwk,
    KEY_ALGORITHM,
    KEY_EXTRACTABLE,
    KEY_USAGES
  );
};

/**
 * Encrypts text using the provided key or a derived key from password
 * @param {string} text - Plain text to encrypt
 * @param {CryptoKey|string} keyOrPassword - Either a CryptoKey or password string
 * @returns {Promise<{encryptedData: string, iv: string, salt?: string}>} - Encrypted data and metadata
 */
const encryptText = async (text, keyOrPassword) => {
  let key, salt;
  
  // If keyOrPassword is a string, derive a key from it
  if (typeof keyOrPassword === 'string') {
    salt = generateSalt();
    key = await deriveKeyFromPassword(keyOrPassword, salt);
  } else {
    // Otherwise, use the provided key
    key = keyOrPassword;
  }
  
  const iv = generateIV();
  const data = stringToBuffer(text);
  
  // Encrypt the data
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: KEY_ALGORITHM.name,
      iv
    },
    key,
    data
  );
  
  // Convert to Base64 for storage
  const encryptedData = bufferToBase64(encryptedBuffer);
  const ivBase64 = bufferToBase64(iv);
  
  // Return encrypted data and metadata
  const result = { encryptedData, iv: ivBase64 };
  
  // Include salt if we derived the key from a password
  if (salt) {
    result.salt = bufferToBase64(salt);
  }
  
  return result;
};

/**
 * Decrypts text using the provided key or a derived key from password
 * @param {string} encryptedData - Base64 encoded encrypted data
 * @param {string} ivBase64 - Base64 encoded initialization vector
 * @param {CryptoKey|string} keyOrPassword - Either a CryptoKey or password string
 * @param {string} [saltBase64] - Base64 encoded salt (required if keyOrPassword is a string)
 * @returns {Promise<string>} - Decrypted plain text
 */
const decryptText = async (encryptedData, ivBase64, keyOrPassword, saltBase64) => {
  let key;
  
  // If keyOrPassword is a string, derive a key from it using the provided salt
  if (typeof keyOrPassword === 'string') {
    if (!saltBase64) {
      throw new Error('Salt is required when decrypting with a password');
    }
    const salt = base64ToBuffer(saltBase64);
    key = await deriveKeyFromPassword(keyOrPassword, salt);
  } else {
    // Otherwise, use the provided key
    key = keyOrPassword;
  }
  
  const iv = base64ToBuffer(ivBase64);
  const encryptedBuffer = base64ToBuffer(encryptedData);
  
  try {
    // Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: KEY_ALGORITHM.name,
        iv
      },
      key,
      encryptedBuffer
    );
    
    // Convert the buffer back to a string
    return bufferToString(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Decryption failed. Wrong key or corrupted data.');
  }
};

/**
 * Validates whether a key can correctly decrypt a test message
 * @param {CryptoKey} key - The key to validate
 * @returns {Promise<boolean>} - True if key can decrypt test message
 */
const validateKey = async (key) => {
  try {
    // Create test message
    const testMessage = 'Encryption test message';
    
    // Encrypt test message
    const { encryptedData, iv } = await encryptText(testMessage, key);
    
    // Decrypt and compare
    const decrypted = await decryptText(encryptedData, iv, key);
    
    return decrypted === testMessage;
  } catch (error) {
    console.error('Key validation failed:', error);
    return false;
  }
};

/**
 * Generates a key backup as a password-protected JWK string
 * @param {CryptoKey} key - The key to back up
 * @param {string} backupPassword - Password to protect the key backup
 * @returns {Promise<string>} - Encrypted key backup as string
 */
const generateKeyBackup = async (key, backupPassword) => {
  // Export the key to JWK format
  const jwkString = await exportKey(key);
  
  // Encrypt the JWK with the backup password
  const { encryptedData, iv, salt } = await encryptText(jwkString, backupPassword);
  
  // Combine everything into a single string
  return JSON.stringify({ encryptedKey: encryptedData, iv, salt });
};

/**
 * Restores a key from a backup string
 * @param {string} backupString - The backup string
 * @param {string} backupPassword - Password to decrypt the backup
 * @returns {Promise<CryptoKey>} - The restored crypto key
 */
const restoreKeyFromBackup = async (backupString, backupPassword) => {
  try {
    // Parse the backup string
    const { encryptedKey, iv, salt } = JSON.parse(backupString);
    
    // Decrypt the JWK
    const jwkString = await decryptText(encryptedKey, iv, backupPassword, salt);
    
    // Import the key from JWK
    return importKey(jwkString);
  } catch (error) {
    console.error('Key restoration failed:', error);
    throw new Error('Failed to restore key. Invalid backup or wrong password.');
  }
};

/**
 * Creates a fingerprint of a key for verification
 * @param {CryptoKey} key - The key to create fingerprint for
 * @returns {Promise<string>} - Key fingerprint as string
 */
const createKeyFingerprint = async (key) => {
  const jwkString = await exportKey(key);
  
  // Create a hash of the JWK
  const buffer = stringToBuffer(jwkString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', buffer);
  
  // Convert to Base64 and take first 8 characters
  const fingerprint = bufferToBase64(hashBuffer).slice(0, 8);
  
  return fingerprint;
};

/**
 * Context provider for encryption functionality
 * @param {ReactNode} children - Child components
 * @returns {JSX.Element} - Provider component
 */
export const EncryptionProvider = ({ children }) => {
  // Implementation in a separate context file
};

// Export the encryption API
export const Encryption = {
  // Key generation and management
  generateEncryptionKey,
  exportKey,
  importKey,
  validateKey,
  createKeyFingerprint,
  
  // Backup and restore
  generateKeyBackup,
  restoreKeyFromBackup,
  
  // Encryption/Decryption
  encryptText,
  decryptText,
  
  // Helper functions
  stringToBuffer,
  bufferToString,
  bufferToBase64,
  base64ToBuffer,
};

export default Encryption;