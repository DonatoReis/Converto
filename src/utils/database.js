// src/utils/database.js
import { v4 as uuidv4 } from 'uuid';
import { logError, logInfo, logDebug, logWarning } from './logger';
import { standardizeMessage } from '../models/MessageModel';
import { standardizeContact } from '../models/ContactModel';
import { 
  collection, doc, getDoc, setDoc, addDoc, updateDoc, deleteDoc, 
  getDocs, query, where, orderBy, limit, serverTimestamp, 
  onSnapshot, writeBatch, arrayUnion, arrayRemove
} from 'firebase/firestore';
import { firestore } from '../firebase/config';
import { getAuth } from 'firebase/auth';

// Firestore collections references
const usersRef = collection(firestore, 'users');
const contactsRef = collection(firestore, 'contacts');
const conversationsRef = collection(firestore, 'conversations');
const messagesRef = collection(firestore, 'messages');
const blockedContactsRef = collection(firestore, 'blocked_contacts');

/**
 * Database utility that provides methods to interact with Firestore
 */
const Database = {
  /**
   * Verifies connection to Firestore
   * @returns {Promise<Object>} Connection status
   */
  verifyFirestoreConnection: async () => {
    try {
      logDebug('Verifying Firestore connection');
      
      // Check connection by getting a document that should always exist
      const testDoc = await getDoc(doc(firestore, '_connection_test', 'test'));
      
      // If the doc doesn't exist, create it
      if (!testDoc.exists()) {
        await setDoc(doc(firestore, '_connection_test', 'test'), {
          timestamp: serverTimestamp(),
          message: 'Connection test document'
        });
      }
      
      logInfo('Firestore connection verified successfully');
      
      return {
        success: true,
        message: 'Connection to Firestore database established successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logError('Firestore connection verification failed', { error: error.message }, error);
      
      return {
        success: false,
        message: 'Failed to connect to Firestore database',
        error: error.message
      };
    }
  },

  // ==================== USER MANAGEMENT ====================

  /**
   * Gets the current authenticated user
   * @returns {Object} Current user data
   */
  getCurrentUser: () => {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (user) {
      return {
        id: user.uid,
        name: user.displayName || 'Usuário',
        email: user.email,
        photoURL: user.photoURL
      };
    }
    
    // Fallback if user not authenticated
    return { id: 'current_user', name: 'Usuário' };
  },

  /**
   * Gets a user by ID
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} User object or null
   */
  getUser: async (userId) => {
    try {
      // Add null check to prevent "Cannot use 'in' operator to search for 'nullValue' in null" error
      if (!userId) {
        logWarning('Attempt to get user with null or undefined userId');
        return null;
      }
      
      const userDoc = await getDoc(doc(usersRef, userId));
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      logError('Error getting user', { userId, error: error.message }, error);
      return null;
    }
  },

  /**
   * Updates user data
   * @param {string} userId - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise<Object|null>} Updated user or null
   */
  updateUser: async (userId, userData) => {
    try {
      // Add null check for userId
      if (!userId) {
        logWarning('Attempt to update user with null or undefined userId');
        return null;
      }
      
      // Add null check for userData
      if (!userData) {
        logWarning('Attempt to update user with null or undefined userData');
        return null;
      }
      
      const userRef = doc(usersRef, userId);
      
      // Add timestamp
      const updateData = {
        ...userData,
        updatedAt: serverTimestamp()
      };
      
      await updateDoc(userRef, updateData);
      
      const updatedDoc = await getDoc(userRef);
      return {
        id: updatedDoc.id,
        ...updatedDoc.data()
      };
    } catch (error) {
      logError('Error updating user', { userId, error: error.message }, error);
      return null;
    }
  },
  
  // ==================== CONTACT MANAGEMENT ====================

  /**
   * Gets all contacts for the current user
   * @returns {Promise<Array>} List of contacts
  getAllContacts: async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user || !user.uid) {
        logWarning('Attempting to fetch contacts without authenticated user or user.uid is undefined');
        return [];
      }
      
      try {
        const q = query(
          contactsRef, 
          where('ownerId', '==', user.uid),
          orderBy('name', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (queryError) {
        logError('Error executing Firestore query for contacts', { uid: user.uid, error: queryError.message }, queryError);
        return [];
      }
    } catch (error) {
      logError('Error fetching contacts', { error: error.message }, error);
      return [];
    }
  },
  
  /**
   * Gets a single contact by ID
   * @param {string} contactId - Contact ID
   * @returns {Promise<Object|null>} Contact or null
   */
  getContact: async (contactId) => {
    try {
      // Add null check for contactId
      if (!contactId) {
        logWarning('Attempt to get contact with null or undefined contactId');
        return null;
      }
      
      const contactDoc = await getDoc(doc(contactsRef, contactId));
      if (contactDoc.exists()) {
        return {
          id: contactDoc.id,
          ...contactDoc.data()
        };
      }
      return null;
    } catch (error) {
      logError('Error getting contact', { contactId, error: error.message }, error);
      return null;
    }
  },

  /**
   * Gets a contact by email
   * @param {string} email - Email to search for
   * @returns {Promise<Object|null>} Contact or null
  getContactByEmail: async (email) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user || !user.uid || !email) {
        logWarning('Missing required parameters for getContactByEmail', { 
          hasUser: !!user, 
          hasUserId: user ? !!user.uid : false, 
          hasEmail: !!email 
        });
        return null;
      }
      
      try {
        const q = query(
          contactsRef, 
          where('ownerId', '==', user.uid),
          where('email', '==', email)
        );
        
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          return null;
        }
        
        const contactDoc = querySnapshot.docs[0];
        return {
          id: contactDoc.id,
          ...contactDoc.data()
        };
      } catch (queryError) {
        logError('Error executing Firestore query for contact by email', { email, uid: user.uid, error: queryError.message }, queryError);
        return null;
      }
    } catch (error) {
      logError('Error getting contact by email', { email, error: error.message }, error);
      return null;
    }
  },
  
  /**
   * Sets up a real-time listener for contacts changes
   * @param {Function} callback - Function to call when contacts change
   * @returns {Function} Unsubscribe function
   */
  subscribeToContacts: (callback) => {
    try {
      // Check if callback is a function
      if (typeof callback !== 'function') {
        logError('Invalid callback provided to subscribeToContacts', { callbackType: typeof callback });
        return () => {}; // Return empty unsubscribe function
      }
      
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user || !user.uid) {
        logWarning('Attempting to subscribe to contacts without authenticated user or user.uid is undefined');
        callback([]);
        return () => {}; // Return empty unsubscribe function
      }
      
      try {
        const q = query(
          contactsRef, 
          where('ownerId', '==', user.uid),
          orderBy('name', 'asc')
        );
        
        return onSnapshot(q, (snapshot) => {
          const contacts = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          callback(contacts);
        }, (error) => {
          logError('Error in contacts subscription', { error: error.message }, error);
          callback([]);
        });
      } catch (error) {
        logError('Error setting up contacts subscription', { error: error.message }, error);
        callback([]);
        return () => {}; // Return empty unsubscribe function
      }
    } catch (error) {
      logError('Error setting up contacts subscription', { error: error.message }, error);
      callback([]);
      return () => {}; // Return empty unsubscribe function
    }
  },
  /**
   * Adds a new contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object|null>} Added contact or null
   */
  addContact: async (contactData) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('User must be authenticated to add a contact');
      }
      
      // Validate required fields
      if (!contactData || !contactData.name) {
        throw new Error('Contact name is required');
      }
      
      // Create a clean object with only the fields we expect
      const contact = {
        name: contactData.name || '',
        email: contactData.email || '',
        phone: contactData.phone ? contactData.phone.replace(/\D/g, '') : '', // Normalize phone
        company: contactData.company || '',
        document: contactData.document ? contactData.document.replace(/\D/g, '') : '', // Normalize document
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'offline',
        avatar: contactData.avatar || '',
        lastMessage: ''
      };
      
      // Only add non-empty address fields if they exist
      if (contactData.address) {
        contact.address = {
          street: contactData.address.street || '',
          number: contactData.address.number || '',
          city: contactData.address.city || '',
          state: contactData.address.state || '',
        };
      }
      
      // Add userId if it's a reference to an app user
      if (contactData.userId) {
        contact.userId = contactData.userId;
      }
      
      // Standardize the contact data to handle null values properly
      const sanitizedContact = standardizeContact(contact);
      logDebug('Sanitized contact data before sending to Firestore:', sanitizedContact);
      
      // Remove null or undefined fields to avoid Firestore internal assertion errors
      const cleanedContact = Object.fromEntries(
        Object.entries(sanitizedContact).filter(([_, v]) => v != null)
      );
      logDebug('Cleaned contact data before sending to Firestore:', cleanedContact);
      
      // Use the collection reference directly
      const contactsCollection = collection(firestore, 'contacts');
      const docRef = await addDoc(contactsCollection, cleanedContact);
      
      // Return the contact with its new ID
      return {
        id: docRef.id,
        ...contact,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      logError('Error adding contact', { error: error.message }, error);
      throw error;
    }
  },
  
  /**
   * Updates a contact
   * @param {string} contactId - Contact ID
   * @param {Object} contactData - Updated contact data
   * @returns {Promise<Object|null>} Updated contact or null
   */
  updateContact: async (contactId, contactData) => {
    try {
      // Ensure contact exists
      const contactRef = doc(contactsRef, contactId);
      const contactSnap = await getDoc(contactRef);
      
      if (!contactSnap.exists()) {
        throw new Error(`Contact not found: ${contactId}`);
      }
      
      // Update with new data and timestamp
      const updateData = standardizeContact({
        ...contactData,
        updatedAt: serverTimestamp()
      });
      
      await updateDoc(contactRef, updateData);
      
      // Get the updated document
      const updatedSnap = await getDoc(contactRef);
      
      return {
        id: contactId,
        ...updatedSnap.data()
      };
    } catch (error) {
      logError('Error updating contact', { contactId, error: error.message }, error);
      throw error;
    }
  },
  
  /**
   * Deletes a contact
   * @param {string} contactId - Contact ID
   * @returns {Promise<boolean>} Success indicator
   */
  deleteContact: async (contactId) => {
    try {
      // Delete the contact document
      await deleteDoc(doc(contactsRef, contactId));
      
      // Also delete any blocked contact records
      const blockedQ = query(
        blockedContactsRef,
        where('contactId', '==', contactId)
      );
      
      const blockedSnap = await getDocs(blockedQ);
      const batch = writeBatch(firestore);
      
      blockedSnap.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      // Execute the batch
      await batch.commit();
      
      return true;
    } catch (error) {
      logError('Error deleting contact', { contactId, error: error.message }, error);
      throw error;
    }
  },
  
  /**
   * Search contacts using various criteria
   * @param {Object} criteria - Search criteria (document, email, phone, etc.)
   * @returns {Promise<Array>} Matching contacts
   */
  searchContacts: async (criteria) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        logWarning('Attempting to search contacts without authenticated user');
        return [];
      }
      
      // Base query for the current user's contacts
      let q = query(
        contactsRef, 
        where('ownerId', '==', user.uid)
      );
      
      // Refine query based on search criteria
      if (criteria.document) {
        // Search by document (CPF/CNPJ)
        // Note: In a real implementation, you might want to search by both 
        // formatted and unformatted document strings
        q = query(q, where('document', '==', criteria.document));
      } else if (criteria.email) {
        // Search by email (case-insensitive search requires a separate index)
        q = query(q, where('email', '==', criteria.email.toLowerCase()));
      } else if (criteria.phone) {
        // Search by phone (remove non-digits for consistent comparison)
        q = query(q, where('phone', '==', criteria.phone));
      } else if (criteria.name) {
        // Search by name - typically would use a dedicated search service for real text search
        // This is a simplified approach that only works for exact matches
        q = query(q, where('name', '>=', criteria.name), where('name', '<=', criteria.name + '\uf8ff'));
      }
      
      // Execute the query
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      logError('Error searching contacts', { criteria, error: error.message }, error);
      return [];
    }
  },

  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Gets all conversations for the current user
   * @param {boolean} includeArchived - Whether to include archived conversations
   * @returns {Array} List of conversations
   */
  getAllConversations: (includeArchived = false) => {
    try {
      // This is a temporary implementation that returns an empty array
      // to prevent errors. In a complete implementation, this would
      // fetch conversations from Firestore.
      logWarning('Using mock implementation of getAllConversations');
      return [];
    } catch (error) {
      logError('Error getting conversations', { error: error.message }, error);
      return [];
    }
  },

  /**
   * Updates a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} data - Update data
   * @returns {boolean} Success indicator
   */
  updateConversation: (conversationId, data) => {
    try {
      // This is a temporary implementation that returns success
      // to prevent errors. In a complete implementation, this would
      // update a conversation in Firestore.
      logWarning('Using mock implementation of updateConversation');
      return true;
    } catch (error) {
      logError('Error updating conversation', { conversationId, error: error.message }, error);
      return false;
    }
  },

  /**
   * Adds a message to a conversation
   * @param {string} conversationId - Conversation ID
   * @param {Object} message - Message data
   * @returns {boolean} Success indicator
   */
  addMessage: (conversationId, message) => {
    try {
      // This is a temporary implementation that returns success
      // to prevent errors. In a complete implementation, this would
      // add a message to a conversation in Firestore.
      logWarning('Using mock implementation of addMessage');
      return true;
    } catch (error) {
      logError('Error adding message', { conversationId, error: error.message }, error);
      return false;
    }
  },

  /**
   * Adds a new conversation
   * @param {Object} conversation - Conversation data
   * @returns {boolean} Success indicator
   */
  addConversation: (conversation) => {
    try {
      // This is a temporary implementation that returns success
      // to prevent errors. In a complete implementation, this would
      // add a conversation to Firestore.
      logWarning('Using mock implementation of addConversation');
      return true;
    } catch (error) {
      logError('Error adding conversation', { error: error.message }, error);
      return false;
    }
  },

  // ==================== USER SETTINGS ====================

  /**
   * Gets user settings
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Object} User settings
   */
  getUserSettings: async (userId = null) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      // Use provided userId or current user id
      const uid = userId || (currentUser ? currentUser.uid : null);
      
      if (!uid) {
        logWarning('Attempting to fetch user settings without a user ID');
        return { theme: 'light', language: 'pt-BR', notifications: true, encryption: { enabled: false } };
      }
      
      // Try to get user document which should contain settings
      const userRef = doc(usersRef, uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists() && userDoc.data().settings) {
        return userDoc.data().settings;
      }
      
      // Return default settings if none exist
      return { theme: 'light', language: 'pt-BR', notifications: true, encryption: { enabled: false } };
    } catch (error) {
      logError('Error getting user settings', { userId, error: error.message }, error);
      // Return default settings on error
      return { theme: 'light', language: 'pt-BR', notifications: true, encryption: { enabled: false } };
    }
  },

  /**
   * Updates user settings
   * @param {Object} settings - Settings to update
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {boolean} Success indicator
   */
  updateUserSettings: async (settings, userId = null) => {
    try {
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      // Use provided userId or current user id
      const uid = userId || (currentUser ? currentUser.uid : null);
      
      if (!uid) {
        throw new Error('User must be authenticated to update settings');
      }
      
      // Update settings in user document
      const userRef = doc(usersRef, uid);
      await updateDoc(userRef, { 
        settings,
        updatedAt: serverTimestamp()
      });
      
      return true;
    } catch (error) {
      logError('Error updating user settings', { settings, userId, error: error.message }, error);
      return false;
    }
  },

  // ==================== ENCRYPTION KEY MANAGEMENT ====================

  /**
   * Updates or stores a user's public key for Signal Protocol end-to-end encryption
   * @param {string} userId - User ID
   * @param {Object} keyData - Public key data (identityKey, registrationId, preKeys, signedPreKey)
   * @returns {Promise<Object|null>} Updated key data or null on error
   */
  updateUserPublicKey: async (userId, keyData) => {
    try {
      // Add null check for userId
      if (!userId) {
        logWarning('Attempt to update public key with null or undefined userId');
        return null;
      }
      
      // Add null check for keyData
      if (!keyData) {
        logWarning('Attempt to update public key with null or undefined keyData');
        return null;
      }
      
      // Validate required fields
      if (!keyData.identityKey || !keyData.registrationId || !keyData.preKeys || !keyData.signedPreKey) {
        logWarning('Missing required fields in keyData for updateUserPublicKey', { 
          hasIdentityKey: !!keyData.identityKey,
          hasRegistrationId: !!keyData.registrationId,
          hasPreKeys: !!keyData.preKeys,
          hasSignedPreKey: !!keyData.signedPreKey
        });
        return null;
      }
      
      const userRef = doc(usersRef, userId);
      
      // Store public key data in a signalKeys field
      await updateDoc(userRef, {
        signalKeys: keyData,
        encryptionEnabled: true,
        updatedAt: serverTimestamp()
      });
      
      logInfo('Updated user public key', { userId });
      
      return keyData;
    } catch (error) {
      logError('Error updating user public key', { userId, error: error.message }, error);
      return null;
    }
  },
  
  /**
   * Gets a user's public key for Signal Protocol end-to-end encryption
   * @param {string} userId - User ID
   * @returns {Promise<Object|null>} Public key data or null if not found
   */
  getUserPublicKey: async (userId) => {
    try {
      // Add null check for userId
      if (!userId) {
        logWarning('Attempt to get public key with null or undefined userId');
        return null;
      }
      
      const userDoc = await getDoc(doc(usersRef, userId));
      if (userDoc.exists() && userDoc.data().signalKeys) {
        return userDoc.data().signalKeys;
      }
      
      logWarning('No public key found for user', { userId });
      return null;
    } catch (error) {
      logError('Error getting user public key', { userId, error: error.message }, error);
      return null;
    }
  }
};

export default Database;
