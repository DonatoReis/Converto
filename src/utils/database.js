// src/utils/database.js
import { v4 as uuidv4 } from 'uuid';
import { logError, logInfo, logDebug, logWarning, logFirestoreError } from './logger';
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
   * @returns {Promise<Array>} List of contacts */
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
   */
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
  // Função utilitária recursiva para limpar valores nulos/undefined em objetos completos
  _sanitizeFirestoreData: (obj) => {
    // Caso base: se for null ou undefined, retornar um valor padrão apropriado
    if (obj === null || obj === undefined) {
      return '';
    }
    
    // Se for um tipo primitivo, retornar diretamente
    if (typeof obj !== 'object') {
      return obj;
    }
    
    // Se for um array, mapear e limpar cada elemento
    if (Array.isArray(obj)) {
      return obj.map(item => Database._sanitizeFirestoreData(item));
    }
    
    // Se for um objeto, processar cada propriedade
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      // Definir valor padrão com base no tipo esperado para campos comuns
      if (value === null || value === undefined) {
        switch (key) {
          case 'ownerId':
          case 'userId':
          case 'name':
          case 'email':
          case 'phone':
          case 'document':
          case 'company':
          case 'lastMessage':
          case 'avatar':
            result[key] = '';
            break;
          case 'status':
            result[key] = 'offline';
            break;
          case 'address':
            result[key] = {
              street: '',
              number: '',
              city: '',
              state: '',
              zipCode: '',
              neighborhood: '',
              complement: ''
            };
            break;
          default:
            // Adotar uma abordagem conservadora: strings para chaves desconhecidas
            result[key] = '';
        }
      } else if (typeof value === 'object') {
        // Processar recursivamente objetos aninhados
        result[key] = Database._sanitizeFirestoreData(value);
      } else {
        // Manter valores primitivos não-nulos inalterados
        result[key] = value;
      }
    }
    return result;
  },
  
  /**
   * Gets default value for a field type
   * @param {string} fieldName - Field name
   * @param {*} inferredType - Sample value to infer type (optional)
   * @returns {*} Default value for the field type
   * @private
   */
  _getDefaultValueForType: (fieldName, inferredType = null) => {
    switch (fieldName) {
      // String fields
      case 'ownerId':
      case 'userId':
      case 'name':
      case 'email':
      case 'phone':
      case 'document':
      case 'company':
      case 'lastMessage':
      case 'avatar':
      case 'title':
      case 'subtitle':
      case 'message':
      case 'content':
        return '';
        
      // Number fields
      case 'unreadCount':
      case 'count':
      case 'index':
      case 'priority':
        return 0;
        
      // Boolean fields
      case 'isRead':
      case 'isActive':
      case 'isBlocked':
      case 'isArchived':
      case 'isGroup':
      case 'isOnline':
        return false;
        
      // Special fields with specific default values
      case 'status':
        return 'offline';
        
      // Complex objects
      case 'address':
        return {
          street: '',
          number: '',
          city: '',
          state: '',
          zipCode: '',
          neighborhood: '',
          complement: ''
        };
      
      // Arrays
      case 'mediaAttachments':
      case 'readBy':
      case 'participants':
      case 'tags':
        return [];
      
      // For unknown fields, infer type from the provided sample/context
      default:
        if (inferredType === null) {
          // Default to empty string if no type information available
          return '';
        }
        
        // Infer type from the sample value
        const inferredTypeName = typeof inferredType;
        
        switch (inferredTypeName) {
          case 'string':
            return '';
          case 'number':
            return 0;
          case 'boolean':
            return false;
          case 'object':
            if (Array.isArray(inferredType)) {
              return [];
            }
            return {};
          default:
            return '';
        }
    }
  },
  
  /**
   * Adds a new contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object|null>} Added contact or null
   */
  addContact: async (contactData) => {
    try {
      // Get current user
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user || !user.uid) {
        throw new Error('User must be authenticated to add contacts');
      }

      // Standardize and sanitize contact data
      const standardizedContact = standardizeContact({
        ...contactData,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Deep clean the contact data to remove any null/undefined values
      const deepCleanedContact = Database._sanitizeFirestoreData(standardizedContact);
      
      // Additional verification to ensure no nested null values remain
      const finalCheck = (obj) => {
        if (typeof obj !== 'object' || obj === null) return;
        
        if (Array.isArray(obj)) {
          obj.forEach(item => finalCheck(item));
          return;
        }
        
        for (const key in obj) {
          if (obj[key] === null || obj[key] === undefined) {
            // Use _getDefaultValueForType for appropriate defaults
            obj[key] = Database._getDefaultValueForType(key); 
          } else if (typeof obj[key] === 'object') {
            // Recursively check nested objects
            finalCheck(obj[key]);
          }
        }
      };
      
      finalCheck(deepCleanedContact);
      
      // Debug logging
      logDebug('Sanitized contact data before sending to Firestore:', deepCleanedContact);
      // Debug logging
      logDebug('Sanitized contact data before sending to Firestore:', deepCleanedContact);
      
      // Final verification for all critical fields
      const requiredFields = ['ownerId', 'name', 'email'];
      const missingFields = requiredFields.filter(field => !deepCleanedContact[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Campos obrigatórios não podem ser nulos: ${missingFields.join(', ')}`);
      }
      
      // Convert any potential `undefined` values to empty strings to prevent Firestore errors
      const safeContact = Object.entries(deepCleanedContact).reduce((acc, [key, value]) => {
        acc[key] = value === undefined ? '' : value;
        return acc;
      }, {});
      
      try {
        // Log the exact data being sent to Firestore
        logDebug('Final contact data being sent to Firestore:', JSON.stringify(safeContact));
        
        // Add to Firestore
        const docRef = await addDoc(collection(firestore, 'contacts'), safeContact);
        
        return {
          id: docRef.id,
          ...safeContact,
          createdAt: new Date(),
          updatedAt: new Date()
        };
      } catch (firestoreError) {
        // Use enhanced error logging for Firestore-specific errors
        logFirestoreError('Error adding contact to Firestore', safeContact, firestoreError);
        throw firestoreError;
      }
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
  // ==================== CONVERSATION MANAGEMENT ====================

  /**
   * Gets all conversations for the current user
   * @param {boolean} includeArchived - Whether to include archived conversations
   * @returns {Array} List of conversations
   */
  getAllConversations: async (includeArchived = false) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      // Verificação de segurança: garantir que o usuário está autenticado e possui um UID válido
      if (!user || !user.uid) {
        logWarning('Attempting to fetch conversations without authenticated user or user.uid is undefined');
        return [];
      }
      
      try {
        // Ensure user.uid is defined - should never reach here due to earlier check, but add extra safety
        const userId = user.uid || "";
        if (!userId.trim()) {
          logWarning('Empty user ID in getAllConversations after guard check');
          return [];
        }
        
        // Construir uma query segura para evitar valores nulos
        const q = query(
          conversationsRef,
          // Garantir que user.uid nunca seja null - use a defined string with actual content
          where("participants", "array-contains", userId),
          // Filtro de arquivados com valor explícito para evitar nulls - use explicit boolean 
          where("isArchived", "==", Boolean(includeArchived)), 
          orderBy("updatedAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (queryError) {
        logError('Error executing Firestore query for conversations', { 
          uid: user.uid, 
          includeArchived, 
          error: queryError.message 
        }, queryError);
        
        // Em caso de erro, retornar array vazio em vez de propagar o erro
        return []; 
      }
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

  // ==================== SEARCH FUNCTIONALITY ====================

  /**
   * Search for contacts in both user's contacts and global users
   * @param {Object} criteria - Search criteria (document, email, phone, name, etc.)
   * @returns {Promise<Array>} Matching contacts and users
   */
  searchContacts: async (criteria) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        logWarning('Attempting to search contacts without authenticated user');
        return [];
      }
      
      // Step 1: Search in user's contacts collection
      let contactsQuery = query(
        contactsRef, 
        where('ownerId', '==', user.uid)
      );
      
      // Refine query based on search criteria for contacts
      if (criteria.document) {
        contactsQuery = query(contactsQuery, where('document', '==', criteria.document));
      } else if (criteria.email) {
        contactsQuery = query(contactsQuery, where('email', '==', criteria.email.toLowerCase()));
      } else if (criteria.phone) {
        contactsQuery = query(contactsQuery, where('phone', '==', criteria.phone));
      } else if (criteria.name) {
        contactsQuery = query(contactsQuery, where('name', '>=', criteria.name), 
                                         where('name', '<=', criteria.name + '\uf8ff'));
      }
      
      // Step 2: Search in global users collection
      let usersQuery;
      
      // Only search for users that are not the current user
      if (criteria.document) {
        usersQuery = query(usersRef, 
                          where('document', '==', criteria.document),
                          where('id', '!=', user.uid));
      } else if (criteria.email) {
        usersQuery = query(usersRef, 
                          where('email', '==', criteria.email.toLowerCase()),
                          where('id', '!=', user.uid));
      } else if (criteria.phone) {
        usersQuery = query(usersRef, 
                          where('phone', '==', criteria.phone),
                          where('id', '!=', user.uid));
      } else if (criteria.name) {
        // Using fullName field for user search as specified
        usersQuery = query(usersRef, 
                          where('fullName', '>=', criteria.name),
                          where('fullName', '<=', criteria.name + '\uf8ff'));
      } else if (criteria.company) {
        usersQuery = query(usersRef,
                          where('company', '>=', criteria.company),
                          where('company', '<=', criteria.company + '\uf8ff'));                          
      } else {
        // If no specific criteria, don't search users globally
        // This prevents returning the entire users collection
        usersQuery = null;
      }
      
      // Execute contacts query
      const contactsSnapshot = await getDocs(contactsQuery);
      const contactsResults = contactsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        isContact: true, // Mark as existing contact
      }));
      
      // Only execute users query if we have a specific search criteria
      let usersResults = [];
      if (usersQuery) {
        const usersSnapshot = await getDocs(usersQuery);
        usersResults = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isContact: false, // Mark as not yet a contact
        }));
      }
      
      // Step 3: Merge results and remove duplicates
      // Create a map of contacts by email for fast lookup
      const contactsByEmail = {};
      contactsResults.forEach(contact => {
        if (contact.email) {
          contactsByEmail[contact.email.toLowerCase()] = true;
        }
      });
      
      // Filter out users that are already contacts
      const uniqueUsersResults = usersResults.filter(user => {
        return !user.email || !contactsByEmail[user.email.toLowerCase()];
      });
      
      // Combine results, putting contacts first
      const combinedResults = [...contactsResults, ...uniqueUsersResults];
      
      return combinedResults;
    } catch (error) {
      logError('Error searching contacts and users', { criteria, error: error.message }, error);
      return [];
    }
  },

};

export default Database;
