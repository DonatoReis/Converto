// src/utils/signalProtocol.js
let libsignal;
async function getLibsignal() {
  if (!libsignal) {
    libsignal = await import('libsignal-protocol');
  }
  return libsignal;
}

// Importe explicitamente as shims na ordem correta antes do libsignal
import '../shims/long-shim.js';
import '../shims/bytebuffer-shim.js';

// Import libsignal-protocol depois dos shims
import { getRandomBytes } from '../shims/long-shim.js';

/**
 * Módulo para implementação do Signal Protocol
 * Baseado na biblioteca libsignal-protocol
 */

// Local storage keys
const IDENTITY_KEY_PAIR_KEY = 'signal_identity_key';
const REGISTRATION_ID_KEY = 'signal_registration_id';
const PRE_KEYS_KEY = 'signal_pre_keys';
const SIGNED_PRE_KEY_KEY = 'signal_signed_pre_key';
const SESSIONS_KEY = 'signal_sessions';

/**
 * Converte um ArrayBuffer para uma string Base64
 */
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

/**
 * Converte uma string Base64 para um ArrayBuffer
 */
const base64ToArrayBuffer = (base64) => {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Gera um par de chaves de identidade Curve25519
 */
const generateIdentityKeyPair = async () => {
  try {
    const keyPair = await libsignal.KeyHelper.generateIdentityKeyPair();
    return keyPair;
  } catch (error) {
    console.error('Error generating identity key pair:', error);
    throw error;
  }
};

/**
 * Gera um ID de registro único
 */
const generateRegistrationId = async () => {
  try {
    const regId = await libsignal.KeyHelper.generateRegistrationId();
    return regId;
  } catch (error) {
    console.error('Error generating registration ID:', error);
    throw error;
  }
};

/**
 * Gera um conjunto de pre-keys
 * @param {number} startId - ID inicial 
 * @param {number} count - Número de chaves a serem geradas
 */
const generatePreKeys = async (startId, count) => {
  try {
    const preKeys = await libsignal.KeyHelper.generatePreKeys(startId, count);
    return preKeys;
  } catch (error) {
    console.error('Error generating pre-keys:', error);
    throw error;
  }
};

/**
 * Gera uma pre-key assinada
 * @param {object} identityKeyPair - Par de chaves de identidade 
 * @param {number} keyId - ID da chave
 */
const generateSignedPreKey = async (identityKeyPair, keyId) => {
  try {
    const signedPreKey = await libsignal.KeyHelper.generateSignedPreKey(
      identityKeyPair,
      keyId
    );
    return signedPreKey;
  } catch (error) {
    console.error('Error generating signed pre-key:', error);
    throw error;
  }
};

/**
 * Armazena o par de chaves de identidade no localStorage
 * @param {object} keyPair - Par de chaves de identidade
 */
const storeIdentityKeyPair = async (keyPair) => {
  try {
    const serialized = {
      pubKey: arrayBufferToBase64(keyPair.pubKey),
      privKey: arrayBufferToBase64(keyPair.privKey)
    };
    localStorage.setItem(IDENTITY_KEY_PAIR_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Error storing identity key pair:', error);
    throw error;
  }
};

/**
 * Carrega o par de chaves de identidade do localStorage
 */
const loadIdentityKeyPair = async () => {
  try {
    const serialized = localStorage.getItem(IDENTITY_KEY_PAIR_KEY);
    if (!serialized) return null;
    
    const parsed = JSON.parse(serialized);
    return {
      pubKey: base64ToArrayBuffer(parsed.pubKey),
      privKey: base64ToArrayBuffer(parsed.privKey)
    };
  } catch (error) {
    console.error('Error loading identity key pair:', error);
    return null;
  }
};

/**
 * Armazena o ID de registro no localStorage
 * @param {number} regId - ID de registro
 */
const storeRegistrationId = async (regId) => {
  try {
    localStorage.setItem(REGISTRATION_ID_KEY, regId.toString());
  } catch (error) {
    console.error('Error storing registration ID:', error);
    throw error;
  }
};

/**
 * Carrega o ID de registro do localStorage
 */
const loadRegistrationId = async () => {
  try {
    const regId = localStorage.getItem(REGISTRATION_ID_KEY);
    return regId ? parseInt(regId, 10) : null;
  } catch (error) {
    console.error('Error loading registration ID:', error);
    return null;
  }
};

/**
 * Armazena o bundle de pre-keys no localStorage
 * @param {object} bundle - Bundle de pre-keys
 */
const storePreKeyBundle = async (bundle) => {
  try {
    // Serializar as partes do bundle que são ArrayBuffers
    const serialized = {
      identityKey: arrayBufferToBase64(bundle.identityKey),
      registrationId: bundle.registrationId,
      preKeys: bundle.preKeys.map(pk => ({
        keyId: pk.keyId,
        publicKey: arrayBufferToBase64(pk.publicKey)
      })),
      signedPreKey: {
        keyId: bundle.signedPreKey.keyId,
        publicKey: arrayBufferToBase64(bundle.signedPreKey.publicKey),
        signature: arrayBufferToBase64(bundle.signedPreKey.signature)
      }
    };
    
    localStorage.setItem(PRE_KEYS_KEY, JSON.stringify(serialized));
  } catch (error) {
    console.error('Error storing pre-key bundle:', error);
    throw error;
  }
};

/**
 * Cria uma nova sessão do Signal Protocol
 * @param {string} recipientId - ID do destinatário
 * @param {object} preKeyBundle - Bundle de pre-keys do destinatário
 * @param {object} identityKeyPair - Par de chaves de identidade do remetente
 */
const createSession = async (recipientId, preKeyBundle, identityKeyPair) => {
  try {
    // Criar uma instância do Signal Protocol Store
    const store = new libsignal.SignalProtocolStore();
    
    // Adicionar a identidade do remetente
    await store.saveIdentity(recipientId, preKeyBundle.identityKey);
    
    // Processar o bundle de pre-keys
    const address = new libsignal.SignalProtocolAddress(recipientId, 1);
    const sessionBuilder = new libsignal.SessionBuilder(store, address);
    
    // Criar a sessão
    await sessionBuilder.processPreKey(preKeyBundle);
    
    // Retornar um objeto que encapsula o store e o endereço para uso futuro
    return {
      store,
      address,
      recipientId
    };
  } catch (error) {
    console.error(`Error creating session with ${recipientId}:`, error);
    throw error;
  }
};

/**
 * Criptografa uma mensagem para um destinatário específico
 * @param {string} recipientId - ID do destinatário
 * @param {string} plaintext - Texto a ser criptografado
 * @param {object} session - Sessão criada com createSession
 */
const encryptMessage = async (recipientId, plaintext, session) => {
  try {
    // Criar um SessionCipher para criptografar mensagens nesta sessão
    const cipher = new libsignal.SessionCipher(session.store, session.address);
    
    // Criptografar a mensagem
    const ciphertext = await cipher.encrypt(stringToArrayBuffer(plaintext));
    
    // Retornar a mensagem criptografada
    return ciphertext;
  } catch (error) {
    console.error(`Error encrypting message for ${recipientId}:`, error);
    throw error;
  }
};

/**
 * Processa uma mensagem PreKey recebida e cria uma sessão se necessário
 * @param {string} senderId - ID do remetente
 * @param {object} encryptedMessage - Mensagem criptografada
 * @param {object} identityKeyPair - Par de chaves de identidade do destinatário
 */
const processPreKeyMessage = async (senderId, encryptedMessage, identityKeyPair) => {
  try {
    // Criar uma instância do Signal Protocol Store
    const store = new libsignal.SignalProtocolStore();
    
    // Adicionar a identidade do destinatário
    store.setIdentityKeyPair(identityKeyPair);
    
    // Criar o endereço do remetente
    const address = new libsignal.SignalProtocolAddress(senderId, 1);
    
    // Criar um SessionCipher
    const cipher = new libsignal.SessionCipher(store, address);
    
    // Processar a mensagem PreKey
    await cipher.decryptPreKeyWhisperMessage(encryptedMessage.body, 'binary');
    
    // Retornar um objeto que encapsula o store e o endereço para uso futuro
    return {
      store,
      address,
      recipientId: senderId
    };
  } catch (error) {
    console.error(`Error processing PreKey message from ${senderId}:`, error);
    throw error;
  }
};

/**
 * Descriptografa uma mensagem recebida
 * @param {string} senderId - ID do remetente
 * @param {object} encryptedMessage - Mensagem criptografada
 * @param {object} session - Sessão criada com createSession ou processPreKeyMessage
 */
const decryptMessage = async (senderId, encryptedMessage, session) => {
  try {
    // Criar um SessionCipher
    const cipher = new libsignal.SessionCipher(session.store, session.address);
    
    // Descriptografar a mensagem
    let plaintext;
    
    if (encryptedMessage.type === 1) { // PREKEY_TYPE
      plaintext = await cipher.decryptPreKeyWhisperMessage(encryptedMessage.body, 'binary');
    } else { // WHISPER_TYPE
      plaintext = await cipher.decryptWhisperMessage(encryptedMessage.body, 'binary');
    }
    
    // Converter o ArrayBuffer para string
    return arrayBufferToString(plaintext);
  } catch (error) {
    console.error(`Error decrypting message from ${senderId}:`, error);
    throw error;
  }
};

/**
 * Converte string para ArrayBuffer
 * @param {string} str - String para converter
 */
const stringToArrayBuffer = (str) => {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
};

/**
 * Converte ArrayBuffer para string
 * @param {ArrayBuffer} buffer - Buffer para converter
 */
const arrayBufferToString = (buffer) => {
  const decoder = new TextDecoder();
  return decoder.decode(buffer);
};

/**
 * Gera uma fingerprint para uma chave de identidade
 * @param {ArrayBuffer} identityKey - Chave pública de identidade
 */
const getFingerprint = async (identityKey) => {
  try {
    // Usar SHA-256 para gerar um hash da chave
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', identityKey);
    
    // Converter para Base64 e pegar os primeiros 16 caracteres
    let fingerprint = arrayBufferToBase64(hashBuffer).slice(0, 16);
    
    // Formatar em grupos de 4 caracteres para melhor legibilidade
    fingerprint = fingerprint.match(/.{1,4}/g).join(' ');
    
    return fingerprint;
  } catch (error) {
    console.error('Error generating key fingerprint:', error);
    throw error;
  }
};

/**
 * Cria um backup criptografado das chaves
 * @param {object} identityKeyPair - Par de chaves de identidade
 * @param {number} registrationId - ID de registro
 * @param {string} password - Senha para criptografar o backup
 */
const createKeyBackup = async (identityKeyPair, registrationId, password) => {
  try {
    // Serializar as chaves
    const keysToBackup = {
      identityKeyPair: {
        pubKey: arrayBufferToBase64(identityKeyPair.pubKey),
        privKey: arrayBufferToBase64(identityKeyPair.privKey)
      },
      registrationId
    };
    
    // Converter para string JSON
    const keysJson = JSON.stringify(keysToBackup);
    
    // Derivar uma chave a partir da senha
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      stringToArrayBuffer(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Gerar salt aleatório
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    
    // Derivar chave AES-GCM
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );
    
    // Gerar IV para AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Criptografar os dados
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      stringToArrayBuffer(keysJson)
    );
    
    // Montar o objeto de backup
    const backup = {
      version: 1,
      salt: arrayBufferToBase64(salt),
      iv: arrayBufferToBase64(iv),
      data: arrayBufferToBase64(encryptedData)
    };
    
    // Retornar como string JSON
    return JSON.stringify(backup);
  } catch (error) {
    console.error('Error creating key backup:', error);
    throw error;
  }
};

/**
 * Restaura as chaves a partir de um backup
 * @param {string} backupString - String de backup (JSON)
 * @param {string} password - Senha para descriptografar o backup
 * @returns {object} - Par de chaves de identidade e ID de registro restaurados
 */
const restoreKeyFromBackup = async (backupString, password) => {
  try {
    // Parsear o backup
    const backup = JSON.parse(backupString);
    
    // Verificar versão
    if (backup.version !== 1) {
      throw new Error('Versão de backup não suportada');
    }
    
    // Decodificar salt, IV e dados
    const salt = base64ToArrayBuffer(backup.salt);
    const iv = base64ToArrayBuffer(backup.iv);
    const encryptedData = base64ToArrayBuffer(backup.data);
    
    // Derivar chave a partir da senha
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      stringToArrayBuffer(password),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    // Derivar chave AES-GCM
    const key = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Descriptografar os dados
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      encryptedData
    );
    
    // Parsear o JSON descriptografado
    const keysJson = arrayBufferToString(decryptedData);
    const keys = JSON.parse(keysJson);
    
    // Reconstruir o par de chaves
    const identityKeyPair = {
      pubKey: base64ToArrayBuffer(keys.identityKeyPair.pubKey),
      privKey: base64ToArrayBuffer(keys.identityKeyPair.privKey)
    };
    
    // Retornar as chaves restauradas
    return {
      identityKeyPair,
      registrationId: keys.registrationId
    };
  } catch (error) {
    console.error('Error restoring key from backup:', error);
    throw new Error('Falha ao restaurar o backup. Senha incorreta ou backup inválido.');
  }
};

// Exportar a API do Signal Protocol
const SignalProtocol = {
  // Funções de conversão
  arrayBufferToBase64,
  base64ToArrayBuffer,
  stringToArrayBuffer,
  arrayBufferToString,
  
  // Geração de chaves
  generateIdentityKeyPair,
  generateRegistrationId,
  generatePreKeys,
  generateSignedPreKey,
  
  // Armazenamento de chaves
  storeIdentityKeyPair,
  loadIdentityKeyPair,
  storeRegistrationId,
  loadRegistrationId,
  storePreKeyBundle,
  
  // Gestão de sessão
  createSession,
  processPreKeyMessage,
  
  // Criptografia/descriptografia
  encryptMessage,
  decryptMessage,
  
  // Auxiliares
  getFingerprint,
  createKeyBackup,
  restoreKeyFromBackup
};

export default SignalProtocol;

