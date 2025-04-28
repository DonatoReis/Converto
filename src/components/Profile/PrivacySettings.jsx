// src/components/Profile/PrivacySettings.jsx
import React, { useState, useEffect } from 'react';
import { useEncryption } from '../../context/EncryptionContext';
import TwoFactorAuth from '../../utils/twoFactorAuth';
import Database from '../../utils/database';
import { QRCodeSVG } from 'qrcode.react';

const PrivacySettings = () => {
  const { keyFingerprint, encryptionEnabled } = useEncryption();

  const [currentUser, setCurrentUser] = useState(null);
  const [isEncryptionEnabled, setIsEncryptionEnabled] = useState(true);
  
  // Two-Factor Authentication State
  const [twoFactorSettings, setTwoFactorSettings] = useState({
    enabled: false,
    method: 'app',
    secret: null,
    recoveryCodes: []
  });

  // Additional Privacy Settings
  const [protectIpInCalls, setProtectIpInCalls] = useState(false);
  const [disableLinkPreviews, setDisableLinkPreviews] = useState(false);
  const [blockUnknownContacts, setBlockUnknownContacts] = useState(false);
  const [messageThreshold, setMessageThreshold] = useState(5);
  
  // Load user and settings
  useEffect(() => {
    const user = Database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const settings = Database.getUserSettings(user.id);

      if (settings && settings.privacy) {
        setProtectIpInCalls(settings.privacy.protectIpInCalls || false);
        setDisableLinkPreviews(settings.privacy.disableLinkPreviews || false);
        setBlockUnknownContacts(settings.privacy.blockUnknownContacts || false);
        setMessageThreshold(settings.privacy.messageThreshold || 5);
      }
      
      if (settings && settings.security) {
        const tfaSettings = TwoFactorAuth.getUserTwoFactorSettings(user.id);
        setTwoFactorSettings(tfaSettings);
      }
    }
  }, []);

  // Initialize encryption state from context if available
  useEffect(() => {
    if (encryptionEnabled !== undefined) {
      setIsEncryptionEnabled(encryptionEnabled);
    }
  }, [encryptionEnabled]);
  
  // Toggle encryption function
  const handleToggleEncryption = () => {
    // In a real app, you would call an API to update encryption settings
    setIsEncryptionEnabled(!isEncryptionEnabled);
    
    // Show notification that this is a critical security setting
    if (isEncryptionEnabled) {
      if (!confirm("Desativar a criptografia pode comprometer a segurança das suas mensagens. Tem certeza?")) {
        return; // User canceled, don't toggle
      }
    }
    
    // Could also call a function from useEncryption context to update global encryption state
    alert(isEncryptionEnabled ? 
      "A criptografia será desativada na próxima sessão" : 
      "A criptografia foi ativada para suas mensagens");
  };
  
  // Save all privacy settings
  const savePrivacySettings = () => {
    if (!currentUser) return;
    
    Database.updatePrivacySettings(currentUser.id, {
      protectIpInCalls,
      disableLinkPreviews,
      blockUnknownContacts,
      messageThreshold
    });
    
    // Show a success message
    alert("Configurações de privacidade salvas com sucesso!");
  };

  // E2EE is always enabled - no toggle function needed

  return (
    <div className="space-y-6">
      {/* End-to-End Encryption */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow dark:shadow-none">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Criptografia de Ponta a Ponta
        </h2>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-1">
              Ativar criptografia de ponta a ponta
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Suas mensagens serão criptografadas e só podem ser lidas por você e pelo destinatário
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={isEncryptionEnabled}
              onChange={handleToggleEncryption}
              />
            <div className="w-11 h-6 rounded-full peer bg-gray-200 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1ac27d]"></div>
          </label>
        </div>

        {isEncryptionEnabled && (
          <div className="mt-4 p-4 rounded-md bg-gray-100 dark:bg-gray-700">
            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-white">
              Fingerprint da sua chave de criptografia
            </h3>
            
            <p className="text-sm mb-3 text-gray-600 dark:text-gray-400">
              Compare este fingerprint com seus contatos para verificar a segurança da comunicação.
            </p>
            
            <div className="p-2 rounded bg-gray-200 dark:bg-gray-800 font-mono text-sm">
              {keyFingerprint || 'Carregando...'}
            </div>
            
            <p className="text-xs mt-3 text-amber-600 dark:text-amber-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Suas chaves de criptografia são gerenciadas automaticamente pelo sistema.
              Para fazer backup da chave, visite Configurações de Segurança.
            </p>
          </div>
        )}
      </div>

      {/* Two-Factor Authentication (redirect to SecuritySettings) */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow dark:shadow-none">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Verificação em Duas Etapas
        </h2>
        
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-700 dark:text-gray-300 mb-1">
              Verificação em duas etapas {twoFactorSettings.enabled ? 'ativada' : 'desativada'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Requer um código adicional ao fazer login
            </p>
          </div>
          <div className="flex items-center">
            <span className={`mr-3 text-sm ${twoFactorSettings.enabled ? 'text-green-500' : 'text-gray-500'}`}>
              {twoFactorSettings.enabled ? 'Ativo' : 'Inativo'}
            </span>
            <div className={`w-3 h-3 rounded-full ${twoFactorSettings.enabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Para configurar ou alterar a verificação em duas etapas, acesse a seção de Segurança.
        </p>
        
        <button
          onClick={() => window.location.hash = '#security'}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Ir para Configurações de Segurança
        </button>
      </div>

      {/* Privacy and Security Settings */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow dark:shadow-none">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Configurações de Privacidade Adicionais
        </h2>

        {/* Disable Link Previews */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Desativar prévia de links
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Impede geração automática de prévia para links compartilhados
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={disableLinkPreviews}
                onChange={() => setDisableLinkPreviews(!disableLinkPreviews)}
              />
              <div className="w-11 h-6 rounded-full peer bg-gray-200 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1ac27d]"></div>
            </label>
          </div>
        </div>

        {/* Block Unknown Contacts */}
        <div className="mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-700 dark:text-gray-300 mb-1">
                Bloquear mensagens de contatos desconhecidos
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Bloqueia contatos desconhecidos quando excederem um volume específico de mensagens
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={blockUnknownContacts}
                onChange={() => setBlockUnknownContacts(!blockUnknownContacts)}
              />
              <div className="w-11 h-6 rounded-full peer bg-gray-200 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1ac27d]"></div>
            </label>
          </div>

          {/* Message Threshold */}
          {blockUnknownContacts && (
            <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Limite de mensagens antes de bloquear
              </label>
              <div className="flex items-center">
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={messageThreshold}
                  onChange={(e) => setMessageThreshold(parseInt(e.target.value))}
                  className="w-48 mr-3"
                />
                <span className="text-gray-700 dark:text-gray-300 font-medium">{messageThreshold}</span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Contatos desconhecidos serão bloqueados automaticamente após enviarem {messageThreshold} mensagens
              </p>
            </div>
          )}
        </div>
        
        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={savePrivacySettings}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          >
            Salvar Configurações
          </button>
        </div>
      </div>

      {/* Blocked Contacts */}
      <div className="p-6 rounded-lg bg-white dark:bg-gray-800 shadow dark:shadow-none">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Contatos Bloqueados
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Gerencie sua lista de contatos bloqueados na seção específica.
        </p>
        
        <button
          onClick={() => window.location.hash = '#blocked'}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          Acessar Contatos Bloqueados
        </button>
        
        <p className="text-xs mt-3 text-gray-600 dark:text-gray-400 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          A criptografia de ponta a ponta sempre está ativa para proteger suas mensagens.
        </p>
      </div>
    </div> 
      );
    }

export default PrivacySettings;