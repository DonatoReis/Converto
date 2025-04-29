// src/components/NotificationPrompt.jsx
import React, { useState, useEffect } from 'react';
import messagingService from '../firebase/messagingService';
import { useAuth } from '../context/AuthContext';

// LocalStorage key for tracking notification permission state
const NOTIFICATION_PROMPT_KEY = 'notification_prompt_status';

const NotificationPrompt = ({ onClose, darkMode = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Check if we should show the prompt
    const checkPromptStatus = async () => {
      // If notifications aren't supported, don't show prompt
      if (!('Notification' in window)) {
        return;
      }

      // If permission is already granted, don't show prompt
      if (Notification.permission === 'granted') {
        return;
      }

      // If permission is denied, don't show prompt
      if (Notification.permission === 'denied') {
        return;
      }

      // Check if we've asked before
      const promptStatus = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
      if (promptStatus === 'dismissed') {
        // Don't show if user dismissed within the last 7 days
        const dismissedAt = localStorage.getItem(NOTIFICATION_PROMPT_KEY + '_timestamp');
        if (dismissedAt) {
          const dismissedDate = new Date(parseInt(dismissedAt, 10));
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          if (dismissedDate > sevenDaysAgo) {
            return;
          }
        }
      }

      // Show the prompt
      setIsVisible(true);
    };

    // Run the check
    checkPromptStatus();
  }, []);

  const handleEnable = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Register service worker first
      await messagingService.registerServiceWorker();
      
      // Request permission
      const permissionGranted = await messagingService.requestNotificationPermission();
      
      if (permissionGranted) {
        // If user is logged in, get and save token
        if (currentUser?.id) {
          const token = await messagingService.getFCMToken();
          if (token) {
            await messagingService.saveFCMToken(currentUser.id, token);
          }
        }
        
        // Mark as enabled in localStorage
        localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'enabled');
        localStorage.setItem(NOTIFICATION_PROMPT_KEY + '_timestamp', Date.now().toString());
        
        // Hide prompt
        setIsVisible(false);
        if (onClose) onClose('enabled');
      } else {
        // If permission was denied
        localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'denied');
        localStorage.setItem(NOTIFICATION_PROMPT_KEY + '_timestamp', Date.now().toString());
        
        // Hide prompt
        setIsVisible(false);
        if (onClose) onClose('denied');
      }
    } catch (err) {
      console.error('Error enabling notifications:', err);
      setError('Não foi possível ativar as notificações. Por favor, tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    // Mark as dismissed in localStorage with timestamp
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, 'dismissed');
    localStorage.setItem(NOTIFICATION_PROMPT_KEY + '_timestamp', Date.now().toString());
    
    // Hide prompt
    setIsVisible(false);
    if (onClose) onClose('dismissed');
  };

  // If not visible, don't render anything
  if (!isVisible) {
    return null;
  }

  return (
    <div className={`fixed bottom-4 right-4 left-4 md:left-auto md:w-96 z-50 ${darkMode ? 'bg-[#1F1F1F] text-white' : 'bg-white text-gray-800'} rounded-xl shadow-lg overflow-hidden`}>
      <div className="relative p-5">
        {/* Decoration */}
        <div className="absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 opacity-10">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
          </svg>
        </div>

        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className={`absolute top-2 right-2 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
          aria-label="Fechar"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="flex items-start mb-4">
          <div className={`mr-4 p-2 rounded-full ${darkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Ativar Notificações
            </h3>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Receba alertas em tempo real sobre novas mensagens, mesmo quando não estiver usando o aplicativo.
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className={`mb-4 p-3 text-sm rounded ${darkMode ? 'bg-red-900/20 text-red-400' : 'bg-red-100 text-red-600'}`}>
            {error}
          </div>
        )}

        {/* Buttons */}
        <div className="flex space-x-3 mt-4">
          <button
            onClick={handleDismiss}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium ${
              darkMode 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } transition-colors duration-200`}
          >
            Agora não
          </button>
          <button
            onClick={handleEnable}
            disabled={isLoading}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200
              ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ativando...
              </span>
            ) : (
              'Ativar notificações'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPrompt;

