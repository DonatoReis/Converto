
// src/components/Dashboard/Header.jsx
import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Logo from '../Logo';
import ThemeToggle from '../ThemeToggle';
import firestoreService from '../../firebase/firestoreService';
import { doc, onSnapshot } from 'firebase/firestore';
import { firestore } from '../../firebase/config';

const Header = () => {
  const { darkMode } = useTheme();
  const { currentUser, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [profileImage, setProfileImage] = useState(currentUser?.photoURL || null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  
  const notificationRef = useRef(null);
  const userMenuRef = useRef(null);
  
  // Subscribe to the user document to get real-time profile image updates
  useEffect(() => {
    if (!currentUser?.id) return;
    
    // Verificar e definir imagem inicial de forma mais robusta
    let initialImage = null;
    
    // Prioridade 1: Usar photoURL do currentUser se disponível
    if (currentUser.photoURL) {
      initialImage = currentUser.photoURL;
      setImageError(false);
      setProfileImage(currentUser.photoURL);
      // Salvar no localStorage como backup
      localStorage.setItem('userProfileImage', currentUser.photoURL);
    } 
    // Prioridade 2: Tentar usar imagem do localStorage como fallback
    else if (localStorage.getItem('userProfileImage')) {
      initialImage = localStorage.getItem('userProfileImage');
      setImageError(false);
      setProfileImage(initialImage);
    }
    
    console.log('Configurando listener para imagem de perfil:', currentUser.id);
    
    // Listen for changes to the user document in Firestore
    const userDocRef = doc(firestore, 'users', currentUser.id);
    const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
      console.log('Snapshot recebido do Firestore');
      
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        if (userData.photoURL && userData.photoURL !== profileImage) {
          console.log('Nova imagem detectada no Firestore');
          setProfileImage(userData.photoURL);
          setImageError(false);
          // Salvar no localStorage como backup
          localStorage.setItem('userProfileImage', userData.photoURL);
        }
      }
    }, (error) => {
      console.error('Erro ao observar documento de usuário:', error);
      // Tentar fallback para localStorage se houver erro
      if (localStorage.getItem('userProfileImage')) {
        setProfileImage(localStorage.getItem('userProfileImage'));
      }
    });
    
    return () => unsubscribe();
  }, [currentUser]);
  
  // Load notifications from database
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        // Get unread notifications from conversations
        let conversations = [];
        try {
          conversations = await firestoreService.getAllConversations();
        } catch (error) {
          console.error('Error loading conversations:', error);
          conversations = [];
        }
        
        const unreadNotifications = [];
        conversations.forEach(conversation => {
          if (conversation.unreadCount && conversation.unreadCount > 0) {
            // Find the last message in the conversation
            const lastMessage = conversation.messages && conversation.messages.length > 0 
              ? conversation.messages[conversation.messages.length - 1] 
              : null;
              
            // Find the contact name from participants (exclude current user)
            const contact = conversation.participants.find(p => 
              p.id !== 'current_user' && p.id !== Database.getCurrentUser().id
            );
            
            if (lastMessage && contact) {
              unreadNotifications.push({
                id: `notif_${conversation.id}`,
                text: `Nova mensagem de ${contact.name}`,
                time: lastMessage.time || 'agora',
                conversationId: conversation.id
              });
            }
          }
        });
        
        setNotifications(unreadNotifications);
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    
    // Load notifications initially
    loadNotifications();
    
    // Set up interval to check for new notifications every 30 seconds
    const intervalId = setInterval(loadNotifications, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Handle clicks outside of menus
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleClearAllNotifications = () => {
    // Reset unread count for all conversations
    try {
      const conversations = Database.getAllConversations();
      conversations.forEach(conversation => {
        if (conversation.unreadCount && conversation.unreadCount > 0) {
          Database.updateConversation(conversation.id, {
            unreadCount: 0
          });
        }
      });
      
      // Clear notifications array
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };
  
  const handleLogout = () => {
    // Call the logout function from the auth context
    logout();
  };

  return (
    <header className={`h-16 px-4 flex items-center justify-between border-b ${
      darkMode ? 'bg-[#121212] border-gray-700' : 'bg-white border-[#121212]/10'
    }`}>
      {/* Logo */}
      <div className="flex items-center">
        <Logo darkMode={darkMode} className="h-8" />
      </div>

      {/* Right section: notifications, theme toggle, and profile */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 rounded-full hover:bg-gray-100 ${darkMode ? 'hover:bg-gray-700' : ''}`}
            aria-label="Notificações"
          >
            <div className="relative">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </div>
          </button>

          {/* Notifications dropdown */}
          {showNotifications && (
            <div className={`absolute right-0 mt-2 w-80 rounded-lg shadow-lg py-1 ${
              darkMode ? 'bg-[#121212] border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              {/* Notification header with Clear All button */}
              <div className={`px-4 py-2 flex justify-between items-center border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  Notificações ({notifications.length})
                </h3>
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAllNotifications}
                    className={`text-xs ${
                      darkMode 
                        ? 'text-red-400 hover:text-red-300' 
                        : 'text-red-600 hover:text-red-700'
                    } font-medium`}
                  >
                    Limpar Tudo
                  </button>
                )}
              </div>
              
              {notifications.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Nenhuma notificação.
                  </p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`px-4 py-3 hover:bg-gray-50 ${darkMode ? 'hover:bg-gray-700' : ''} cursor-pointer`}
                    onClick={() => {
                      // Navigate to the conversation when notification is clicked
                      if (notification.conversationId) {
                        window.location.href = `/dashboard/chat?conversation=${notification.conversationId}`;
                      }
                      setShowNotifications(false);
                    }}
                  >
                    <p className="text-sm">{notification.text}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{notification.time}</p>
                  </div>
                ))
              )}
              <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} mt-1 pt-1`}>
                <Link
                  to="/dashboard/notifications"
                  className={`block px-4 py-2 text-sm text-center ${darkMode ? 'text-[#64DFDF]' : 'text-[#340068]'} hover:underline`}
                >
                  Ver todas as notificações
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* User profile */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center space-x-2"
            aria-label="Menu do usuário"
          >
            {profileImage && !imageError ? (
              <div className="relative h-8 w-8 rounded-full overflow-hidden">
                {imageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-200 dark:bg-gray-700">
                    <div className="w-5 h-5 border-2 border-t-2 border-gray-500 rounded-full animate-spin"></div>
                  </div>
                )}
                <img
                  src={profileImage}
                  alt={currentUser?.name || 'Usuário'}
                  className="h-8 w-8 object-cover rounded-full"
                  onLoad={() => setImageLoading(false)}
                  onError={() => {
                    setImageError(true);
                    setImageLoading(false);
                  }}
                />
              </div>
            ) : (
              <div className={`h-8 w-8 rounded-full bg-[#340068] flex items-center justify-center text-white text-sm font-medium`}>
                {currentUser?.name?.charAt(0) || 'U'}
              </div>
            )}
          </button>

          {/* User menu dropdown */}
          {showUserMenu && (
            <div className={`absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 ${
              darkMode ? 'bg-[#121212] border border-gray-700' : 'bg-white border border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-3 mb-2">
                  {profileImage && !imageError ? (
                    <img 
                      src={profileImage} 
                      alt={currentUser?.name || 'Usuário'} 
                      className="h-10 w-10 rounded-full object-cover"
                      onError={() => setImageError(true)}
                    />
                  ) : (
                    <div className={`h-10 w-10 rounded-full bg-[#340068] flex items-center justify-center text-white text-sm font-medium`}>
                      {currentUser?.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium truncate">{currentUser?.name}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                      {currentUser?.email}
                    </p>
                  </div>
                </div>
              </div>
              <Link
                to="/dashboard/profile"
                className={`block px-4 py-2 text-sm hover:bg-gray-50 ${darkMode ? 'hover:bg-gray-700' : ''}`}
              >
                Perfil
              </Link>
              <Link
                to="/dashboard/settings"
                className={`block px-4 py-2 text-sm hover:bg-gray-50 ${darkMode ? 'hover:bg-gray-700' : ''}`}
              >
                Configurações
              </Link>
              <button
                onClick={handleLogout}
                className={`block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 ${
                  darkMode ? 'hover:bg-gray-700' : ''
                }`}
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
