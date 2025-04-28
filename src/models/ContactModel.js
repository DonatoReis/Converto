// src/models/ContactModel.js

/**
 * Standardizes contact data to ensure consistent structure
 * and prevent issues with null values in Firestore
 * @param {Object} contactData - Raw contact data
 * @returns {Object} Standardized contact object
 */
export const standardizeContact = (contactData) => {
  // Create a copy to avoid mutating the original
  const contact = { ...contactData };

  // Ensure all expected fields exist and have appropriate values
  const defaults = {
    name: '',
    email: '',
    phone: '',
    company: '',
    document: '',
    documentType: '',
    status: 'offline',
    avatar: '',
    lastMessage: '',
    address: {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    },
    configuracoesPerfil: {
      visibilidade: 'publico',
      notificacoes: true,
      receberChamadas: true,
      respostaAutomatica: ''
    }
  };

  // Apply defaults for missing properties
  for (const [key, defaultValue] of Object.entries(defaults)) {
    if (contact[key] === undefined || contact[key] === null) {
      contact[key] = defaultValue;
    } else if (key === 'address' || key === 'configuracoesPerfil') {
      // Handle nested objects
      contact[key] = {
        ...defaultValue,
        ...(contact[key] || {})
      };
    }
  }

  // Convert any null values to empty strings or appropriate defaults
  // to prevent Firestore issues
  Object.keys(contact).forEach(key => {
    if (contact[key] === null) {
      if (typeof defaults[key] === 'string') {
        contact[key] = '';
      } else if (typeof defaults[key] === 'boolean') {
        contact[key] = false;
      } else if (typeof defaults[key] === 'object' && !Array.isArray(defaults[key])) {
        contact[key] = {};
      } else if (Array.isArray(defaults[key])) {
        contact[key] = [];
      }
    }
  });

  return contact;
};

/**
 * Standard contact format for the application
 * @typedef {Object} ContactModel
 * @property {string} id - Unique identifier
 * @property {string} name - Contact name
 * @property {string} [email] - Email address
 * @property {string} [phone] - Phone number
 * @property {string} [company] - Company name
 * @property {Object} [address] - Address information
 * @property {string} [avatar] - Avatar URL
 * @property {string} [lastMessage] - Last message (standardized as string)
 * @property {string} [time] - Timestamp of last message
 * @property {number} [unreadCount] - Number of unread messages
 */

/**
 * Creates a standardized contact object
 * @param {Object} contactData - Raw contact data
 * @returns {ContactModel} Standardized contact
 */
export const createContact = (contactData) => {
  // Standardize lastMessage to always be a string
  let lastMessageContent = '';
  if (contactData.lastMessage) {
    if (typeof contactData.lastMessage === 'object' && contactData.lastMessage !== null) {
      lastMessageContent = contactData.lastMessage.content || '';
    } else {
      lastMessageContent = contactData.lastMessage;
    }
  }

  return {
    id: contactData.id || `contact_${Date.now()}`,
    name: contactData.name || '',
    email: contactData.email || '',
    phone: contactData.phone || '',
    company: contactData.company || '',
    address: contactData.address || {},
    avatar: contactData.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(contactData.name || 'User')}&background=random`,
    lastMessage: lastMessageContent,
    time: contactData.time || '',
    unreadCount: contactData.unreadCount || 0,
    status: contactData.status || 'offline',
    ...(contactData.isArchived && { isArchived: true }),
  };
};

export default {
  createContact,
  standardizeContact
};
