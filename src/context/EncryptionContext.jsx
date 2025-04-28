// src/context/EncryptionContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import SignalProtocol from '../utils/signalProtocol'; // Novo módulo para implementação do Signal Protocol
import Database from '../utils/database';

// Create the Encryption Context
const EncryptionContext = createContext();

// Custom hook to use the encryption context
export const useEncryption = () => {
  const context = useContext(EncryptionContext);
  if (!context) {
    throw new Error('useEncryption must be used within an EncryptionProvider');
  }
  return context;
};

export const EncryptionProvider = ({ children }) => {
  // Estado para chaves e sessões do Signal Protocol
  const [identityKeyPair, setIdentityKeyPair] = useState(null);
  const [registrationId, setRegistrationId] = useState(null);
  const [preKeyBundle, setPreKeyBundle] = useState(null);
  const [isKeyLoaded, setIsKeyLoaded] = useState(false);
  const [keyFingerprint, setKeyFingerprint] = useState('');
  const [keyBackup, setKeyBackup] = useState(null);
  const [encryptionError, setEncryptionError] = useState(null);
  const [sessions, setSessions] = useState({});

  // Carregar ou gerar chaves de criptografia ao iniciar
  useEffect(() => {
    const initializeSignalProtocol = async () => {
      try {
        // Obter o usuário atual
        const currentUser = Database.getCurrentUser();
        if (!currentUser) return;

        // Tentar carregar chaves existentes do armazenamento local
        let keyPair = await SignalProtocol.loadIdentityKeyPair();
        let regId = await SignalProtocol.loadRegistrationId();
        
        // Se não existirem chaves, gerar novas
        if (!keyPair || !regId) {
          console.log('Generating new Signal Protocol identity keys...');
          
          // Gerar nova identidade
          keyPair = await SignalProtocol.generateIdentityKeyPair();
          regId = await SignalProtocol.generateRegistrationId();
          
          // Salvar localmente
          await SignalProtocol.storeIdentityKeyPair(keyPair);
          await SignalProtocol.storeRegistrationId(regId);
        }
        
        // Definir estado
        setIdentityKeyPair(keyPair);
        setRegistrationId(regId);
        
        // Gerar e publicar pre-keys
        await generateAndPublishPreKeys(currentUser.id, keyPair, regId);
        
        // Gerar fingerprint para a chave
        const fingerprint = await SignalProtocol.getFingerprint(keyPair.pubKey);
        setKeyFingerprint(fingerprint);
        
        setIsKeyLoaded(true);
        setEncryptionError(null);
      } catch (error) {
        console.error('Failed to initialize Signal Protocol:', error);
        setEncryptionError('Falha ao inicializar o protocolo de criptografia. Por favor, recarregue o aplicativo.');
      }
    };
    
    initializeSignalProtocol();
  }, []);
  
  // Função para gerar e publicar pre-keys no servidor
  const generateAndPublishPreKeys = async (userId, identityKey, regId) => {
    try {
      // Gerar conjunto de pre-keys
      const preKeys = await SignalProtocol.generatePreKeys(0, 10);
      const signedPreKey = await SignalProtocol.generateSignedPreKey(identityKey, 0);
      
      // Montar o bundle de pre-keys
      const bundle = {
        identityKey: identityKey.pubKey,
        registrationId: regId,
        preKeys: preKeys.map(pk => ({
          keyId: pk.keyId,
          publicKey: pk.keyPair.pubKey
        })),
        signedPreKey: {
          keyId: signedPreKey.keyId,
          publicKey: signedPreKey.keyPair.pubKey,
          signature: signedPreKey.signature
        }
      };
      
      // Salvar o bundle localmente
      await SignalProtocol.storePreKeyBundle(bundle);
      setPreKeyBundle(bundle);
      
      // Publicar chave pública no servidor
      await Database.updateUserPublicKey(userId, {
        identityKey: SignalProtocol.arrayBufferToBase64(identityKey.pubKey),
        registrationId: regId,
        preKeys: bundle.preKeys.map(pk => ({
          keyId: pk.keyId,
          publicKey: SignalProtocol.arrayBufferToBase64(pk.publicKey)
        })),
        signedPreKey: {
          keyId: bundle.signedPreKey.keyId,
          publicKey: SignalProtocol.arrayBufferToBase64(bundle.signedPreKey.publicKey),
          signature: SignalProtocol.arrayBufferToBase64(bundle.signedPreKey.signature)
        }
      });
      
      return bundle;
    } catch (error) {
      console.error('Failed to generate and publish pre-keys:', error);
      throw error;
    }
  };
  
  // Criar uma sessão para um destinatário
  const createSession = async (recipientId) => {
    try {
      // Verificar se já temos uma sessão para este destinatário
      if (sessions[recipientId]) {
        return sessions[recipientId];
      }
      
      // Buscar bundle de pre-keys do destinatário no servidor
      const recipientPreKeyBundle = await Database.getUserPublicKey(recipientId);
      
      if (!recipientPreKeyBundle) {
        throw new Error(`Não foi possível obter as chaves públicas do destinatário: ${recipientId}`);
      }
      
      // Converter formato para libsignal
      const signalBundle = {
        identityKey: SignalProtocol.base64ToArrayBuffer(recipientPreKeyBundle.identityKey),
        registrationId: recipientPreKeyBundle.registrationId,
        preKey: {
          keyId: recipientPreKeyBundle.preKeys[0].keyId,
          publicKey: SignalProtocol.base64ToArrayBuffer(recipientPreKeyBundle.preKeys[0].publicKey)
        },
        signedPreKey: {
          keyId: recipientPreKeyBundle.signedPreKey.keyId,
          publicKey: SignalProtocol.base64ToArrayBuffer(recipientPreKeyBundle.signedPreKey.publicKey),
          signature: SignalProtocol.base64ToArrayBuffer(recipientPreKeyBundle.signedPreKey.signature)
        }
      };
      
      // Criar uma sessão do Signal Protocol
      const session = await SignalProtocol.createSession(
        recipientId,
        signalBundle,
        identityKeyPair
      );
      
      // Atualizar o estado
      setSessions(prev => ({
        ...prev,
        [recipientId]: session
      }));
      
      return session;
    } catch (error) {
      console.error(`Failed to create session with ${recipientId}:`, error);
      setEncryptionError(`Falha ao estabelecer uma sessão de criptografia com ${recipientId}`);
      throw error;
    }
  };
  
  // Criptografar mensagem usando o Signal Protocol
  const encryptMessage = useCallback(async (text, recipientId) => {
    if (!identityKeyPair || !isKeyLoaded) {
      throw new Error('Chaves de criptografia não inicializadas');
    }
    
    try {
      // Obter ou criar sessão para o destinatário
      let session = sessions[recipientId];
      if (!session) {
        session = await createSession(recipientId);
      }
      
      // Criptografar a mensagem
      const encryptedMessage = await SignalProtocol.encryptMessage(
        recipientId,
        text,
        session
      );
      
      return {
        text: JSON.stringify(encryptedMessage),
        encrypted: true
      };
    } catch (error) {
      console.error('Encryption failed:', error);
      setEncryptionError('Falha na criptografia da mensagem: ' + error.message);
      throw error;
    }
  }, [identityKeyPair, isKeyLoaded, sessions]);
  
  // Descriptografar mensagem usando o Signal Protocol
  const decryptMessage = useCallback(async (encryptedText, senderId) => {
    if (!identityKeyPair || !isKeyLoaded) {
      throw new Error('Chaves de criptografia não inicializadas');
    }
    
    try {
      // Verificar se o texto está criptografado
      let encryptedMessage;
      try {
        encryptedMessage = JSON.parse(encryptedText);
      } catch (parseError) {
        // Se não for JSON, provavelmente não está criptografado
        return encryptedText;
      }
      
      // Verificar se a mensagem tem formato válido
      if (!encryptedMessage || !encryptedMessage.type) {
        return encryptedText;
      }
      
      // Obter ou criar sessão para o remetente
      let session = sessions[senderId];
      if (!session) {
        // Para mensagens recebidas, pode ser necessário criar a sessão a partir de uma PreKeyMessage
        session = await SignalProtocol.processPreKeyMessage(
          senderId,
          encryptedMessage,
          identityKeyPair
        );
        
        // Atualizar o estado de sessões
        setSessions(prev => ({
          ...prev,
          [senderId]: session
        }));
      }
      
      // Descriptografar a mensagem
      const decryptedText = await SignalProtocol.decryptMessage(
        senderId,
        encryptedMessage,
        session
      );
      
      return decryptedText;
    } catch (error) {
      console.error('Decryption failed:', error);
      setEncryptionError('Falha na descriptografia da mensagem: ' + error.message);
      return `[Não foi possível descriptografar a mensagem: ${error.message}]`;
    }
  }, [identityKeyPair, isKeyLoaded, sessions]);
  
  // Criar backup da chave de identidade
  const createKeyBackup = useCallback(async (backupPassword) => {
    if (!identityKeyPair) {
      setEncryptionError('Não há chaves para fazer backup');
      return null;
    }
    
    try {
      const backup = await SignalProtocol.createKeyBackup(
        identityKeyPair,
        registrationId,
        backupPassword
      );
      
      setKeyBackup(backup);
      return backup;
    } catch (error) {
      console.error('Failed to create key backup:', error);
      setEncryptionError('Falha ao criar backup da chave: ' + error.message);
      return null;
    }
  }, [identityKeyPair, registrationId]);
  
  // Restaurar chave de identidade a partir de backup
  const restoreKeyFromBackup = useCallback(async (backupString, backupPassword) => {
    try {
      const restoredKeys = await SignalProtocol.restoreKeyFromBackup(
        backupString,
        backupPassword
      );
      
      if (!restoredKeys || !restoredKeys.identityKeyPair || !restoredKeys.registrationId) {
        throw new Error('Backup inválido ou senha incorreta');
      }
      
      // Salvar as chaves restauradas
      await SignalProtocol.storeIdentityKeyPair(restoredKeys.identityKeyPair);
      await SignalProtocol.storeRegistrationId(restoredKeys.registrationId);
      
      // Atualizar o estado
      setIdentityKeyPair(restoredKeys.identityKeyPair);
      setRegistrationId(restoredKeys.registrationId);
      
      // Gerar fingerprint para a chave
      const fingerprint = await SignalProtocol.getFingerprint(restoredKeys.identityKeyPair.pubKey);
      setKeyFingerprint(fingerprint);
      
      // Gerar novos pre-keys e publicar
      const currentUser = Database.getCurrentUser();
      await generateAndPublishPreKeys(
        currentUser.id,
        restoredKeys.identityKeyPair,
        restoredKeys.registrationId
      );
      
      setIsKeyLoaded(true);
      setEncryptionError(null);
      
      return true;
    } catch (error) {
      console.error('Failed to restore key from backup:', error);
      setEncryptionError('Falha ao restaurar a chave: ' + error.message);
      return false;
    }
  }, []);
  
  // Resetar erro de criptografia
  const resetError = useCallback(() => {
    setEncryptionError(null);
  }, []);
  
  // Fornecer o contexto de criptografia
  const value = {
    isKeyLoaded,
    keyFingerprint,
    keyBackup,
    encryptionError,
    createKeyBackup,
    restoreKeyFromBackup,
    encryptMessage,
    decryptMessage,
    resetError
  };
  
  return (
    <EncryptionContext.Provider value={value}>
      {children}
    </EncryptionContext.Provider>
  );
};

export default EncryptionProvider;
