// src/components/Profile/SecuritySettings.jsx
import React, { useState, useEffect } from 'react';
import { useEncryption } from '../../context/EncryptionContext';
import TwoFactorAuth from '../../utils/twoFactorAuth';
import Database from '../../utils/database';
import { QRCodeSVG } from 'qrcode.react';

const SecuritySettings = () => {
  const { 
    isEncryptionEnabled, 
    keyFingerprint,
    encryptionError,
    enableEncryption, 
    disableEncryption,
    createKeyBackup,
    restoreKeyFromBackup,
    resetError
  } = useEncryption();

  // User State
  const [currentUser, setCurrentUser] = useState(null);
  
  // Two-Factor Authentication State
  const [twoFactorSettings, setTwoFactorSettings] = useState({
    enabled: false,
    method: 'app',
    secret: null,
    recoveryCodes: []
  });
  const [isSettingUp2FA, setIsSettingUp2FA] = useState(false);
  const [setup2FAData, setSetup2FAData] = useState(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [verify2FAError, setVerify2FAError] = useState(null);
  
  // Backup and Recovery State
  const [backupPassword, setBackupPassword] = useState('');
  const [showBackupDialog, setShowBackupDialog] = useState(false);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupString, setBackupString] = useState('');
  const [restorePassword, setRestorePassword] = useState('');
  const [showRecoveryCodes, setShowRecoveryCodes] = useState(false);
  
  // Load user and settings
  useEffect(() => {
    const user = Database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      const settings = TwoFactorAuth.getUserTwoFactorSettings(user.id);
      setTwoFactorSettings(settings);
    }
  }, []);

  // Reset error messages when unmounting
  useEffect(() => {
    return () => {
      resetError();
      setVerify2FAError(null);
    };
  }, [resetError]);

  // Handle Encryption Toggle
  const handleEncryptionToggle = async () => {
    if (isEncryptionEnabled) {
      // Confirm before disabling
      if (window.confirm('Disabling encryption will make your messages readable to Mercatrix. Are you sure?')) {
        await disableEncryption();
      }
    } else {
      // Enable encryption with a new key
      await enableEncryption();
    }
  };

  // Create a backup of encryption keys
  const handleCreateBackup = async () => {
    if (!backupPassword) {
      alert('Please enter a password to protect your backup');
      return;
    }

    const backup = await createKeyBackup(backupPassword);
    if (backup) {
      setBackupString(backup);
      // Clear the password field for security
      setBackupPassword('');
    }
  };

  // Restore from a backup
  const handleRestoreBackup = async () => {
    if (!backupString || !restorePassword) {
      alert('Please enter both your backup string and password');
      return;
    }

    const success = await restoreKeyFromBackup(backupString, restorePassword);
    if (success) {
      setShowRestoreDialog(false);
      setBackupString('');
      setRestorePassword('');
    }
  };

  // Begin 2FA setup process
  const handleBegin2FASetup = async () => {
    try {
      if (!currentUser) return;
      
      const setupData = await TwoFactorAuth.setupTwoFactor(currentUser.id);
      setSetup2FAData(setupData);
      setIsSettingUp2FA(true);
    } catch (error) {
      setVerify2FAError(`Setup failed: ${error.message}`);
    }
  };

  // Verify and enable 2FA
  const handleVerify2FA = async () => {
    try {
      if (!setup2FAData || !verificationCode) {
        setVerify2FAError('Please enter the verification code');
        return;
      }

      const isValid = await TwoFactorAuth.validateCode(setup2FAData.secret, verificationCode);
      
      if (isValid) {
        // Save 2FA settings
        const updatedSettings = {
          enabled: true,
          method: 'app',
          secret: setup2FAData.secret,
          recoveryCodes: setup2FAData.recoveryCodes
        };
        
        await TwoFactorAuth.saveUserTwoFactorSettings(currentUser.id, updatedSettings);
        
        // Update local state
        setTwoFactorSettings(updatedSettings);
        setIsSettingUp2FA(false);
        setSetup2FAData(null);
        setVerificationCode('');
        setVerify2FAError(null);
      } else {
        setVerify2FAError('Invalid verification code. Please try again.');
      }
    } catch (error) {
      setVerify2FAError(`Verification failed: ${error.message}`);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    try {
      if (!currentUser) return;
      
      if (window.confirm('Are you sure you want to disable two-factor authentication?')) {
        const disabledSettings = {
          enabled: false,
          method: null,
          secret: null,
          recoveryCodes: []
        };
        
        await TwoFactorAuth.saveUserTwoFactorSettings(currentUser.id, disabledSettings);
        
        // Update local state
        setTwoFactorSettings(disabledSettings);
      }
    } catch (error) {
      setVerify2FAError(`Failed to disable 2FA: ${error.message}`);
    }
  };

  // Generate new recovery codes
  const handleGenerateNewRecoveryCodes = async () => {
    try {
      if (!currentUser || !twoFactorSettings.enabled) return;
      
      const newCodes = TwoFactorAuth.generateRecoveryCodes();
      
      const updatedSettings = {
        ...twoFactorSettings,
        recoveryCodes: newCodes
      };
      
      await TwoFactorAuth.saveUserTwoFactorSettings(currentUser.id, updatedSettings);
      
      // Update local state
      setTwoFactorSettings(updatedSettings);
      setShowRecoveryCodes(true);
    } catch (error) {
      setVerify2FAError(`Failed to generate new recovery codes: ${error.message}`);
    }
  };

  // 2FA Setup UI
  const renderTwoFactorSetup = () => {
    if (!setup2FAData) return null;
    
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">Setup Two-Factor Authentication</h3>
        
        <ol className="mb-6 space-y-4">
          <li className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">1.</span> Download an authenticator app like Google Authenticator, Authy or Microsoft Authenticator
          </li>
          <li className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">2.</span> Scan this QR code with your authenticator app:
            <div className="mt-2 p-4 bg-white rounded-md inline-block">
              <QRCodeSVG value={setup2FAData.qrCodeUrl} size={180} />
            </div>
          </li>
          <li className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">3.</span> Alternatively, enter this code manually into your app:
            <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 font-mono rounded-md text-center">
              {setup2FAData.secret}
            </div>
          </li>
          <li className="text-gray-700 dark:text-gray-300">
            <span className="font-semibold">4.</span> Enter the verification code from your app:
            <div className="mt-2">
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </li>
        </ol>
        
        {verify2FAError && (
          <div className="mb-4 text-red-500">{verify2FAError}</div>
        )}
        
        <div className="flex justify-between">
          <button 
            onClick={() => {
              setIsSettingUp2FA(false);
              setSetup2FAData(null);
              setVerificationCode('');
              setVerify2FAError(null);
            }}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleVerify2FA}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Verify and Enable
          </button>
        </div>
        
        <div className="mt-6">
          <h4 className="font-medium mb-2 text-gray-900 dark:text-white">Recovery Codes</h4>
          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
            Save these recovery codes in a secure location. They can be used to access your account if you lose your authentication device.
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-2 rounded-md font-mono text-sm">
            <ul>
              {setup2FAData.recoveryCodes.map((code, index) => (
                <li key={index} className="mb-1">{code}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  // Backup Dialog
  const renderBackupDialog = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
          <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">Create Encryption Key Backup</h3>
          
          {!backupString ? (
            <>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Create a password-protected backup of your encryption key. You'll need this backup to restore your encryption key if you switch devices or reinstall the app.
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Backup Password:
                </label>
                <input
                  type="password"
                  value={backupPassword}
                  onChange={(e) => setBackupPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-between">
                <button 
                  onClick={() => setShowBackupDialog(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCreateBackup}
                  disabled={!backupPassword}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
                >
                  Create Backup
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                Your backup has been created! Copy this backup string and store it securely. You'll need it along with your backup password to restore your encryption key.
              </p>
              <div className="mb-4">
                <textarea
                  readOnly
                  value={backupString}
                  onClick={(e) => e.target.select()}
                  className="w-full p-2 border rounded h-32 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-center">
                <button 
                  onClick={() => {
                    setShowBackupDialog(false);
                    setBackupString('');
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Restore Dialog
  const renderRestoreDialog = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
          <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">Restore Encryption Key</h3>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Paste your backup string and enter your backup password to restore your encryption key.
          </p>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Backup String:
            </label>
            <textarea
              value={backupString}
              onChange={(e) => setBackupString(e.target.value)}
              placeholder="Paste your backup string here"
              className="w-full p-2 border rounded h-32 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
              Backup Password:
            </label>
            <input
              type="password"
              value={restorePassword}
              onChange={(e) => setRestorePassword(e.target.value)}
              placeholder="Enter your backup password"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex justify-between">
            <button 
              onClick={() => setShowRestoreDialog(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleRestoreBackup}
              disabled={!backupString || !restorePassword}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:bg-blue-400"
            >
              Restore Key
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Recovery Codes Dialog
  const renderRecoveryCodesDialog = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
          <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">Recovery Codes</h3>
          <p className="mb-4 text-gray-700 dark:text-gray-300">
            Store these recovery codes in a secure location. Each code can be used once to access your account if you lose your authentication device.
          </p>
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md mb-4 font-mono">
            <ul className="space-y-1">
              {twoFactorSettings.recoveryCodes.map((code, index) => (
                <li key={index}>{code}</li>
              ))}
            </ul>
          </div>
          <div className="flex justify-center">
            <button 
              onClick={() => setShowRecoveryCodes(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Security Settings</h2>
      
      {/* Encryption Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">End-to-End Encryption</h3>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isEncryptionEnabled}
              onChange={handleEncryptionToggle}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1ac27d]"></div>
          </label>
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          End-to-end encryption ensures that only you and the person you're communicating with can read what's sent.
        </p>
        
        {isEncryptionEnabled && (
          <div className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Encryption Key Fingerprint: <span className="font-mono">{keyFingerprint}</span>
            </p>
          </div>
        )}
        
        {encryptionError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg">
            <p>{encryptionError}</p>
            <button 
              onClick={resetError}
              className="text-sm font-medium underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}
        
        {isEncryptionEnabled && (
          <div className="flex flex-wrap gap-2 mt-4">
            <button 
              onClick={() => setShowBackupDialog(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
            >
              Backup Encryption Key
            </button>
            <button 
              onClick={() => setShowRestoreDialog(true)}
              className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
            >
              Restore from Backup
            </button>
          </div>
        )}
      </div>
      
      {/* Two-Factor Authentication Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium text-gray-900 dark:text-white">Two-Factor Authentication</h3>
          {!isSettingUp2FA && (
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={twoFactorSettings.enabled}
                onChange={twoFactorSettings.enabled ? handleDisable2FA : handleBegin2FASetup}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[#1ac27d]"></div>
            </label>
          )}
        </div>
        
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Two-factor authentication adds an extra layer of security to your account by requiring a verification code in addition to your password.
        </p>

        {isSettingUp2FA ? (
          renderTwoFactorSetup()
        ) : twoFactorSettings.enabled && (
          <div className="mt-4">
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg mb-4">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Two-factor authentication is currently <span className="font-semibold text-green-600 dark:text-green-400">enabled</span> using authenticator app.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setShowRecoveryCodes(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                View Recovery Codes
              </button>
              <button 
                onClick={handleGenerateNewRecoveryCodes}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Generate New Codes
              </button>
            </div>
          </div>
        )}
        
        {verify2FAError && !isSettingUp2FA && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-lg">
            <p>{verify2FAError}</p>
            <button 
              onClick={() => setVerify2FAError(null)}
              className="text-sm font-medium underline mt-1"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
      
      {/* Password Section */}
      <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">Password</h3>
        <div className="flex flex-wrap gap-2">
          <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
            Change Password
          </button>
        </div>
      </div>
      
      {/* Login History Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">Login Activity</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Monitor and manage your active sessions.
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
          View Login History
        </button>
      </div>
      
      {/* Dialogs */}
      {showBackupDialog && renderBackupDialog()}
      {showRestoreDialog && renderRestoreDialog()}
      {showRecoveryCodes && renderRecoveryCodesDialog()}
    </div>
  );
};

export default SecuritySettings;