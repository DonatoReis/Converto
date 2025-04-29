// src/firebase/messagingService.js
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { app } from './config';

/**
 * Firebase Cloud Messaging Service
 * Handles requesting permission, token management, and message handling
 */

// Module variable to hold messaging instance
let messaging = null;

/**
 * Initialize the Firebase Messaging service
 * @returns {Promise<boolean>} Whether messaging is supported and initialized
 */
const initializeMessaging = async () => {
  try {
    // Check if browser supports Firebase Messaging
    const isMessagingSupported = await isSupported();
    
    if (!isMessagingSupported) {
      console.log('Firebase Messaging is not supported in this browser');
      return false;
    }
    
    // Initialize Firebase Messaging
    messaging = getMessaging(app);
    console.log('Firebase Messaging initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase Messaging:', error);
    return false;
  }
};

/**
 * Request notification permission from the user
 * @returns {Promise<boolean>} Whether permission was granted
 */
const requestNotificationPermission = async () => {
  try {
    // Check if browser supports notifications
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }
    
    // Check if messaging is initialized
    if (!messaging) {
      const initialized = await initializeMessaging();
      if (!initialized) return false;
    }
    
    // Check current permission status
    if (Notification.permission === 'granted') {
      console.log('Notification permission already granted');
      return true;
    }
    
    if (Notification.permission === 'denied') {
      console.log('Notification permission denied by user');
      return false;
    }
    
    // Request permission
    console.log('Requesting notification permission...');
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
      return true;
    } else {
      console.log('Notification permission denied');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get the FCM token for the current user
 * @returns {Promise<string|null>} The FCM token or null if not available
 */
const getFCMToken = async () => {
  try {
    // Check if messaging is initialized
    if (!messaging) {
      const initialized = await initializeMessaging();
      if (!initialized) return null;
    }
    
    // Check if permission is granted
    if (Notification.permission !== 'granted') {
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) return null;
    }
    
    // VAPID key is required for web push notifications
    // This key should come from your Firebase project settings
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    
    if (!vapidKey) {
      console.error('VAPID key is missing. Please add it to your .env.local file');
      return null;
    }
    
    // Get token
    console.log('Getting FCM token...');
    const currentToken = await getToken(messaging, { vapidKey });
    
    if (currentToken) {
      console.log('FCM token obtained successfully');
      return currentToken;
    } else {
      console.log('No FCM token available. Permission needed.');
      return null;
    }
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};

/**
 * Save the FCM token to the user's profile in Firestore
 * @param {string} userId - The user's ID
 * @param {string} token - The FCM token
 * @returns {Promise<boolean>} Whether the token was saved successfully
 */
const saveFCMToken = async (userId, token) => {
  try {
    if (!userId || !token) {
      console.error('User ID and token are required to save FCM token');
      return false;
    }
    
    // Import firestore functions dynamically to avoid circular dependencies
    const { doc, setDoc } = await import('firebase/firestore');
    const { firestore } = await import('./config');
    
    // Save token to user's profile
    const userTokensRef = doc(firestore, 'user_tokens', userId);
    
    await setDoc(userTokensRef, {
      fcmTokens: {
        [token]: {
          createdAt: new Date().toISOString(),
          platform: 'web',
          device: navigator.userAgent
        }
      },
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    console.log('FCM token saved to user profile');
    return true;
  } catch (error) {
    console.error('Error saving FCM token:', error);
    return false;
  }
};

/**
 * Set up a listener for foreground messages
 * @param {Function} callback - Function to call when a message is received
 * @returns {Function|null} Function to unsubscribe from messages or null if not supported
 */
const onForegroundMessage = (callback) => {
  try {
    if (!messaging) {
      console.log('Messaging not initialized. Cannot listen for foreground messages.');
      return null;
    }
    
    // Set up message listener
    console.log('Setting up foreground message listener');
    return onMessage(messaging, (payload) => {
      console.log('Foreground message received:', payload);
      
      // Default notification handling if no callback is provided
      if (!callback && payload.notification) {
        // Use native browser notification for foreground messages
        const { title, body } = payload.notification;
        new Notification(title, {
          body,
          icon: '/logo192.png'
        });
        return;
      }
      
      // Call custom handler
      if (typeof callback === 'function') {
        callback(payload);
      }
    });
  } catch (error) {
    console.error('Error setting up foreground message listener:', error);
    return null;
  }
};

/**
 * Register the service worker for background notifications
 * @returns {Promise<ServiceWorkerRegistration|null>} The service worker registration or null if failed
 */
const registerServiceWorker = async () => {
  try {
    if (!('serviceWorker' in navigator)) {
      console.log('Service workers are not supported in this browser');
      return null;
    }
    
    // Register the service worker
    console.log('Registering service worker for FCM...');
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
      scope: '/'
    });
    
    console.log('Service worker registered successfully:', registration);
    return registration;
  } catch (error) {
    console.error('Error registering service worker:', error);
    return null;
  }
};

/**
 * Initialize push notifications for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<{success: boolean, token: string|null}>} Result of the initialization
 */
const initializePushNotifications = async (userId) => {
  try {
    // Step 1: Initialize messaging
    const isInitialized = await initializeMessaging();
    if (!isInitialized) {
      return { success: false, token: null, reason: 'messaging-not-supported' };
    }
    
    // Step 2: Register service worker
    const registration = await registerServiceWorker();
    if (!registration) {
      return { success: false, token: null, reason: 'service-worker-failed' };
    }
    
    // Step 3: Request permission
    const permissionGranted = await requestNotificationPermission();
    if (!permissionGranted) {
      return { success: false, token: null, reason: 'permission-denied' };
    }
    
    // Step 4: Get FCM token
    const token = await getFCMToken();
    if (!token) {
      return { success: false, token: null, reason: 'token-failed' };
    }
    
    // Step 5: Save token to user profile
    if (userId) {
      await saveFCMToken(userId, token);
    }
    
    return { success: true, token };
  } catch (error) {
    console.error('Error initializing push notifications:', error);
    return { success: false, token: null, reason: 'unknown-error', error: error.message };
  }
};

// Export the messaging service
const messagingService = {
  initializeMessaging,
  requestNotificationPermission,
  getFCMToken,
  saveFCMToken,
  onForegroundMessage,
  registerServiceWorker,
  initializePushNotifications
};

export default messagingService;

