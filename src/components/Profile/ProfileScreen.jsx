// src/components/Profile/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import EditableField from './EditableField';
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';
import PrivacySettings from './PrivacySettings';
import BlockedContacts from './BlockedContacts';
import AccountSettings from './AccountSettings';
import Database from '../../utils/database';
import { serverTimestamp } from 'firebase/firestore';
const ProfileScreen = () => {
  const { darkMode } = useTheme();
  const { currentUser, updateUserAvatar } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState({
    show: false,
    type: '', // 'success' or 'error'
    message: ''
  });
  // Loading state to show loading indicators
  const [isLoading, setIsLoading] = useState(true);
  
  // Extended profile data with all required fields including address
  const [profileData, setProfileData] = useState({
    name: '',
    fullName: '',
    company: '',
    position: '',
    email: '',
    phone: '',
    document: '', // CPF/CNPJ
    avatar: '', // Using empty string instead of null as a safe default
    // Address fields in a nested structure
    address: {
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    },
    // Metadata fields
    createdAt: null,
    updatedAt: null
  });

  // Notification settings with defaults
  const [notificationSettings, setNotificationSettings] = useState({
    messages: true,
    leads: true,
    promotions: false
  });
  
  // Global function to refresh user data - can be called from anywhere
  const refreshUserData = async (forceFetch = false) => {
    console.log('🔄 Refreshing user data, force fetch =', forceFetch);
    
    // Try restoring from session storage first if not forcing a fetch
    if (!forceFetch) {
      try {
        const sessionData = sessionStorage.getItem('profileData');
        if (sessionData) {
          const parsedData = JSON.parse(sessionData);
          console.log('📋 Restored profile data from session storage');
          setProfileData(parsedData);
          // Still continue with Firestore fetch to get the latest data
        }
      } catch (e) {
        console.error('Error restoring from session storage:', e);
      }
    }
    
    // Then fetch from Firestore
    if (currentUser && currentUser.id) {
      try {
        setIsLoading(true);
        console.log('🔍 Fetching user data from Firestore for ID:', currentUser.id);
        
        const userData = await Database.getUser(currentUser.id);
        
        if (userData) {
          console.log('✅ User data successfully fetched from Firestore:', userData);
          
          // Build complete profile data from Firestore data
          const fullProfileData = {
            name: userData.name || userData.fullName || '',
            fullName: userData.fullName || userData.name || '',
            company: userData.company || '',
            position: userData.position || '',
            email: userData.email || currentUser.email || '',
            phone: userData.phone || '',
            document: userData.document || '',
            avatar: userData.avatar || userData.photoURL || '',
            address: {
              cep: userData.address?.cep || '',
              street: userData.address?.street || '',
              number: userData.address?.number || '',
              complement: userData.address?.complement || '',
              neighborhood: userData.address?.neighborhood || '',
              city: userData.address?.city || '',
              state: userData.address?.state || '',
            },
            createdAt: userData.createdAt || null,
            updatedAt: userData.updatedAt || null
          };
          
          // Save to session storage for quick recovery on page refresh
          sessionStorage.setItem('profileData', JSON.stringify(fullProfileData));
          
          // Update state
          setProfileData(fullProfileData);
          
          // Cache the avatar in localStorage
          if (fullProfileData.avatar) {
            localStorage.setItem('userProfileImage', fullProfileData.avatar);
          }
          
          return fullProfileData;
        } else {
          console.warn('⚠️ No user data found in Firestore');
        }
      } catch (error) {
        console.error('❌ Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      console.warn('⚠️ Cannot fetch user data - no current user or user ID');
    }
    return null;
  };
  
  // Fetch complete user profile data from Firestore with retries
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const MAX_RETRIES = 3;
    
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        
        if (!currentUser || !currentUser.id) {
          console.log('No current user available for profile data fetch');
          if (isMounted) setIsLoading(false);
          return;
        }
        
        console.log('Fetching complete user data from Firestore for user ID:', currentUser.id);
        
        // Get complete user data from Firestore
        const userData = await Database.getUser(currentUser.id);
        
        if (!isMounted) return;
        
        console.log('Raw user data from Firestore:', userData);
        
        if (userData) {
          // Field name mapping for various possible data models to ensure consistency
          // This handles different field naming conventions between registration and profile display
          const nameField = userData.name || userData.fullName || userData.displayName || currentUser.name || currentUser.displayName;
          const emailField = userData.email || currentUser.email;
          const companyField = userData.company || userData.organization;
          const positionField = userData.position || userData.title || userData.role;
          const phoneField = userData.phone || userData.phoneNumber || userData.telefone;
          const documentField = userData.document || userData.cpfCnpj || userData.documentNumber || '';
          
          // Handle address fields with fallbacks for different structures
          const addressData = userData.address || {};
          
          const mappedAddress = {
            cep: addressData.cep || addressData.zipCode || addressData.postalCode || '',
            street: addressData.street || addressData.logradouro || addressData.streetName || '',
            number: addressData.number || addressData.streetNumber || '',
            complement: addressData.complement || addressData.complemento || '',
            neighborhood: addressData.neighborhood || addressData.bairro || addressData.district || '',
            city: addressData.city || addressData.cidade || addressData.cityName || '',
            state: addressData.state || addressData.estado || addressData.stateCode || ''
          };
          
          console.log('Mapped address data:', mappedAddress);
          
          // Prioridade para o avatar: Firestore > currentUser > localStorage > valor atual
          // Changed priority to favor persistent storage (Firestore) over volatile storage (localStorage)
          const avatarImage = userData.photoURL || 
                             userData.avatar || 
                             currentUser.photoURL || 
                             localStorage.getItem('userProfileImage') || 
                             profileData.avatar;
          
          // Format the createdAt timestamp for display if available
          const createdAtDate = userData.createdAt ? 
            (userData.createdAt instanceof Date ? userData.createdAt : 
             userData.createdAt.toDate ? userData.createdAt.toDate() : 
             new Date(userData.createdAt)) : null;
          
          console.log('Mapped user data fields:', {
            name: nameField,
            email: emailField,
            company: companyField,
            position: positionField,
            phone: phoneField,
            document: documentField,
            avatar: avatarImage ? 'Avatar present' : 'No avatar',
            address: mappedAddress,
            createdAt: createdAtDate
          });
          
          setProfileData(prevData => {
            return {
              ...prevData,
              name: nameField || prevData.name,
              fullName: userData.fullName || nameField || prevData.fullName,
              email: emailField || prevData.email,
              company: companyField || prevData.company,
              position: positionField || prevData.position,
              phone: phoneField || prevData.phone,
              document: documentField || prevData.document,
              avatar: avatarImage || prevData.avatar,
              address: {
                ...prevData.address,
                ...mappedAddress
              },
              createdAt: createdAtDate || prevData.createdAt,
              updatedAt: userData.updatedAt || null
            };
          });
          
          // Se temos uma imagem de perfil, garantir que está no localStorage
          if (avatarImage) {
            localStorage.setItem('userProfileImage', avatarImage);
          }
        } else {
          console.log('No additional user data found in Firestore, using basic auth data');
          
          // Fallback to basic currentUser data from auth
          const avatarImage = currentUser.photoURL || localStorage.getItem('userProfileImage') || profileData.avatar;
          
          setProfileData(prevData => {
            return {
              ...prevData,
              name: currentUser.name || prevData.name,
              fullName: currentUser.displayName || currentUser.name || prevData.fullName,
              email: currentUser.email || prevData.email,
              avatar: avatarImage,
            };
          });
          
          if (avatarImage) {
            localStorage.setItem('userProfileImage', avatarImage);
          }
          
          // If we didn't find the user data but should have, retry
          if (retryCount < MAX_RETRIES) {
            console.log(`Retrying user data fetch (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
            retryCount++;
            // Retry after a short delay (exponential backoff)
            setTimeout(fetchUserData, 1000 * Math.pow(2, retryCount));
          }
        }
      } catch (error) {
        console.error('Error fetching user profile data:', error);
        
        // Retry on error
        if (retryCount < MAX_RETRIES) {
          console.log(`Error occurred, retrying user data fetch (attempt ${retryCount + 1} of ${MAX_RETRIES})...`);
          retryCount++;
          // Retry after a short delay
          setTimeout(fetchUserData, 1000 * Math.pow(2, retryCount));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    
    fetchUserData();
    
    
    // Add event listener for storage events (allows synchronization across tabs)
    const handleStorageChange = (e) => {
      if (e.key === 'profileData' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          setProfileData(data);
          console.log('Profile data updated from another tab');
        } catch (error) {
          console.error('Error parsing profile data from storage:', error);
        }
      }
    };
    
    // Add visibility change listener to refresh data when tab becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Tab became visible, refreshing data');
        refreshUserData(false); // false = try session storage first
      }
    };
    
    // Add the event listeners
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Cleanup on unmount
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Check for hash in URL to set active tab on load and when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && ['profile', 'account', 'notifications', 'privacy', 'security', 'blocked'].includes(hash)) {
        setActiveTab(hash);
      }
    };

    // Set initial tab based on hash
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  // Update hash when tab changes
  useEffect(() => {
    window.location.hash = activeTab;
  }, [activeTab]);

  const handleProfileUpdate = (field, value) => {
    setProfileData({
      ...profileData,
      [field]: value
    });
  };

  // Show notification toast
  const showNotification = (type, message) => {
    setNotification({
      show: true,
      type,
      message
    });

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setNotification({
        show: false,
        type: '',
        message: ''
      });
    }, 3000);
  };

  // Function to optimize image size
  const optimizeImage = (dataUrl, maxWidth) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round(height * maxWidth / width);
          width = maxWidth;
        }
        
        // Create canvas and resize image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Draw resized image
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert back to DataURL with lower quality
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      
      img.src = dataUrl;
    });
  };
  
  // Save profile data to database
  const saveProfileData = async (showNotifications = true) => {
    try {
      setIsSaving(true);
      
      // Use currentUser from context
      if (!currentUser || !currentUser.id) {
        throw new Error("Usuário não encontrado ou não autenticado");
      }
      
      // Prepare data with consistent field names for Firestore
      // This ensures we save with both conventional names for maximum compatibility
      const dataToSave = {
        // Core fields with multiple name formats for better compatibility
        name: profileData.name,
        fullName: profileData.fullName || profileData.name, // Also save as fullName for the registration format
        email: profileData.email,
        company: profileData.company,
        position: profileData.position,
        phone: profileData.phone,
        document: profileData.document, // CPF/CNPJ
        // Save avatar in both conventional formats
        avatar: profileData.avatar,
        photoURL: profileData.avatar,
        avatarUrl: profileData.avatar, // Third format for maximum compatibility
        // Save address data (use complete object with all fields)
        address: {
          cep: profileData.address?.cep || '',
          street: profileData.address?.street || '',
          number: profileData.address?.number || '',
          complement: profileData.address?.complement || '',
          neighborhood: profileData.address?.neighborhood || '',
          city: profileData.address?.city || '',
          state: profileData.address?.state || ''
        },
        // Add metadata
        updatedAt: serverTimestamp(),
        lastUpdated: new Date().toISOString(),
      };
      // Update user in database
      await Database.updateUser(currentUser.id, dataToSave);
      
      // Ensure the avatar is saved in localStorage for quick loading on return visits
      if (profileData.avatar) {
        localStorage.setItem('userProfileImage', profileData.avatar);
      }
      
      // Save to session storage for quick recovery on page refresh
      sessionStorage.setItem('profileData', JSON.stringify({
        ...profileData,
        updatedAt: new Date().toISOString()
      }));
      
      // Only show notifications if requested (to avoid duplicate messages)
      if (showNotifications) {
        showNotification('success', 'Perfil atualizado com sucesso!');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      showNotification('error', 'Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save notification settings
  const saveNotificationSettings = async () => {
    try {
      setIsSaving(true);
      
      // Get current user
      const currentUser = Database.getCurrentUser();
      if (!currentUser) {
        throw new Error("Usuário não encontrado");
      }
      
      // Update notification settings
      await Database.updateUserSettings(currentUser.id, {
        notifications: notificationSettings
      });
      
      showNotification('success', 'Preferências de notificação atualizadas!');
    } catch (error) {
      console.error('Error saving notification settings:', error);
      showNotification('error', 'Erro ao atualizar preferências. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      try {
        // Mostrar feedback visual imediato
        showNotification('success', 'Processando imagem...');
        
        const file = e.target.files[0];
        
        // Verificar tamanho máximo (2MB)
        if (file.size > 2 * 1024 * 1024) {
          showNotification('error', 'Imagem muito grande. Máximo: 2MB');
          return;
        }
        
        const reader = new FileReader();
        reader.onload = async (event) => {
          const avatarDataUrl = event.target.result;
          
          try {
            // Optimize the image if it's too large for Firestore
            let optimizedDataUrl = avatarDataUrl;
            
            // If the DataURL is extremely large (> 800KB), resize it
            if (avatarDataUrl.length > 800 * 1024) {
              console.log('Image is large, optimizing before storage');
              optimizedDataUrl = await optimizeImage(avatarDataUrl, 600); // max width 600px
            }
            
            // Atualizar estado local imediatamente
            setProfileData(prevData => ({
              ...prevData,
              avatar: optimizedDataUrl
            }));
            
            // Salvar em sessionStorage para persistência entre páginas
            const sessionData = sessionStorage.getItem('profileData');
            if (sessionData) {
              const parsedData = JSON.parse(sessionData);
              parsedData.avatar = optimizedDataUrl;
              sessionStorage.setItem('profileData', JSON.stringify(parsedData));
            }
            
            // Salvar no localStorage como backup imediato para UI
            localStorage.setItem('userProfileImage', optimizedDataUrl);
            
            // Atualizar no contexto/Firestore com todas as informações do perfil
            // para garantir consistência (avatar + outros campos)
            await updateUserAvatar(optimizedDataUrl);
            
            // Também atualizar todos os dados do perfil para garantir consistência
            await saveProfileData(false); // false = não mostrar notificação duplicada
            
            showNotification('success', 'Imagem de perfil atualizada com sucesso!');
          } catch (error) {
            console.error('Erro detalhado:', error);
            showNotification('error', `Erro ao salvar imagem: ${error.message}`);
          }
        };
        
        reader.onerror = () => {
          showNotification('error', 'Erro ao ler o arquivo');
        };
        
        // Iniciar leitura do arquivo
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Erro ao processar avatar:', error);
        showNotification('error', 'Erro ao processar imagem. Tente novamente.');
      }
    }
  };
  
  const handleNotificationChange = (setting, value) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: value
    });
  };

  const handleLogout = () => {
    // In a real app, would handle logout
    alert('Logout clicked. In a real app, this would log you out.');
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-opacity ${
          notification.type === 'success'
            ? darkMode ? 'bg-green-700/90 text-white' : 'bg-green-500 text-white'
            : darkMode ? 'bg-red-700/90 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className={`px-6 py-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F7FF]'} border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Perfil & Configurações
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie seus dados pessoais e preferências
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-800'}`}>
              <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
              Pro
            </span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className={`p-4 border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
        <div className="flex space-x-4 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              activeTab === 'profile'
                ? darkMode 
                  ? 'bg-[#2B4FFF] text-white' 
                  : 'bg-[#2B4FFF] text-white'
                : darkMode
                ? 'bg-transparent text-gray-400 hover:bg-[#333333]'
                : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              activeTab === 'account'
                ? darkMode 
                  ? 'bg-[#2B4FFF] text-white' 
                  : 'bg-[#2B4FFF] text-white'
                : darkMode
                ? 'bg-transparent text-gray-400 hover:bg-[#333333]'
                : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            Conta
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              activeTab === 'notifications'
                ? darkMode 
                  ? 'bg-[#2B4FFF] text-white' 
                  : 'bg-[#2B4FFF] text-white'
                : darkMode
                ? 'bg-transparent text-gray-400 hover:bg-[#333333]'
                : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            Notificações
          </button>
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              activeTab === 'privacy'
                ? darkMode 
                  ? 'bg-[#2B4FFF] text-white' 
                  : 'bg-[#2B4FFF] text-white'
                : darkMode
                ? 'bg-transparent text-gray-400 hover:bg-[#333333]'
                : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            Privacidade
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              activeTab === 'security'
                ? darkMode 
                  ? 'bg-[#2B4FFF] text-white' 
                  : 'bg-[#2B4FFF] text-white'
                : darkMode
                ? 'bg-transparent text-gray-400 hover:bg-[#333333]'
                : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            Segurança
          </button>
          <button
            onClick={() => setActiveTab('blocked')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
              activeTab === 'blocked'
                ? darkMode 
                  ? 'bg-[#2B4FFF] text-white' 
                  : 'bg-[#2B4FFF] text-white'
                : darkMode
                ? 'bg-transparent text-gray-400 hover:bg-[#333333]'
                : 'bg-transparent text-gray-500 hover:bg-gray-100'
            }`}
          >
            Bloqueados
          </button>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'profile' && (
          <div>
            {/* Profile Avatar */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full overflow-hidden border-4 ${darkMode ? 'border-[#1F1F1F]' : 'border-white'} shadow-md`}>
                  {profileData.avatar ? (
                    <img src={profileData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center text-2xl font-bold ${
                      darkMode ? 'bg-gradient-to-br from-[#2B4FFF] to-[#BA5AFF] text-white' : 'bg-gradient-to-br from-[#2B4FFF] to-[#BA5AFF] text-white'
                    }`}>
                      {profileData.name.charAt(0)}
                    </div>
                  )}
                </div>
                
                {/* Upload button */}
                <label 
                  className={`absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                    darkMode ? 'bg-[#2B4FFF] text-white' : 'bg-[#2B4FFF] text-white'
                  }`}
                >
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </label>
              </div>
            </div>
            
            {/* Profile Information */}
            <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1F1F1F]' : 'bg-white'} ${darkMode ? '' : 'shadow'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                Informações Pessoais
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableField
                  label="Nome"
                  value={profileData.name}
                  onSave={(value) => handleProfileUpdate('name', value)}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Empresa"
                  value={profileData.company}
                  onSave={(value) => handleProfileUpdate('company', value)}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Cargo"
                  value={profileData.position}
                  onSave={(value) => handleProfileUpdate('position', value)}
                  darkMode={darkMode}
                />
                <EditableField
                  label="E-mail"
                  value={profileData.email}
                  type="email"
                  onSave={(value) => handleProfileUpdate('email', value)}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Telefone"
                  value={profileData.phone}
                  onSave={(value) => handleProfileUpdate('phone', value)}
                  darkMode={darkMode}
                />
                <EditableField
                  label="CPF/CNPJ"
                  value={profileData.document}
                  onSave={(value) => handleProfileUpdate('document', value)}
                  darkMode={darkMode}
                />
              </div>
            </div>

            {/* Address Information */}
            <div className={`mt-6 p-6 rounded-lg ${darkMode ? 'bg-[#1F1F1F]' : 'bg-white'} ${darkMode ? '' : 'shadow'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                Endereço
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EditableField
                  label="CEP"
                  value={profileData.address.cep}
                  onSave={(value) => handleProfileUpdate('address', {...profileData.address, cep: value})}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Rua"
                  value={profileData.address.street}
                  onSave={(value) => handleProfileUpdate('address', {...profileData.address, street: value})}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Número"
                  value={profileData.address.number}
                  onSave={(value) => handleProfileUpdate('address', {...profileData.address, number: value})}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Complemento"
                  value={profileData.address.complement}
                  onSave={(value) => handleProfileUpdate('address', {...profileData.address, complement: value})}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Bairro"
                  value={profileData.address.neighborhood}
                  onSave={(value) => handleProfileUpdate('address', {...profileData.address, neighborhood: value})}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Cidade"
                  value={profileData.address.city}
                  onSave={(value) => handleProfileUpdate('address', {...profileData.address, city: value})}
                  darkMode={darkMode}
                />
                <EditableField
                  label="Estado"
                  value={profileData.address.state}
                  onSave={(value) => handleProfileUpdate('address', {...profileData.address, state: value})}
                  darkMode={darkMode}
                />
              </div>
              
              {/* Save Profile Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={saveProfileData}
                  disabled={isSaving}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    darkMode 
                      ? 'bg-[#2B4FFF] hover:bg-[#3D2AFF] text-white' 
                      : 'bg-[#2B4FFF] hover:bg-[#3D2AFF] text-white'
                  } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {isSaving ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvando...
                    </span>
                  ) : (
                    'Salvar Perfil'
                  )}
                </button>
              </div>
            </div>
            
            {/* About App */}
            <div className={`mt-6 p-6 rounded-lg ${darkMode ? 'bg-[#1F1F1F]' : 'bg-white'} ${darkMode ? '' : 'shadow'}`}>
              <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                Sobre o App
              </h2>
              
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="mb-2">
                  <span className="font-medium">Versão:</span> 1.2.0
                </div>
                <div className="mb-2">
                  <a href="#" className={`${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'} hover:underline`}>
                    Termos de uso
                  </a>
                </div>
                <div className="mb-2">
                  <a href="#" className={`${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'} hover:underline`}>
                    Política de privacidade
                  </a>
                </div>
                <div>
                  <a href="#" className={`${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'} hover:underline`}>
                    Contatar suporte
                  </a>
                </div>
              </div>
            </div>
            
            {/* Logout button */}
            <div className="mt-6">
              <button
                onClick={handleLogout}
                className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
                  darkMode 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-red-50 text-red-600 hover:bg-red-100'
                }`}
              >
                Sair da conta
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'account' && (
          <AccountSettings />
        )}
        
        {activeTab === 'notifications' && (
          <div>
            <NotificationSettings
              settings={notificationSettings}
              onChange={handleNotificationChange}
              darkMode={darkMode}
            />
            
            {/* Replace the existing Save button with our updated version */}
            <div className="mt-6 flex justify-end">
              <button
                onClick={saveNotificationSettings}
                disabled={isSaving}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  darkMode 
                    ? 'bg-[#2B4FFF] hover:bg-[#3D2AFF] text-white' 
                    : 'bg-[#2B4FFF] hover:bg-[#3D2AFF] text-white'
                } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando...
                  </span>
                ) : (
                  'Salvar Preferências'
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <PrivacySettings />
        )}
        
        {activeTab === 'security' && (
          <SecuritySettings />
        )}
        
        {activeTab === 'blocked' && (
          <BlockedContacts />
        )}
      </div>
    </div>
  );
};

export default ProfileScreen;