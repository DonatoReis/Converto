// src/context/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut, 
  browserLocalPersistence, 
  setPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '../firebase/config';
import firestoreService from '../firebase/firestoreService';

// SSO config - In a real app, these would be environment variables
const SSO_CONFIG = {
  google: {
    clientId: 'google-client-id',
    redirectUri: window.location.origin + '/auth/callback',
  },
  microsoft: {
    clientId: 'microsoft-client-id',
    redirectUri: window.location.origin + '/auth/callback',
    tenantId: 'common',
  },
  github: {
    clientId: 'github-client-id',
    redirectUri: window.location.origin + '/auth/callback',
  }
};
const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Set authentication persistence to LOCAL
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        // Use browserLocalPersistence for longer-term authentication
        await setPersistence(auth, browserLocalPersistence);
        console.log('Authentication persistence set to LOCAL');
      } catch (error) {
        console.error('Error setting persistence:', error);
      }
    };
    
    setupPersistence();
  }, []);

  // Listen for authentication state changes
  useEffect(() => {
    console.log('Setting up auth state change listener');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // User is signed in
        console.log('User authenticated with ID:', user.uid);
        try {
          // Get additional user data from Firestore if needed
          const userDocRef = doc(firestore, 'users', user.uid);
          
          // Add defensive code to ensure uid is valid
          if (!user.uid) {
            throw new Error('Auth user has no UID');
          }
          
          console.log('Fetching additional user data from Firestore');
          const userDoc = await getDoc(userDocRef);
          
          let userData = null;
          
          if (userDoc.exists()) {
            // Get the Firestore data
            const firestoreData = userDoc.data();
            console.log('User document found in Firestore:', firestoreData);
            
            // Create default address object if none exists
            const address = firestoreData.address || {};
            
            // Combine auth user with additional profile data
            userData = { 
              id: user.uid,
              email: user.email || firestoreData.email,
              name: user.displayName || firestoreData.name || firestoreData.fullName,
              fullName: firestoreData.fullName || firestoreData.name || user.displayName,
              company: firestoreData.company || '',
              position: firestoreData.position || '',
              phone: firestoreData.phone || '',
              document: firestoreData.document || firestoreData.cpfCnpj || '',
              photoURL: firestoreData.photoURL || user.photoURL,
              avatar: firestoreData.avatar || firestoreData.photoURL || user.photoURL,
              address: {
                cep: address.cep || '',
                street: address.street || '',
                number: address.number || '',
                complement: address.complement || '',
                neighborhood: address.neighborhood || '',
                city: address.city || '',
                state: address.state || ''
              },
              createdAt: firestoreData.createdAt || null,
              updatedAt: firestoreData.updatedAt || null,
              ...firestoreData // Include any other fields from Firestore
            };
            
            // Cache the avatar URL in localStorage for quick access on reload
            if (userData.photoURL || userData.avatar) {
              localStorage.setItem('userProfileImage', userData.photoURL || userData.avatar);
            }
          } else {
            // Use basic auth data if no additional profile exists
            console.log('No user document found in Firestore, creating initial user data');
            userData = {
              id: user.uid,
              name: user.displayName || 'Usuário',
              fullName: user.displayName || 'Usuário',
              email: user.email,
              photoURL: user.photoURL,
              avatar: user.photoURL,
              address: {
                cep: '',
                street: '',
                number: '',
                complement: '',
                neighborhood: '',
                city: '',
                state: ''
              }
            };
            
            // Create a new Firestore document for the user
            try {
              await setDoc(userDocRef, {
                id: user.uid,
                name: user.displayName || 'Usuário',
                fullName: user.displayName || 'Usuário',
                email: user.email,
                photoURL: user.photoURL,
                avatar: user.photoURL,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                address: {}
              });
              console.log('Created new user document in Firestore');
            } catch (createError) {
              console.error('Failed to create new user document:', createError);
            }
          }
          
          console.log('Setting current user data:', userData);
          setCurrentUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Still set basic user info even if additional data fetch fails
          setCurrentUser({
            id: user.uid,
            name: user.displayName || 'Usuário',
            email: user.email,
            photoURL: user.photoURL
          });
          setIsAuthenticated(true);
        }
      } else {
        // User is signed out
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      setLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Login function with Firebase Authentication
  const login = async (email, password) => {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // User data will be set by the onAuthStateChanged listener
      return userCredential.user;
    } catch (error) {
      console.error("Login error:", error);
      
      // Translate Firebase errors to user-friendly messages
      let errorMessage = "Falha na autenticação. Por favor, tente novamente.";
      
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        errorMessage = "Email ou senha incorretos.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "Usuário não encontrado. Verifique seu email.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Muitas tentativas. Tente novamente mais tarde.";
      }
      
      throw new Error(errorMessage);
    }
  };

  // Google SSO login with Firebase Authentication
  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add optional scopes if needed
      provider.addScope('profile');
      provider.addScope('email');
      
      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      
      // Optional: Store additional user data in Firestore
      const user = result.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          authProvider: 'google',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        // Update last login
        await setDoc(userDocRef, { 
          lastLogin: serverTimestamp() 
        }, { merge: true });
      }
      
      return user;
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  // Microsoft SSO login with Firebase Authentication
  const loginWithMicrosoft = async () => {
    try {
      const provider = new OAuthProvider('microsoft.com');
      
      // Configure provider settings
      provider.setCustomParameters({
        tenant: SSO_CONFIG.microsoft.tenantId
      });
      
      // Sign in with popup
      const result = await signInWithPopup(auth, provider);
      
      // Optional: Store additional user data in Firestore
      const user = result.user;
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        // Create user document if it doesn't exist
        await setDoc(userDocRef, {
          name: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          authProvider: 'microsoft',
          createdAt: serverTimestamp(),
          lastLogin: serverTimestamp()
        });
      } else {
        // Update last login
        await setDoc(userDocRef, { 
          lastLogin: serverTimestamp() 
        }, { merge: true });
      }
      
      return user;
    } catch (error) {
      console.error("Microsoft login error:", error);
      throw error;
    }
  };

  // GitHub SSO login
  const loginWithGithub = () => {
    return new Promise((resolve, reject) => {
      // In a real app, this would use the GitHub OAuth API
      console.log('Authenticating with GitHub...');
      
      // Simulate a successful SSO login after a delay
      setTimeout(() => {
        const user = {
          id: 'github_123456',
          name: 'GitHub User',
          email: 'user@github.com',
          company: 'Mercatrix Solutions',
          role: 'user',
          authProvider: 'github',
          // In a real app, there would be a token and other auth data
          token: 'mock-github-token-' + Date.now()
        };
        
        setCurrentUser(user);
        setIsAuthenticated(true);
        localStorage.setItem('mercatrix_user', JSON.stringify(user));
        localStorage.setItem('mercatrix_auth_provider', 'github');
        
        resolve(user);
      }, 1000);
    });
  };

  // Register function
  const register = async (userData) => {
    try {
      // Add debugging code to diagnose configuration issues
      console.log('Attempting registration with Firebase config:', {
        apiKey: auth.app.options.apiKey ? 'exists (masked)' : 'missing',
        projectId: auth.app.options.projectId,
        authDomain: auth.app.options.authDomain
      });

      // Check if the Firebase app is properly initialized
      if (!auth.app || !auth.app.options.apiKey) {
        console.error('Firebase Authentication is not properly initialized');
        throw new Error('Erro de configuração do Firebase. Por favor, contate o suporte.');
      }

      if (!userData.email || !userData.password) {
        throw new Error('Email e senha são obrigatórios');
      }

      // Extract password from userData and prepare user data for Firestore
      const { password, ...profileData } = userData;
      
      // Create user in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(auth, userData.email, password);
      const uid = userCredential.user.uid;
      
      // Prepare user data for Firestore
      const firestoreData = {
        id: uid,
        email: userData.email,
        fullName: userData.fullName || '',
        company: userData.company || '',
        document: userData.document || '',
        phone: userData.phone || '',
        address: userData.address || {},
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      // Save user data to Firestore
      const userDocRef = doc(firestore, 'users', uid);
      await setDoc(userDocRef, firestoreData);
      
      // Return the created user
      const newUser = {
        id: uid,
        ...firestoreData,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // Update the local state
      setCurrentUser(newUser);
      setIsAuthenticated(true);
      
      console.log('User registered successfully:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('Registration error:', error);
      
      // Translate Firebase errors to user-friendly messages
      let errorMessage = "Falha no registro. Por favor, tente novamente.";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "Este email já está em uso. Tente outro ou faça login.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Email inválido. Verifique o formato.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Senha muito fraca. Use uma senha mais forte.";
      } else if (error.code === 'auth/configuration-not-found') {
        errorMessage = "Erro de configuração do Firebase: Email/Password authentication não está habilitado. Por favor, verifique o README.md para instruções.";
      }
      
      throw new Error(errorMessage);
    }
  };
  // Logout function
  const logout = async () => {
    try {
      // Sign out from Firebase Authentication
      await signOut(auth);
      
      // Clear any additional auth providers if needed
      const authProvider = localStorage.getItem('mercatrix_auth_provider');
      if (authProvider) {
        console.log(`Logging out from ${authProvider} provider`);
        // For example, if using Google:
        // if (authProvider === 'google' && window.gapi && window.gapi.auth2) {
        //   const auth2 = window.gapi.auth2.getAuthInstance();
        //   if (auth2) auth2.signOut();
        // }
        localStorage.removeItem('mercatrix_auth_provider');
      }
      
      // Clear local state
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('mercatrix_user');
      
      console.log("User logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  // Update user avatar
  const updateUserAvatar = async (avatarUrl) => {
    try {
      // Validate inputs
      if (!currentUser) {
        throw new Error('Usuário não autenticado');
      }
      
      if (!currentUser.id) {
        throw new Error('ID do usuário não disponível');
      }
      
      if (!avatarUrl) {
        throw new Error('URL do avatar é obrigatória');
      }
      
      console.log('Atualizando avatar no Firestore para usuário:', currentUser.id);
      
      // Incluir manipulação de erros mais detalhada
      try {
        // Define document reference - make sure we have a valid user ID
        const userId = currentUser.id;
        if (typeof userId !== 'string' || userId.trim() === '') {
          throw new Error('ID do usuário inválido');
        }
        
        // Create a valid document reference
        const userDocRef = doc(firestore, 'users', userId);
        if (!userDocRef) {
          throw new Error('Referência do documento inválida');
        }
        
        // Check if document exists first
        console.log('Verificando se o documento do usuário existe no Firestore');
        const userDoc = await getDoc(userDocRef);
        
        // Prepare data object for Firestore - explicitly avoiding null values
        const updateData = {
          // Save with both field names for maximum compatibility
          photoURL: avatarUrl || '',
          avatar: avatarUrl || '',
          updatedAt: serverTimestamp()
        };
        
        // Use conditional logic based on whether document exists
        if (userDoc && userDoc.exists()) {
          console.log('Documento do usuário encontrado, atualizando avatar');
          
          // Use updateDoc instead of setDoc with merge to avoid null value issues
          await setDoc(userDocRef, updateData, { merge: true });
          console.log('Avatar atualizado com sucesso no documento existente');
        } else {
          console.log('Documento do usuário não encontrado, criando novo documento');
          
          // Create a complete user document to avoid partial updates
          const newUserData = {
            id: userId,
            email: currentUser.email || '',
            name: currentUser.name || currentUser.displayName || 'Usuário',
            fullName: currentUser.fullName || currentUser.name || currentUser.displayName || 'Usuário',
            photoURL: avatarUrl || '',
            avatar: avatarUrl || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Add empty address object to avoid null
            address: {
              cep: '',
              city: '',
              complement: '',
              neighborhood: '',
              number: '',
              state: '',
              street: ''
            }
          };
          
          // Set entire document
          await setDoc(userDocRef, newUserData);
          console.log('Novo documento de usuário criado com avatar');
        }
        
        // Update local state
        console.log('Atualizando estado local com novo avatar');
        setCurrentUser(prevUser => {
          if (!prevUser) return null;
          
          return {
            ...prevUser,
            photoURL: avatarUrl,
            avatar: avatarUrl
          };
        });
        
        // Cache in localStorage for quick access
        if (avatarUrl) {
          localStorage.setItem('userProfileImage', avatarUrl);
          console.log('Avatar salvo no localStorage');
        }
        
        console.log('Atualização de avatar concluída com sucesso');
        return {
          success: true,
          photoURL: avatarUrl,
          avatar: avatarUrl
        };
      } catch (firestoreError) {
        // Log detailed error information to help diagnose issues
        console.error('Erro específico do Firestore durante atualização do avatar:', firestoreError);
        console.error('Stack trace:', firestoreError.stack);
        
        // Check for common error types and provide better messages
        let errorMessage = `Erro ao salvar no banco: ${firestoreError.message}`;
        
        if (firestoreError.message.includes('nullValue') || firestoreError.message.includes('in operator')) {
          errorMessage = 'Erro de valor nulo no Firestore. Verifique os dados enviados.';
          console.error('Erro de valor nulo detectado. Dados do usuário:', currentUser);
        }
        
        // Still update localStorage so the UI has something to show
        if (avatarUrl) {
          localStorage.setItem('userProfileImage', avatarUrl);
          console.log('Avatar salvo no localStorage apesar do erro do Firestore');
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Erro geral ao atualizar avatar:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  };

  // Password reset request
  const requestPasswordReset = (email) => {
    // In a real app, this would make an API request
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Código de recuperação enviado!' });
      }, 1000);
    });
  };

  // Verify OTP and reset password
  const resetPassword = (email, otp, newPassword) => {
    // In a real app, this would make an API request
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, message: 'Senha alterada com sucesso!' });
      }, 1000);
    });
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    login,
    register,
    logout,
    requestPasswordReset,
    resetPassword,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithGithub,
    updateUserAvatar,
    ssoConfig: SSO_CONFIG
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;