// src/components/NewConversationModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebase/config';
import firestoreService from '../firebase/firestoreService';
import Database from '../utils/database';
import { CSSTransition } from 'react-transition-group';

// Helper functions for search
async function searchContactsLocal(currentUserId, normalizedTerm, phoneSearch, documentSearch) {
  const contactsCollection = collection(firestore, 'contacts');
  const results = [];
  // Buscar por email
  if (normalizedTerm.includes('@')) {
    const q = query(contactsCollection, where('ownerId', '==', currentUserId), where('email', '==', normalizedTerm));
    const snap = await getDocs(q);
    results.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'contacts' })));
  }
  // Buscar por telefone
  if (phoneSearch.length >= 8) {
    const q = query(contactsCollection, where('ownerId', '==', currentUserId), where('phoneRaw', '==', phoneSearch));
    const snap = await getDocs(q);
    results.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'contacts' })));
  }
  // Buscar por documento
  if (documentSearch.length >= 11) {
    const q = query(contactsCollection, where('ownerId', '==', currentUserId), where('documentRaw', '==', documentSearch));
    const snap = await getDocs(q);
    results.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'contacts' })));
  }
  // Buscar por nome (contém)
  const qAll = query(contactsCollection, where('ownerId', '==', currentUserId));
  const allSnap = await getDocs(qAll);
  const nameHits = allSnap.docs.filter(doc => {
    const data = doc.data();
    const name = (data.fullName || data.name || '').toLowerCase();
    return name.includes(normalizedTerm);
  }).map(doc => ({ id: doc.id, ...doc.data(), source: 'contacts' }));
  // Evitar duplicatas
  const ids = new Set(results.map(r => r.id));
  nameHits.forEach(hit => { if (!ids.has(hit.id)) results.push(hit); });
  return results;
}

async function searchUsersGlobal(normalizedTerm, phoneSearch, documentSearch) {
  const usersCollection = collection(firestore, 'users');
  const results = [];
  // Email
  if (normalizedTerm.includes('@')) {
    for (const field of ['email', 'userEmail', 'emailAddress']) {
      try {
        const q = query(usersCollection, where(field, '==', normalizedTerm));
        const snap = await getDocs(q);
        results.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'users' })));
      } catch {}
    }
  }
  // Telefone
  if (phoneSearch.length >= 8) {
    for (const field of ['phoneRaw', 'phone', 'phoneNumber', 'userPhone', 'mobile']) {
      try {
        const q = query(usersCollection, where(field, '==', phoneSearch));
        const snap = await getDocs(q);
        results.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'users' })));
      } catch {}
    }
  }
  // Documento
  if (documentSearch.length >= 11) {
    for (const field of ['document', 'documentRaw', 'cpfCnpj', 'cpf', 'cnpj']) {
      try {
        const q = query(usersCollection, where(field, '==', documentSearch));
        const snap = await getDocs(q);
        results.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data(), source: 'users' })));
      } catch {}
    }
  }
  // Evitar duplicatas
  const unique = [];
  const ids = new Set();
  for (const item of results) {
    if (!ids.has(item.id)) { ids.add(item.id); unique.push(item); }
  }
  return unique;
}
// Import debounce from lodash if available
// import { debounce } from 'lodash';

// Simple debounce implementation if lodash is not available
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), wait);
  };
}
import { fetchDocumentData, formatDocument, identifyDocumentType, validateDocument } from '../utils/documentLookup';
import { fetchAddressByCEP, formatCEP } from '../utils/addressLookup';
import { getScore } from '../utils/serasaScore';
import SerasaScoreCard from './SerasaScoreCard';
import { useTheme } from '../context/ThemeContext';

// Add CSS for modal animation
const modalAnimationStyle = `
.modal-animation-enter {
  opacity: 0;
  transform: translateY(-20px);
}
.modal-animation-enter-active {
  opacity: 1;
  transform: translateY(0);
  transition: opacity 300ms, transform 300ms;
}
.modal-animation-exit {
  opacity: 1;
  transform: translateY(0);
}
.modal-animation-exit-active {
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 300ms, transform 300ms;
}
`;

