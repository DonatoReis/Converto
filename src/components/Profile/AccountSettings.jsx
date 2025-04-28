import React, { useState, useEffect } from 'react';
import Database from '../../utils/database';
import TwoFactorAuth from '../../utils/twoFactorAuth';

const AccountSettings = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showEmailVerify, setShowEmailVerify] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [passwordChangeMode, setPasswordChangeMode] = useState(false);
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [passwordError, setPasswordError] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Load user data
  useEffect(() => {
    const user = Database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
      setEmailVerified(user.emailVerified || false);
      setRecoveryEmail(user.recoveryEmail || '');
      
      // Get 2FA status
      const security = Database.getUserSettings(user.id)?.security || {};
      setTwoFactorEnabled(security.twoFactorAuth || false);
    }
  }, []);

  // Handle email change
  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    // When email changes, it needs verification
    setEmailVerified(false);
  };

  // Send verification code
  const handleSendVerification = () => {
    // In a real app, this would send an email with a verification code
    // For demo, we'll simulate it
    setShowEmailVerify(true);
    alert('Um código de verificação foi enviado para ' + email);
  };

  // Verify email code
  const handleVerifyEmail = () => {
    // In a real app, we'd verify the code server-side
    // For demo, any 6-digit code works
    if (verificationCode.length === 6) {
      setEmailVerified(true);
      setShowEmailVerify(false);
      
      // Update user data
      if (currentUser) {
        Database.updateUser(currentUser.id, {
          email,
          emailVerified: true
        });
        alert('Email verificado com sucesso!');
      }
    } else {
      alert('Código de verificação inválido. Por favor, tente novamente.');
    }
  };

  // Update account information
  const handleUpdateAccount = () => {
    if (!currentUser) return;
    
    // Basic validation
    if (!email) {
      alert('Por favor, insira um email válido.');
      return;
    }
    
    // Update user data
    Database.updateUser(currentUser.id, {
      email,
      phoneNumber,
      recoveryEmail
    });
    
    alert('Informações da conta atualizadas com sucesso!');
  };

  // Handle password change
  const handlePasswordChange = () => {
    setPasswordError('');
    
    // Validate inputs
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPasswordError('Todos os campos de senha são obrigatórios.');
      return;
    }
    
    // Check new password requirements
    if (passwords.new.length < 8) {
      setPasswordError('A nova senha deve ter pelo menos 8 caracteres.');
      return;
    }
    
    // Check if new passwords match
    if (passwords.new !== passwords.confirm) {
      setPasswordError('As senhas novas não correspondem.');
      return;
    }
    
    // In a real app, we'd verify the current password against stored hash
    // and update with new hashed password
    if (currentUser) {
      // Simulate password update
      alert('Senha alterada com sucesso!');
      setPasswordChangeMode(false);
      setPasswords({ current: '', new: '', confirm: '' });
    }
  };

  // Handle account deletion
  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETAR') {
      alert('Por favor, digite DELETAR para confirmar a exclusão da conta.');
      return;
    }
    
    // In a real app, this would initiate account deletion
    alert('Sua solicitação de exclusão de conta foi recebida. Este processo pode levar alguns dias.');
    setShowDeleteConfirm(false);
    setDeleteConfirmText('');
  };

  return (
    <div className="space-y-6">
      {/* Email and Verification */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Email e Verificação
        </h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Email
          </label>
          <div className="flex">
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="seu-email@exemplo.com"
            />
            <button
              onClick={handleSendVerification}
              className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
              disabled={emailVerified}
            >
              {emailVerified ? 'Verificado' : 'Verificar'}
            </button>
          </div>
          
          {emailVerified && (
            <p className="mt-1 text-sm text-green-600 dark:text-green-400 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Email verificado
            </p>
          )}
        </div>
        
        {showEmailVerify && (
          <div className="mb-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
            <h3 className="text-md font-medium mb-2 text-gray-800 dark:text-white">
              Verifique seu email
            </h3>
            <p className="text-sm mb-3 text-gray-600 dark:text-gray-400">
              Enviamos um código de verificação para {email}. Digite o código abaixo para verificar seu email.
            </p>
            
            <div className="flex mb-3">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Código de 6 dígitos"
                className="flex-1 px-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                maxLength={6}
              />
              <button
                onClick={handleVerifyEmail}
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
              >
                Confirmar
              </button>
            </div>
          </div>
        )}
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Número de telefone
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="+55 (99) 99999-9999"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
            Email de recuperação
          </label>
          <input
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="email-recuperacao@exemplo.com"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Usado para recuperar sua conta caso você perca acesso ao email principal
          </p>
        </div>
        
        <button
          onClick={handleUpdateAccount}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Salvar alterações
        </button>
      </div>
      
      {/* Two-Factor Authentication Status */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Verificação em Duas Etapas
          </h2>
          <div className="flex items-center">
            <span className={`mr-3 text-sm ${twoFactorEnabled ? 'text-green-500' : 'text-gray-500'}`}>
              {twoFactorEnabled ? 'Ativada' : 'Desativada'}
            </span>
            <div className={`w-3 h-3 rounded-full ${twoFactorEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          </div>
        </div>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          A verificação em duas etapas adiciona uma camada extra de segurança à sua conta, exigindo um código de verificação além da sua senha ao fazer login.
        </p>
        
        <button
          onClick={() => window.location.hash = '#security'}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
        >
          {twoFactorEnabled ? 'Gerenciar configurações' : 'Ativar verificação em duas etapas'}
        </button>
      </div>
      
      {/* Password Management */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Senha
        </h2>
        
        {!passwordChangeMode ? (
          <button
            onClick={() => setPasswordChangeMode(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Alterar senha
          </button>
        ) : (
          <div>
            {passwordError && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-md">
                {passwordError}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Senha atual
              </label>
              <input
                type="password"
                value={passwords.current}
                onChange={(e) => setPasswords({...passwords, current: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Digite sua senha atual"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Nova senha
              </label>
              <input
                type="password"
                value={passwords.new}
                onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Digite sua nova senha"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                Confirmar nova senha
              </label>
              <input
                type="password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Confirme sua nova senha"
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handlePasswordChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar nova senha
              </button>
              
              <button
                onClick={() => {
                  setPasswordChangeMode(false);
                  setPasswords({ current: '', new: '', confirm: '' });
                  setPasswordError('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Account Deletion */}
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4 text-red-600 dark:text-red-400">
          Excluir conta
        </h2>
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          Excluir sua conta é uma ação permanente e não pode ser desfeita. Todas as suas conversas, contatos e dados serão removidos permanentemente.
        </p>
        
        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Excluir minha conta
          </button>
        ) : (
          <div className="p-4 border border-red-300 rounded-md bg-red-50 dark:bg-red-900/30 dark:border-red-800">
            <p className="font-medium text-red-600 dark:text-red-400 mb-2">
              Você tem certeza que deseja excluir sua conta?
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Para confirmar, digite "DELETAR" no campo abaixo:
            </p>
            
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 mb-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Digite DELETAR para confirmar"
            />
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                disabled={deleteConfirmText !== 'DELETAR'}
              >
                Confirmar exclusão
              </button>
              
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteConfirmText('');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;