const NewConversationModal = ({ isOpen, onClose, contacts, onSelectContact, onAddNewContact }) => {
  console.log('=== NewConversationModal rendered ===');
  console.log('Props:', { isOpen, contacts: contacts?.length, onSelectContact, onAddNewContact });
  
  // Get theme from context
  const { darkMode } = useTheme();
  
  // Tab state (search, new contact, scan)
  const [activeTab, setActiveTab] = useState('search');
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [searchMessage, setSearchMessage] = useState('');
  const [showAddManually, setShowAddManually] = useState(false);
  const [showNewContactForm, setShowNewContactForm] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState([]);
  
  // Global user search state
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [foundGlobalUser, setFoundGlobalUser] = useState(null);
  
  // State for all users from the users collection
  const [allUsers, setAllUsers] = useState([]);
  const [nonContactUsers, setNonContactUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  // State for new contact data
  const [newContact, setNewContact] = useState({
    document: '',
    documentRaw: '', // Raw document with only digits
    documentType: '',
    fullName: '', // Using fullName instead of name
    name: '', // Keeping for backward compatibility
    email: '',
    phone: '',
    phoneRaw: '', // Raw phone with only digits
    company: '',
    address: {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    },
    avatar: '', // Default avatar will be assigned
    serasaScore: null,
    recado: '',
    configuracoesPerfil: {
      visibilidade: 'publico',         // ou "privado", "restrito"
      notificacoes: true,
      receberChamadas: true,
      respostaAutomatica: ''
    },
  });
  
  // Loading states
  const [loading, setLoading] = useState({
    document: false,
    zipCode: false,
    score: false
  });
  
  // UI states
  const [showSerasaScore, setShowSerasaScore] = useState(false);
  const [notification, setNotification] = useState({ 
    show: false, 
    message: '', 
    type: 'info' // 'info', 'success', 'warning', 'error'
  });
  
  // Refs
  const modalRef = useRef(null);
  const searchInputRef = useRef(null);
  const formRef = useRef(null);
  
  // Reset notification after timeout
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [notification.show]);
  
  // Filter contacts when search term changes
  useEffect(() => {
    const filtered = contacts.filter(contact =>
      // Use fullName with fallback to name for backward compatibility
      ((contact.fullName || contact.name) || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contact.email && contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
      // Also check phone and document for matches with the raw values
      (contact.phoneRaw && contact.phoneRaw.includes(searchTerm.replace(/\D/g, ''))) ||
      (contact.documentRaw && contact.documentRaw.includes(searchTerm.replace(/\D/g, '')))
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);
  
  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen && !showNewContactForm && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen, showNewContactForm]);
  
  // Fetch users from "users" collection when modal opens
  useEffect(() => {
    async function fetchUsers() {
      if (!isOpen) return;
      
      try {
        setIsLoadingUsers(true);
        // Get current user ID
        const auth = getAuth();
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          console.warn('Cannot fetch users: No user is logged in');
          return;
        }
        
        // Get all users from the users collection
        const allUsersData = await firestoreService.getAllUsers(10); // Limit to 50 users for performance
        
        if (!allUsersData) {
          console.warn('No users returned from getAllUsers');
          setAllUsers([]);
          setNonContactUsers([]);
          return;
        }
        
        console.log(`Loaded ${allUsersData.length} users from the users collection`);
        
        // Process users to have consistent property names
        const processedUsers = allUsersData.map(user => ({
          id: user.id || '',
          fullName: user.fullName || user.name || user.nome || 'Usuário',
          name: user.name || user.fullName || user.nome || '',
          email: user.email || '',
          phone: user.phone || user.telefone || '',
          company: user.company || user.empresa || '',
          source: 'users'
        }));
        
        // Filter out the current user
        const usersWithoutCurrent = processedUsers.filter(user => user.id !== currentUser.uid);
        
        setAllUsers(usersWithoutCurrent);
        
        // Filter out users that are already in contacts
        // This requires knowledge of which property in contacts matches the user ID
        // Assuming contacts have properties that can match users
        let contactIdentifiers = contacts.map(contact => [
          contact.id,
          contact.email?.toLowerCase(),
          contact.userId,
          contact.phoneRaw
        ]).flat().filter(Boolean);
        
        const filteredUsers = usersWithoutCurrent.filter(user => {
          // Check all potential matching fields to determine if this user is already a contact
          return !contactIdentifiers.includes(user.id) && 
                 !contactIdentifiers.includes(user.email?.toLowerCase());
        });
        
        setNonContactUsers(filteredUsers);
      } catch (error) {
        console.error('Error fetching users:', error);
        showNotification('Erro ao carregar usuários', 'error');
      } finally {
        setIsLoadingUsers(false);
      }
    }
    
    fetchUsers();
  }, [isOpen, contacts]);

  // Keep filteredContacts and globalSearchResults in sync with searchResults
  useEffect(() => {
    if (searchResults.length > 0) {
      setFilteredContacts(searchResults.filter(r => r.source === 'contacts'));
      setGlobalSearchResults(searchResults.filter(r => r.source === 'users'));
      
      // Special case: if there's exactly one global user, set it to foundGlobalUser
      const globalUsers = searchResults.filter(r => r.source === 'users');
      if (globalUsers.length === 1) {
        setFoundGlobalUser(globalUsers[0]);
      }
    }
  }, [searchResults]);
  
  // Handle click outside to close the modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);
  
  // Show notification helper function
  const showNotification = (message, type = 'info') => {
    setNotification({
      show: true,
      message,
      type
    });
  };
  
  // Check if a contact with this CNPJ already exists
  const checkExistingContact = async (document) => {
    try {
      // Format the document for consistency
      const formattedDoc = formatDocument(document);
      const cleanDoc = document.replace(/\D/g, '');
      
      // First check current contacts (for UI responsiveness)
      const existingContactInList = contacts.find(contact => 
        contact.document === formattedDoc || 
        contact.document === cleanDoc
      );
      
      if (existingContactInList) {
        return existingContactInList;
      }
      
      // Then check the database with the Database utility
      // This will search for contacts by document
      try {
        const contactsWithDocument = await Database.searchContacts({
          document: cleanDoc
        });
        
        if (contactsWithDocument && contactsWithDocument.length > 0) {
          return contactsWithDocument[0];
        }
      } catch (dbError) {
        console.error('Error searching contacts by document:', dbError);
        // Continue checking with alternatives
      }
      
      return null;
    } catch (error) {
      console.error('Error checking existing contact:', error);
      return null;
    }
  };
  
  // Format phone number for display
  const formatPhone = (phone) => {
    if (!phone) return '';
    
    // Handle if phone is already an object or number
    if (typeof phone !== 'string') {
      phone = String(phone);
    }
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Format based on length (basic Brazilian format)
    if (digits.length === 11) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    } else if (digits.length === 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    } else {
      return digits;
    }
  };
  
  // Handle document (CPF/CNPJ) input change and auto-fill
  const handleDocumentChange = async (e) => {
    const document = e.target.value;
    setNewContact(prev => ({ ...prev, document }));
    
    // Auto format the document as the user types
    if (document.length >= 11) { // At least CPF length
      const formattedDocument = formatDocument(document);
      setNewContact(prev => ({ ...prev, document: formattedDocument }));
      
      // If it's a valid document, fetch data
      if (validateDocument(document)) {
        try {
          setLoading(prev => ({ ...prev, document: true }));
          const docType = identifyDocumentType(document);
          setNewContact(prev => ({ ...prev, documentType: docType }));
          
          // Check if we already have this CNPJ in our database
          const existingContact = await checkExistingContact(document);
          if (existingContact) {
            // Show options: "Enviar mensagem" or "Adicionar aos contatos"
            if (window.confirm(`CNPJ já cadastrado. Deseja enviar mensagem para ${existingContact.name}?`)) {
              // Option 1: Send message
              onSelectContact(existingContact);
              onClose();
              return;
            }
            
            showNotification(`Continuando com a adição de um novo contato para ${formattedDocument}`, 'info');
            // Otherwise continue with adding as new contact
          }
          
          const data = await fetchDocumentData(document);

          // Search for contacts by email if the document lookup returned an email
          if (data && data.email) {
            try {
              const contactsByEmail = await Database.getContactByEmail(data.email);
              if (contactsByEmail) {
                if (window.confirm(`Já existe um contato com o email ${data.email}. Deseja enviar mensagem para ${contactsByEmail.name}?`)) {
                  onSelectContact(contactsByEmail);
                  onClose();
                  return;
                }
              }
            } catch (emailError) {
              console.error('Error checking contact by email:', emailError);
              // Continue with adding as a new contact
            }
          }

          // Search for contacts by phone if the document lookup returned a phone
          if (data && data.phone) {
            try {
              const contactsByPhone = await Database.searchContacts({
                phone: data.phone.replace(/\D/g, '')
              });
              
              if (contactsByPhone && contactsByPhone.length > 0) {
                if (window.confirm(`Já existe um contato com o telefone ${data.phone}. Deseja enviar mensagem para ${contactsByPhone[0].name}?`)) {
                  onSelectContact(contactsByPhone[0]);
                  onClose();
                  return;
                }
              }
            } catch (phoneError) {
              console.error('Error checking contact by phone:', phoneError);
              // Continue with adding as a new contact
            }
          }
          
          // Update contact information with fetched data - ensure all fields are populated
          setNewContact(prev => ({
            ...prev,
            name: data.name || prev.name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            company: data.fantasia || data.company || prev.company,
            address: {
              ...prev.address,
              street: data.address?.street || prev.address.street,
              number: data.address?.number || prev.address.number,
              complement: data.address?.complement || prev.address.complement,
              neighborhood: data.address?.neighborhood || prev.address.neighborhood,
              city: data.address?.city || prev.address.city,
              state: data.address?.state || prev.address.state,
              zipCode: data.address?.zipCode || prev.address.zipCode
            }
          }));
          
          // Also fetch Serasa score
          try {
            setLoading(prev => ({ ...prev, score: true }));
            const scoreData = await getScore(document);
            setNewContact(prev => ({
              ...prev,
              serasaScore: scoreData
            }));
            setShowSerasaScore(true);
          } catch (error) {
            console.error('Error fetching Serasa score:', error);
            showNotification('Não foi possível obter o score Serasa', 'warning');
          } finally {
            setLoading(prev => ({ ...prev, score: false }));
          }
        } catch (error) {
          console.error('Error fetching document data:', error);
          showNotification('Não foi possível obter os dados do documento', 'error');
        } finally {
          setLoading(prev => ({ ...prev, document: false }));
        }
      }
    }
  };
  
  // Handle CEP change and auto-fill address
  const handleCEPChange = async (e) => {
    const zipCode = e.target.value;
    setNewContact(prev => ({ 
      ...prev, 
      address: { ...prev.address, zipCode } 
    }));
    
    // Auto format the CEP as the user types
    if (zipCode.length >= 8) {
      const formattedCEP = formatCEP(zipCode);
      setNewContact(prev => ({ 
        ...prev, 
        address: { ...prev.address, zipCode: formattedCEP } 
      }));
      
      try {
          const addressData = await fetchAddressByCEP(formattedCEP);
        
        if (addressData) {
          console.log('Address data received from BrasilAPI:', addressData);
          setNewContact(prev => ({
            ...prev,
            address: {
              ...prev.address,
              street: addressData.street || prev.address.street,
              neighborhood: addressData.neighborhood || prev.address.neighborhood,
              city: addressData.city || prev.address.city,
              state: addressData.state || prev.address.state,
              // Keep the formatted CEP
              zipCode: formattedCEP
            }
          }));
        }
      } catch (error) {
        console.error('Error fetching address by CEP:', error);
        showNotification('Não foi possível obter o endereço pelo CEP', 'warning');
      } finally {
        setLoading(prev => ({ ...prev, zipCode: false }));
      }
    }
  };
  
  // Handle selecting an existing contact
  const handleSelectExistingContact = (contact) => {
    onSelectContact(contact);
    onClose();
  };
  
  // Create debounced search function with 300ms delay
  // useCallback ensures the debounced function doesn't get recreated on each render
  const debouncedSearch = useCallback(
    debounce((value) => {
      if (value.trim().length >= 3) {
        console.log('Executing debounced search for:', value);
        
        // Execute the two-step search process
        handleSearch(value);
      }
    }, 300),
    [] // Empty dependency array ensures this is only created once
  );
  
  // Handle search input change with proper normalization and debounce
  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    // Clear previous search results when emptying the search field
    if (!value.trim()) {
      setSearchResults([]);
      setShowAddManually(false);
      setGlobalSearchResults([]);
      setFoundGlobalUser(null);
      return;
    }
    
    // Normalize input for immediate UI filtering
    const normalizedValue = value.toLowerCase().trim();
    const normalizedPhoneSearch = value.replace(/\D/g, ''); // Strip all non-digit characters for phone search
    // Immediately filter local contacts for responsive UI 
    const filtered = contacts.filter(contact =>
      // Use fullName with fallback to name for backward compatibility
      ((contact.fullName || contact.name) || '').toLowerCase().includes(normalizedValue) ||
      (contact.email && contact.email.toLowerCase().includes(normalizedValue)) ||
      // Check both formatted and raw phone and document fields
      (contact.phone && contact.phone.includes(normalizedPhoneSearch)) ||
      (contact.phoneRaw && contact.phoneRaw.includes(normalizedPhoneSearch)) ||
      (contact.document && contact.document.includes(normalizedPhoneSearch)) ||
      (contact.documentRaw && contact.documentRaw.includes(normalizedPhoneSearch))
    );
    
    console.log(`Filtering local contacts for '${normalizedValue}' (normalized phone: '${normalizedPhoneSearch}'): Found ${filtered.length} matches`);
    setFilteredContacts(filtered);
    
    // Trigger the debounced search for Firestore queries (300ms delay)
    debouncedSearch(value);
  };
  
  // Complete implementation of the search function (used from lines 480-488)
  const handleSearch = async (term) => {
    // Reset search state
    setIsSearching(true);
    setSearchError(null);
    setSearchResults([]);
    setFilteredContacts([]);
    setGlobalSearchResults([]);
    setShowAddManually(false);
    
    try {
      // Basic validation
      if (!term || term.length < 3) {
        setIsSearching(false);
        return;
      }
      
      // Get current user
      const authObj = getAuth();
      const user = authObj.currentUser;
      if (!user) {
        throw new Error('Login necessário');
      }
      
      // Normalize search term for consistency
      const normalizedTerm = term.toLowerCase().trim();
      const phoneSearch = normalizePhone(normalizedTerm);
      const documentSearch = normalizeDocument(normalizedTerm);
      
      let foundResults = [];
      
      // STEP 1: Search in user's contacts
      try {
        // First search in contacts collection filtered by ownerId
        const contactsFromFirestore = await firestoreService.searchContacts(user.uid, normalizedTerm);
        
        if (contactsFromFirestore && contactsFromFirestore.length > 0) {
          foundResults = contactsFromFirestore.map(contact => ({
            ...contact,
            source: 'contacts'
          }));
          setSearchMessage(`${contactsFromFirestore.length} contato(s) encontrado(s)`);
        }
      } catch (contactError) {
        console.error('Error searching contacts:', contactError);
        // Continue to Step 2 even if Step 1 fails
      }
      
      // STEP 2: Search in global users collection if no contacts were found
      if (foundResults.length === 0) {
        try {
          // Try searching by email first if it looks like an email
          if (normalizedTerm.includes('@')) {
            const emailResults = await firestoreService.searchUsersByEmail(normalizedTerm);
            if (emailResults && emailResults.length > 0) {
              foundResults = [...foundResults, ...emailResults];
              setSearchMessage(`${emailResults.length} usuário(s) encontrado(s) por email`);
            }
          }
          
          // Try searching by phone if it looks like a phone number
          if (foundResults.length === 0 && phoneSearch.length >= 8) {
            const phoneResults = await firestoreService.searchUsersByPhone(phoneSearch);
            if (phoneResults && phoneResults.length > 0) {
              foundResults = [...foundResults, ...phoneResults];
              setSearchMessage(`${phoneResults.length} usuário(s) encontrado(s) por telefone`);
            }
          }
          
          // Try searching by document if it looks like a document
          if (foundResults.length === 0 && documentSearch.length >= 11) {
            const documentResults = await firestoreService.searchUsersByDocument(documentSearch);
            if (documentResults && documentResults.length > 0) {
              foundResults = [...foundResults, ...documentResults];
              setSearchMessage(`${documentResults.length} usuário(s) encontrado(s) por documento`);
            }
          }
        } catch (globalSearchError) {
          console.error('Error searching global users:', globalSearchError);
          setSearchError('Erro ao buscar usuários globais');
        }
      }
      
      // Show "Add manually" option if no results
      if (foundResults.length === 0) {
        setShowAddManually(true);
        setSearchMessage('Nenhum resultado encontrado');
      }
      
      // Process results and update state
      const processedResults = foundResults.map(result => ({
        id: result.id || '',
        source: result.source || 'unknown',
        fullName: result.fullName || result.name || result.nome || 'Usuário',
        name: result.name || result.fullName || result.nome || '',
        email: result.email || '',
        phone: result.phone || result.telefone || '',
        company: result.company || result.empresa || ''
      }));
      
      setSearchResults(processedResults);
      setFilteredContacts(processedResults.filter(r => r.source === 'contacts'));
      setGlobalSearchResults(processedResults.filter(r => r.source === 'users'));
      
      // Set foundGlobalUser if exactly one global user is found
      const globalUsers = processedResults.filter(r => r.source === 'users');
      if (globalUsers.length === 1) {
        setFoundGlobalUser(globalUsers[0]);
      } else {
        setFoundGlobalUser(null);
      }
    } catch (error) {
      console.error('Unexpected error during search:', error);
      setSearchError(error.message || 'Ocorreu um erro inesperado');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Normalize phone number to digits only (for search)
  const normalizePhone = (phone) => {
    if (!phone) return '';
    return String(phone).replace(/\D/g, '');
  };

  // Normalize document (CPF/CNPJ) to digits only
  const normalizeDocument = (doc) => {
    if (!doc) return '';
    return String(doc).replace(/\D/g, '');
  };
  
  /**
   * Handle the two-step search process:
   * 1. First search user's contacts (filtered by ownerId)
   * 2. If no results, search global users collection
   * 
   * IMPORTANT: Firestore indexing requirements for performance:
   * - Index on contacts collection: (ownerId, email)
   * - Index on contacts collection: (ownerId, phone)
   * - Index on contacts collection: (ownerId, document)
   * - Index on contacts collection: (ownerId, name)
   * - Index on users collection: (email)
   * - Index on users collection: (phone)
   * - Index on users collection: (document)
   * - Index on contacts collection: (ownerId, phoneRaw)
   * - Index on contacts collection: (ownerId, documentRaw)
   */
// Function to create a new contact with default values
const resetNewContact = () => {
  setNewContact({
    documentType: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    address: {
      zipCode: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: ''
    },
    avatar: '',
    serasaScore: null,
    recado: '',
    configuracoesPerfil: {
      visibilidade: 'publico',
      notificacoes: true,
      receberChamadas: true,
      respostaAutomatica: ''
    },
  });
  setShowNewContactForm(false);
};

// Handle phone input with formatting
const handlePhoneChange = (e) => {
  let value = e.target.value.replace(/\D/g, ''); // Remove all non-digits
  
  // Limit input to 11 digits (DDD + number)
  if (value.length > 11) {
    value = value.slice(0, 11);
  }
  
  // Apply formatting as the user types
  if (value.length <= 2) {
    // Just DDD
    value = value;
  } else if (value.length <= 7) {
    // DDD + First part of the number
    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
  } else {
    // Complete number
    value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
  }
  
  // Update state
  setNewContact(prev => ({ ...prev, phone: value }));
};

// Handle form submission to create a new contact
const handleCreateContact = async (e) => {
  e.preventDefault();
  
  // Validate required fields - check fullName first, then name as fallback
  if (!(newContact.fullName || newContact.name)) {
    showNotification('Nome é obrigatório', 'error');
    return;
  }
  
  try {
    // Extract raw versions of phone and document
    const phoneRaw = newContact.phone ? newContact.phone.replace(/\D/g, '') : '';
    const documentRaw = newContact.document ? newContact.document.replace(/\D/g, '') : '';
    
    // Ensure address object has all required fields and no null values
    const safeAddress = {
      zipCode: (newContact.address?.zipCode || '').trim(),
      street: (newContact.address?.street || '').trim(), 
      number: (newContact.address?.number || '').trim(),
      complement: (newContact.address?.complement || '').trim(),
      neighborhood: (newContact.address?.neighborhood || '').trim(),
      city: (newContact.address?.city || '').trim(),
      state: (newContact.address?.state || '').trim()
    };
    
    // Remove configuracoesPerfil if it contains null or undefined values
    const safeConfigPerfil = newContact.configuracoesPerfil ? {
      visibilidade: newContact.configuracoesPerfil.visibilidade || 'publico',
      notificacoes: typeof newContact.configuracoesPerfil.notificacoes === 'boolean' 
                   ? newContact.configuracoesPerfil.notificacoes 
                   : true,
      receberChamadas: typeof newContact.configuracoesPerfil.receberChamadas === 'boolean'
                      ? newContact.configuracoesPerfil.receberChamadas
                      : true,
      respostaAutomatica: newContact.configuracoesPerfil.respostaAutomatica || '',
    } : {
      visibilidade: 'publico',
      notificacoes: true,
      receberChamadas: true,
      respostaAutomatica: ''
    };

    // Prepare contact data with both formatted and raw versions
    const contactData = {
      // Ensure core fields exist with safe defaults
      name: (newContact.fullName || newContact.name || '').trim(),
      fullName: (newContact.fullName || newContact.name || '').trim(),
      email: (newContact.email || '').trim(),
      company: (newContact.company || '').trim(),
      recado: (newContact.recado || '').trim(),
      
      // Keep formatted and raw phone/document
      phone: newContact.phone || '',
      phoneRaw: phoneRaw,
      document: newContact.document || '',
      documentRaw: documentRaw,
      
      // Use safe address and configuracoesperfil objects
      address: safeAddress,
      configuracoesPerfil: safeConfigPerfil,
      
      // Safe defaults for other fields
      avatar: newContact.avatar || '',
      status: 'offline',
      lastMessage: '',
      
      // Add owner ID - ensure it's a string
      ownerId: getAuth().currentUser?.uid || '',
    };
    
    // Remove any potential null or undefined values before sending to Firestore
    Object.keys(contactData).forEach(key => {
      if (contactData[key] === null || contactData[key] === undefined) {
        if (typeof contactData[key] === 'string') {
          contactData[key] = '';
        } else if (typeof contactData[key] === 'boolean') {
          contactData[key] = false;
        } else if (typeof contactData[key] === 'number') {
          contactData[key] = 0;
        } else if (Array.isArray(contactData[key])) {
          contactData[key] = [];
        } else if (typeof contactData[key] === 'object') {
          contactData[key] = {};
        }
      }
    });
    
    console.log('Sanitized contact data before sending to Firestore:', contactData);
    
    // Verificação final para garantir que ownerId nunca seja null
    if (!contactData.ownerId) {
      const currentUser = getAuth().currentUser;
      if (!currentUser || !currentUser.uid) {
        showNotification('Você precisa estar logado para adicionar contatos', 'error');
        return;
      }
      contactData.ownerId = currentUser.uid;
    }
    
    // Garantir que o objeto address nunca seja null
    if (!contactData.address) {
      contactData.address = {
        zipCode: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: ''
      };
    }
    
    // Remover quaisquer propriedades nulas para evitar erros do Firestore
    Object.keys(contactData).forEach(key => {
      if (contactData[key] === null || contactData[key] === undefined) {
        if (typeof contactData[key] === 'string') {
          contactData[key] = '';
        } else if (typeof contactData[key] === 'boolean') {
          contactData[key] = false;
        } else if (typeof contactData[key] === 'number') {
          contactData[key] = 0;
        } else if (Array.isArray(contactData[key])) {
          contactData[key] = [];
        } else if (typeof contactData[key] === 'object') {
          contactData[key] = {};
        }
      }
    });
    
    // Add contact to database
    const addedContact = await Database.addContact(contactData);
    
    // Show success notification
    showNotification(`Contato ${newContact.name} adicionado com sucesso`, 'success');
    
    // Call callback to update contacts list in parent component
    if (onAddNewContact) {
      onAddNewContact(addedContact);
    }
    
    // Reset form and close modal
    resetNewContact();
    setShowNewContactForm(false);
  } catch (error) {
    console.error('Erro ao criar contato:', error);
    showNotification(`Erro ao adicionar contato: ${error.message}`, 'error');
  }
};

  // Start a conversation with global user
  const handleStartConversationWithGlobalUser = async (user) => {
    try {
      // Validate user
      if (!user || !user.id) {
        console.error('Dados de usuário inválidos:', user);
        throw new Error('Dados de usuário inválidos ou incompletos');
      }
      
      // Get current user
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('Você precisa estar logado para iniciar uma conversa');
      }
      
      console.log('Iniciando conversa entre usuários:', {currentUserId: currentUser.uid, targetUserId: user.id});
      
      // Create a conversation between current user and the found global user
      const conversation = await firestoreService.getOrCreateConversation([currentUser.uid, user.id]);
      
      // Create a contact from the global user if not already in contacts
      const existingContact = contacts.find(contact => 
        (contact.userId === user.id) || 
        (contact.email && user.email && contact.email.toLowerCase() === user.email.toLowerCase()) ||
        (contact.phone && user.telefone && contact.phone === user.telefone)
      );
      
      if (!existingContact) {
        // Create a contact record from the user data
        const contactData = {
          fullName: user.fullName || user.nome || user.name || 'Usuário',
          name: user.fullName || user.nome || user.name || 'Usuário',
          email: user.email || '',
          phone: user.telefone || user.phone || '',
          phoneRaw: (user.telefone || user.phone || '').replace(/\D/g, ''), // Raw phone for searching
          company: user.empresa || user.company || '',
          document: user.cpfCnpj || user.document || '',
          documentRaw: (user.cpfCnpj || user.document || '').replace(/\D/g, ''), // Raw document for searching
          ownerId: currentUser.uid,
          userId: user.id, // Reference to the actual user
        };
        
        // Add the contact to the database
        try {
          await Database.addContact(contactData);
          showNotification('Contato adicionado automaticamente à sua lista', 'success');
        } catch (contactError) {
          console.error('Erro ao adicionar contato:', contactError);
          // Continue anyway since we have the conversation
        }
      }
      
      // Close modal and redirect to the conversation
      onClose();
      
      // Call the onSelectContact function to navigate to the conversation
      if (conversation) {
        // Create a simplified contact object for the handler
        const contactForHandler = existingContact || {
          id: conversation.id,
          fullName: user.fullName || user.nome || user.name || 'Usuário',
          name: user.fullName || user.nome || user.name || 'Usuário',
          email: user.email || '',
          phone: user.telefone || user.phone || '',
          phoneRaw: (user.telefone || user.phone || '').replace(/\D/g, ''),
          userId: user.id,
        };
        
        onSelectContact(contactForHandler, conversation.id);
      }
    } catch (error) {
      console.error('Erro ao iniciar conversa:', error);
      showNotification(`Erro ao iniciar conversa: ${error.message}`, 'error');
    }
  };

  // Render search results (local and global) using searchResults as the source of truth
  const renderSearchResults = () => {
    if (!searchTerm) {
      return (
        <div className="p-4">
          <div className="space-y-2 mb-4">
            {nonContactUsers.map(user => {
              const userDisplayName = user.fullName || user.nome || user.name || user.displayName || 'Usuário';
              const userDisplayInfo = user.email || user.telefone || user.phone || '';
              
              return (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg cursor-pointer ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={userDisplayName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="text-lg font-semibold">{userDisplayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{userDisplayName}</div>
                      {userDisplayInfo && <div className="text-sm text-gray-500">{userDisplayInfo}</div>}
                    </div>
                    <button
                      onClick={() => handleStartConversationWithGlobalUser(user)}
                      className="ml-2 flex-shrink-0 bg-blue-500 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-600 transition-colors"
                    >
                      Conversar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    // Derive local and global results from searchResults
    const localResults = searchResults.filter(r => r.source === 'contacts');
    const globalResults = searchResults.filter(r => r.source === 'users');
    
    // Show loading indicator while searching
    if (isSearching || isSearchingGlobal) {
      return (
        <div className="flex justify-center items-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }
    
    // Show global user found banner
    if (foundGlobalUser || (globalResults.length === 1 && globalResults[0])) {
      // Use either foundGlobalUser or the single global result
      const user = foundGlobalUser || globalResults[0];
      const userDisplayName = user.fullName || user.nome || user.name || user.displayName || 'Usuário';
      const userDisplayInfo = user.email || user.telefone || user.phone || '';
      
      return (
        <div className="p-4">
          <div className={`mb-4 p-4 rounded-lg border ${
            darkMode ? 'bg-blue-900/20 border-blue-700' : 'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Contato encontrado no app</span>
            </div>
            
            <div className="flex items-center space-x-3 mb-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                {user.avatar ? (
                  <img src={user.avatar} alt={userDisplayName} className="w-10 h-10 rounded-full" />
                ) : (
                  <span className="text-lg font-semibold">{userDisplayName.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="font-medium">{userDisplayName}</div>
                {userDisplayInfo && <div className="text-sm text-gray-500">{userDisplayInfo}</div>}
              </div>
            </div>
            
            <button
              onClick={() => handleStartConversationWithGlobalUser(user)}
              className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
              </svg>
              Enviar mensagem
            </button>
          </div>
        </div>
      );
    }
    
    // Show global search results if any (and no single user was found)
    if (globalResults.length > 1) {
      return (
        <div className="p-4">
          <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Usuários encontrados no app:
          </h4>
          <div className="space-y-2 mb-4">
            {globalResults.map(user => {
              const userDisplayName = user.fullName || user.nome || user.name || user.displayName || 'Usuário';
              const userDisplayInfo = user.email || user.telefone || user.phone || '';
              
              return (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg cursor-pointer ${
                    darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => handleStartConversationWithGlobalUser(user)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      {user.avatar ? (
                        <img src={user.avatar} alt={userDisplayName} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span className="text-lg font-semibold">{userDisplayName.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{userDisplayName}</div>
                      {userDisplayInfo && <div className="text-sm text-gray-500">{userDisplayInfo}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // Show local contact results
    if (localResults.length > 0) {
      return (
        <div className="p-4">
          <h4 className={`text-sm font-medium my-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Seus contatos:
          </h4>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {localResults.map(contact => (
              <div
                key={contact.id}
                className={`py-3 cursor-pointer ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                onClick={() => handleSelectExistingContact(contact)}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    {contact.avatar ? (
                      <img src={contact.avatar} alt={contact.name} className="w-10 h-10 rounded-full" />
                    ) : (
                      <span className="text-lg font-semibold">{(contact.fullName || contact.name).charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{contact.fullName || contact.name}</div>
                    {contact.email && <div className="text-sm text-gray-500">{contact.email}</div>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    // If no results and we have a search term, show the "not found" message
    if (searchTerm.length >= 3 && localResults.length === 0 && globalResults.length === 0 && !isSearching && !isSearchingGlobal) {
      return (
        <div className="p-4">
          <p className="text-center mb-4">Nenhum contato encontrado com esse termo.</p>
        </div>
      );
    }
    
    // Default return if no condition is met
    return (
      <div className="p-4">
        {searchTerm.trim() === '' ? (
          <p className="text-center text-gray-500">Digite um termo para buscar contatos</p>
        ) : (
          <p className="text-center text-gray-500">Digite pelo menos 3 caracteres para buscar</p>
        )}
      </div>
    );
  }; // Close renderSearchResults function

  // Now we add the return statement with a properly structured JSX tree
  // Add style element for modal animation
  useEffect(() => {
    // Create style element if it doesn't exist
    if (!document.getElementById('modal-animation-style')) {
      const styleElement = document.createElement('style');
      styleElement.id = 'modal-animation-style';
      styleElement.textContent = modalAnimationStyle;
      document.head.appendChild(styleElement);
      
      // Clean up on unmount
      return () => {
        const styleToRemove = document.getElementById('modal-animation-style');
        if (styleToRemove) {
          document.head.removeChild(styleToRemove);
        }
      };
    }
  }, []);

  return (
    <>
      <CSSTransition
        in={isOpen}
        timeout={300}
        classNames="modal-animation"
        unmountOnExit
      >
        <div className="fixed inset-0 z-50 overflow-hidden bg-black bg-opacity-50 flex items-center justify-center p-4 transition-opacity duration-300 ease-out">
          <div 
            ref={modalRef}
            className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl transform transition-all duration-300 ease-out scale-100 opacity-100 ${
              darkMode ? 'bg-[#121212] text-white' : 'bg-white text-[#121212]'
            }`}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
              <h3 className="text-lg font-medium">
                {showNewContactForm ? 'Novo Contato' : 'Nova Conversa'}
              </h3>
              <button 
                onClick={onClose}
                className={`rounded-md p-1 inline-flex items-center justify-center focus:outline-none ${
                  darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="overflow-hidden">
              {/* Notification */}
              {notification.show && (
                <div className={`p-3 ${
                  notification.type === 'success' ? 'bg-green-100 text-green-800' :
                  notification.type === 'error' ? 'bg-red-100 text-red-800' :
                  notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {notification.message}
                </div>
              )}
              
              {/* Search Input - only shown when not in new contact form mode */}
              {!showNewContactForm && (
                <div className="mt-4 relative mx-4">
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Buscar contatos..."
                    value={searchTerm}
                    onChange={handleSearchInputChange}
                    className={`w-full p-3 pr-10 border rounded-lg ${
                      darkMode 
                        ? 'bg-[#1A1A1A] border-gray-700 text-white placeholder-gray-400'
                        : 'bg-white border-gray-200 text-[#121212] placeholder-gray-500'
                    }`}
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              )}
              
              {/* Content based on mode: New Contact Form or Contact List */}
              {showNewContactForm ? (
                <form onSubmit={handleCreateContact} className="p-4" ref={formRef}>
                  <div className="space-y-4">
                    {/* Document (CPF/CNPJ) field with auto-fill functionality */}
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 flex items-center justify-between`}>
                        <span>CPF/CNPJ *</span>
                        {loading.document && (
                          <span className="text-xs text-blue-500 flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Buscando dados
                          </span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        value={newContact.document}
                        onChange={handleDocumentChange}
                        className={`w-full p-2 border rounded-md ${
                          darkMode 
                            ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      />
                      {newContact.documentType && (
                        <div className="mt-1 text-xs text-gray-500">
                          Documento identificado: {newContact.documentType}
                        </div>
                      )}
                    </div>
                    
                    {/* Serasa Score Card */}
                    {showSerasaScore && newContact.serasaScore && (
                      <div className="mb-4">
                        <SerasaScoreCard
                          document={newContact.document}
                          documentType={newContact.documentType}
                          name={newContact.name || "Novo Contato"}
                          isExpanded={false}
                          onClose={() => setShowSerasaScore(false)}
                        />
                      </div>
                    )}
                    
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Nome *
                      </label>
                      <input 
                        type="text" 
                        value={newContact.name}
                        onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                        required
                        className={`w-full p-2 border rounded-md ${
                          darkMode 
                            ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Nome do contato"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Email
                      </label>
                      <input 
                        type="email" 
                        value={newContact.email}
                        onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                        className={`w-full p-2 border rounded-md ${
                          darkMode 
                            ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="email@exemplo.com"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Telefone
                      </label>
                      <input 
                        type="tel" 
                        value={newContact.phone}
                        onChange={handlePhoneChange}
                        className={`w-full p-2 border rounded-md ${
                          darkMode 
                            ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Empresa
                      </label>
                      <input 
                        type="text" 
                        value={newContact.company}
                        onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                        className={`w-full p-2 border rounded-md ${
                          darkMode 
                            ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Nome da empresa"
                      />
                    </div>
                    
                    {/* CEP field with auto-fill */}
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1 flex items-center justify-between`}>
                        <span>CEP</span>
                        {loading.zipCode && (
                          <span className="text-xs text-blue-500 flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Buscando endereço
                          </span>
                        )}
                      </label>
                      <input 
                        type="text" 
                        value={newContact.address.zipCode}
                        onChange={handleCEPChange}
                        className={`w-full p-2 border rounded-md ${
                          darkMode 
                            ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="00000-000"
                      />
                    </div>
                    
                    {/* Address fields */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Rua
                        </label>
                        <input 
                          type="text" 
                          value={newContact.address.street}
                          onChange={(e) => setNewContact({
                            ...newContact, 
                            address: { ...newContact.address, street: e.target.value }
                          })}
                          className={`w-full p-2 border rounded-md ${
                            darkMode 
                              ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Rua ou Avenida"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Número
                        </label>
                        <input 
                          type="text" 
                          value={newContact.address.number}
                          onChange={(e) => setNewContact({
                            ...newContact, 
                            address: { ...newContact.address, number: e.target.value }
                          })}
                          className={`w-full p-2 border rounded-md ${
                            darkMode 
                              ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Número"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Complemento
                      </label>
                      <input 
                        type="text" 
                        value={newContact.address.complement}
                        onChange={(e) => setNewContact({
                          ...newContact, 
                          address: { ...newContact.address, complement: e.target.value }
                        })}
                        className={`w-full p-2 border rounded-md ${
                          darkMode 
                            ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="Apartamento, sala, etc."
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Bairro
                        </label>
                        <input 
                          type="text" 
                          value={newContact.address.neighborhood}
                          onChange={(e) => setNewContact({
                            ...newContact, 
                            address: { ...newContact.address, neighborhood: e.target.value }
                          })}
                          className={`w-full p-2 border rounded-md ${
                            darkMode 
                              ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Bairro"
                        />
                      </div>
                      <div>
                        <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Cidade
                        </label>
                        <input 
                          type="text" 
                          value={newContact.address.city}
                          onChange={(e) => setNewContact({
                            ...newContact, 
                            address: { ...newContact.address, city: e.target.value }
                          })}
                          className={`w-full p-2 border rounded-md ${
                            darkMode 
                              ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                              : 'bg-white border-gray-300 text-gray-900'
                          }`}
                          placeholder="Cidade"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Estado
                      </label>
                      <input 
                        type="text" 
                        value={newContact.address.state}
                        onChange={(e) => setNewContact({
                          ...newContact, 
                          address: { ...newContact.address, state: e.target.value }
                        })}
                        className={`w-full p-2 border rounded-md ${
                          darkMode 
                            ? 'bg-[#1A1A1A] border-gray-700 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        placeholder="UF"
                        maxLength={2}
                      />
                    </div>
                    

                    {/* Form Buttons */}
                    <div className="mt-6 flex items-center justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setShowNewContactForm(false)}
                        className={`px-4 py-2 rounded-md ${
                          darkMode 
                            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                            : 'bg-gray-200 hover:bg-gray-300 text-[#121212]'
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-md bg-[#2B4FFF] hover:bg-[#3D2AFF] text-white"
                      >
                        Criar Contato
                      </button>
                    </div>
                  </div>
                </form>
            ) : (
                <>
                  <div className="max-h-[60vh] overflow-y-auto">
                    {renderSearchResults()}
                  </div>
                  {/* Modal Footer */}
                  <div className={`px-4 py-3 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {!showNewContactForm && (
                      <div className="flex justify-center">
                        <button
                          onClick={() => setShowNewContactForm(true)}
                          className="flex items-center justify-center w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none"
                        >
                          Novo Contato
                        </button>
                      </div>
                    )}
                  </div>
                </>
            )}
          </div>
        </div>
      </div>
      </CSSTransition>
    </>
  );
};

export default NewConversationModal;