// src/components/Contacts/ContactsScreen.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import firestoreService from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

// Business categories for dropdown
const BUSINESS_CATEGORIES = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Retail',
  'Manufacturing',
  'Marketing',
  'Consulting',
  'Legal',
  'Real Estate',
  'Hospitality',
  'Entertainment',
  'Agriculture',
  'Transportation',
  'Construction',
  'Energy',
  'Other'
];

// Contact Card Component
const ContactCard = ({ contact, darkMode, onEdit, onDelete, onBlock, onUnblock, isBlocked }) => {
  const [showActions, setShowActions] = useState(false);
  
  const toggleActions = (e) => {
    e.stopPropagation();
    setShowActions(!showActions);
  };
  
  // Close the action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (showActions) setShowActions(false);
    };
    
    if (showActions) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showActions]);
  
  return (
    <div className={`relative rounded-lg p-4 ${darkMode ? 'bg-[#1F1F1F]' : 'bg-white'} shadow-sm border ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
      <div>
        <div className="flex justify-between items-start">
          <h3 className="font-medium">
            {contact.name}
            {isBlocked && (
              <span className="ml-2 text-xs text-red-500 font-normal">Bloqueado</span>
            )}
          </h3>
          <button 
            onClick={toggleActions}
            className={`p-1 rounded-full ${darkMode ? 'hover:bg-[#333]' : 'hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
        </div>
        
        <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {contact.email}
        </p>
        
        {contact.company && (
          <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {contact.company}
          </p>
        )}
        
        {contact.businessCategory && (
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
            darkMode 
              ? 'bg-[#333] text-gray-300' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {contact.businessCategory}
          </span>
        )}
      </div>
      
      {/* Action buttons */}
      {showActions && (
        <div 
          className={`absolute right-2 top-12 z-10 rounded-md shadow-lg py-1 
            ${darkMode ? 'bg-[#1F1F1F] border border-[#333]' : 'bg-white border border-gray-200'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <a 
            href={`/dashboard/chat?contact=${contact.id}`}
            className={`block px-4 py-2 text-sm ${darkMode ? 'hover:bg-[#333] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            Mensagem
          </a>
          <button 
            onClick={() => {
              setShowActions(false);
              onEdit();
            }}
            className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'hover:bg-[#333] text-white' : 'hover:bg-gray-100 text-gray-700'}`}
          >
            Editar
          </button>
          {isBlocked ? (
            <button 
              onClick={() => {
                setShowActions(false);
                onUnblock();
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'hover:bg-[#333] text-green-400' : 'hover:bg-gray-100 text-green-600'}`}
            >
              Desbloquear
            </button>
          ) : (
            <button 
              onClick={() => {
                setShowActions(false);
                onBlock();
              }}
              className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'hover:bg-[#333] text-yellow-400' : 'hover:bg-gray-100 text-yellow-600'}`}
            >
              Bloquear
            </button>
          )}
          <button 
            onClick={() => {
              setShowActions(false);
              onDelete();
            }}
            className={`block w-full text-left px-4 py-2 text-sm ${darkMode ? 'hover:bg-[#333] text-red-400' : 'hover:bg-gray-100 text-red-600'}`}
          >
            Excluir
          </button>
        </div>
      )}
    </div>
  );
};

const ContactsScreen = () => {
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('all');
  const [contacts, setContacts] = useState([]);
  const [blockedContacts, setBlockedContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);
  
  // New contact form state
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    businessCategory: '',
    notes: ''
  });
  
  // Load contacts on component mount or when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setIsLoading(true);
      loadContacts().catch(err => {
        console.error("Failed to load contacts:", err);
        setIsLoading(false);
        setError(err);
      });
    } else {
      setIsLoading(false);
    }
    
    // Cleanup function
    return () => {
      // Unsubscribe from Firestore on unmount
      if (subscription && typeof subscription === 'function') {
        subscription();
      }
    };
  }, [currentUser]);
  
  // Filter contacts when search term changes or other filter criteria change
  useEffect(() => {
    filterContacts();
  }, [searchTerm, contacts, activeTab, selectedCategory, blockedContacts]);
  
  // Subscribe to contacts from Firestore - refactored for better reliability
  useEffect(() => {
    if (!currentUser) return;
    
    // Reset states
    setIsLoading(true);
    setError(null);
    
    const setupSubscription = async () => {
      // Unsubscribe from any existing subscription
      if (subscription && typeof subscription === 'function') {
        subscription();
      }
      
      try {
        // Subscribe to contacts collection
        const unsubscribeContacts = firestoreService.subscribeToContacts(
          currentUser.uid,
          (contactsData) => {
            console.log('Contacts data received:', contactsData?.length || 0);
            setContacts(contactsData || []);
            // Only set loading to false after we receive the first batch of data
            setIsLoading(false);
            setInitialLoaded(true);
          },
          (error) => {
            console.error('Error in contacts subscription:', error);
            setError(error);
            setIsLoading(false);
          }
        );
        
        // Store the unsubscribe function
        setSubscription(() => unsubscribeContacts);
        
        // Fetch blocked contacts separately
        try {
          // Check if the function exists in firestoreService
          if (typeof firestoreService.getBlockedContacts === 'function') {
            const blocked = await firestoreService.getBlockedContacts(currentUser.uid);
            setBlockedContacts(blocked || []);
          } else {
            // Alternative: fetch contacts with a 'blocked' field
            const allContacts = await firestoreService.getAllContacts(currentUser.uid);
            const blocked = allContacts ? allContacts.filter(contact => contact.blocked === true) : [];
            setBlockedContacts(blocked);
          }
        } catch (blockErr) {
          console.error('Error fetching blocked contacts:', blockErr);
          // Don't fail the whole component if blocked contacts can't be fetched
          setBlockedContacts([]);
        }
      } catch (err) {
        console.error('Error setting up subscription:', err);
        setError(err);
        setIsLoading(false);
        
        // Fallback: try to load contacts directly as a last resort
        try {
          const allContacts = await firestoreService.getAllContacts(currentUser.uid);
          setContacts(allContacts || []);
          setIsLoading(false);
          setInitialLoaded(true);
        } catch (fallbackErr) {
          console.error('Fallback load failed:', fallbackErr);
          // At this point, we've truly failed to load contacts
          setContacts([]);
          setIsLoading(false);
          setInitialLoaded(true);
        }
      }
    };
    
    setupSubscription();
    
    // Cleanup function
    return () => {
      if (subscription && typeof subscription === 'function') {
        subscription();
      }
    };
  }, [currentUser]);
  
  const loadContacts = async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Loading contacts directly for:', currentUser.uid);
      const allContacts = await firestoreService.getAllContacts(currentUser.uid);
      
      // Handle null or undefined response from the service
      if (!allContacts) {
        console.warn('No contacts returned from Firestore service');
        setContacts([]);
        setBlockedContacts([]);
        setIsLoading(false); // Important: still need to set loading to false
        setInitialLoaded(true);
        return;
      }
      
      console.log('Loaded contacts:', allContacts.length);
      setContacts(allContacts);
      
      // Load blocked contacts
      try {
        if (typeof firestoreService.getBlockedContacts === 'function') {
          const blocked = await firestoreService.getBlockedContacts(currentUser.uid);
          setBlockedContacts(blocked || []);
        } else {
          // Alternative implementation: filter contacts with a 'blocked' field
          const blocked = allContacts.filter(contact => contact.blocked === true);
          setBlockedContacts(blocked);
        }
      } catch (blockErr) {
        console.error('Error loading blocked contacts:', blockErr);
        setBlockedContacts([]);
      }
      
    } catch (err) {
      console.error('Error loading contacts:', err);
      setError(err);
      toast.error('Erro ao carregar contatos. Por favor, tente novamente.');
      // Still set contacts to empty array
      setContacts([]);
    } finally {
      setIsLoading(false);
      setInitialLoaded(true);
    }
  };
  
  const filterContacts = () => {
    if (!contacts || contacts.length === 0) {
      setFilteredContacts([]);
      return;
    }
    
    let filtered = [...contacts];
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        (contact.name && contact.name.toLowerCase().includes(searchLower)) || 
        (contact.email && contact.email.toLowerCase().includes(searchLower)) || 
        (contact.company && contact.company.toLowerCase().includes(searchLower))
      );
    }
    
    // Filter by tab
    if (activeTab === 'blocked') {
      // Show only blocked contacts
      filtered = filtered.filter(contact => isContactBlocked(contact.id));
    } else if (activeTab === 'all') {
      // Show only non-blocked contacts on "All" tab
      filtered = filtered.filter(contact => !isContactBlocked(contact.id));
    }
    
    // Filter by selected category
    if (selectedCategory && activeTab === 'categories') {
      filtered = filtered.filter(contact => 
        contact.businessCategory === selectedCategory
      );
    }
    
    setFilteredContacts(filtered);
    
    // Log for debugging
    console.log(`Filtered contacts: ${filtered.length} from total: ${contacts.length}`);
  };
  
  // Check if a contact is blocked
  const isContactBlocked = (contactId) => {
    // First check if the contact has a blocked field
    const contact = contacts.find(c => c.id === contactId);
    if (contact && contact.blocked === true) {
      return true;
    }
    
    // Then check if it exists in the blockedContacts array
    return blockedContacts.some(blocked => 
      blocked.contactId === contactId || blocked.id === contactId
    );
  };
  
  // Group contacts by business category
  const getContactsGroupedByCategory = () => {
    const grouped = {};
    
    // Initialize categories
    BUSINESS_CATEGORIES.forEach(category => {
      grouped[category] = [];
    });
    
    // Add "Uncategorized" category
    grouped['Uncategorized'] = [];
    
    // Group contacts
    contacts.forEach(contact => {
      // Skip blocked contacts
      if (!isContactBlocked(contact.id)) {
        if (contact.businessCategory && grouped[contact.businessCategory]) {
          grouped[contact.businessCategory].push(contact);
        } else {
          grouped['Uncategorized'].push(contact);
        }
      }
    });
    
    return grouped;
  };
  
  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };
  
  // Handle tab changes
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'categories') {
      setSelectedCategory(BUSINESS_CATEGORIES[0]);
    } else {
      setSelectedCategory('');
    }
  };
  
  // Handle category selection
  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (editingContact) {
      setEditingContact(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setNewContact(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  // Handle adding a new contact
  const handleAddNewContact = () => {
    setEditingContact(null);
    setNewContact({
      name: '',
      email: '',
      phone: '',
      company: '',
      businessCategory: '',
      notes: ''
    });
    setIsAddingContact(true);
  };
  
  // Handle canceling add/edit
  const handleCancelAdd = () => {
    setIsAddingContact(false);
    setEditingContact(null);
  };
  
  // Handle saving a contact (add or update)
  const handleSaveContact = async () => {
    if (!currentUser) return;
    
    try {
      // Validate form
      if (!editingContact && !newContact.name) {
        toast.error('Por favor, insira o nome do contato.');
        return;
      }
      if (editingContact && !editingContact.name) {
        toast.error('Por favor, insira o nome do contato.');
        return;
      }
      
      // Add or update contact
      if (editingContact) {
        // Update existing contact
        await firestoreService.updateContact(editingContact.id, {
          ...editingContact,
          updatedAt: new Date()
        });
        toast.success('Contato atualizado com sucesso!');
      } else {
        // Add new contact
        await firestoreService.addContact({
          ...newContact,
          ownerId: currentUser.uid,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        toast.success('Contato adicionado com sucesso!');
      }
      
      // Reset form and reload
      setIsAddingContact(false);
      setEditingContact(null);
      await loadContacts();
      
    } catch (err) {
      console.error('Error saving contact:', err);
      toast.error(editingContact 
        ? 'Erro ao atualizar contato. Por favor, tente novamente.' 
        : 'Erro ao adicionar contato. Por favor, tente novamente.'
      );
    }
  };
  
  // Handle editing a contact
  const handleEditContact = (contact) => {
    setEditingContact({...contact});
    setIsAddingContact(true);
  };
  
  // Handle deleting a contact
  const handleDeleteContact = async (contactId) => {
    if (!contactId || !window.confirm('Tem certeza que deseja excluir este contato?')) {
      return;
    }
    
    try {
      await firestoreService.deleteContact(contactId);
      toast.success('Contato removido com sucesso!');
      await loadContacts();
    } catch (err) {
      console.error('Error deleting contact:', err);
      toast.error('Erro ao excluir contato. Por favor, tente novamente.');
    }
  };
  
  // Handle blocking a contact
  const handleBlockContact = async (contactId) => {
    if (!currentUser || !contactId) return;
    
    try {
      // Check if blockContact function exists
      if (typeof firestoreService.blockContact === 'function') {
        await firestoreService.blockContact(currentUser.uid, contactId);
      } else {
        // Alternative: update the contact with a blocked field
        await firestoreService.updateContact(contactId, { 
          blocked: true,
          updatedAt: new Date()
        });
      }
      
      // Update local state
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setBlockedContacts(prev => [...prev, { 
          id: `blocked_${contactId}`,
          userId: currentUser.uid,
          contactId: contactId,
          name: contact.name,
          blockedAt: new Date()
        }]);
      }
      
      toast.success('Contato bloqueado com sucesso.');
      await loadContacts();
    } catch (err) {
      console.error('Error blocking contact:', err);
      toast.error('Erro ao bloquear contato. Por favor, tente novamente.');
    }
  };
  
  // Handle unblocking a contact
  const handleUnblockContact = async (contactId) => {
    if (!currentUser || !contactId) return;
    
    try {
      // Check if unblockContact function exists
      if (typeof firestoreService.unblockContact === 'function') {
        await firestoreService.unblockContact(currentUser.uid, contactId);
      } else {
        // Alternative: update the contact with blocked field set to false
        await firestoreService.updateContact(contactId, { 
          blocked: false,
          updatedAt: new Date()
        });
      }
      
      // Update local state
      setBlockedContacts(prev => prev.filter(blocked => 
        blocked.contactId !== contactId && blocked.id !== contactId
      ));
      
      toast.success('Contato desbloqueado com sucesso.');
      await loadContacts();
    } catch (err) {
      console.error('Error unblocking contact:', err);
      toast.error('Erro ao desbloquear contato. Por favor, tente novamente.');
    }
  };
  
  return (
    <div className={`bg-${darkMode ? '[#121212]' : 'gray-50'} min-h-screen`}>
      {/* Header section */}
      <div className={`px-6 py-4 border-b ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <h1 className={`text-2xl font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            Contatos
          </h1>
          
          {/* Search bar */}
          <div className="mt-3 md:mt-0 flex md:w-1/3">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Buscar contatos..."
                value={searchTerm}
                onChange={handleSearchChange}
                className={`w-full rounded-lg pl-10 pr-4 py-2 ${
                  darkMode 
                    ? 'bg-[#1F1F1F] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
              />
              <div className="absolute left-3 top-2.5">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <button 
              onClick={handleAddNewContact}
              className="ml-3 px-4 py-2 bg-[#2B4FFF] text-white rounded-lg hover:bg-[#3D2AFF] transition-colors"
            >
              Adicionar
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-6 border-b border-gray-300 dark:border-gray-700">
          <button
            onClick={() => handleTabChange('all')}
            className={`pb-2 px-1 mr-4 ${
              activeTab === 'all' 
                ? `border-b-2 border-[#2B4FFF] font-medium ${darkMode ? 'text-white' : 'text-[#2B4FFF]'}` 
                : `${darkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-gray-700 dark:hover:text-white`
            }`}
          >
            Todos
          </button>
          
          <button
            onClick={() => handleTabChange('categories')}
            className={`pb-2 px-1 mr-4 ${
              activeTab === 'categories' 
                ? `border-b-2 border-[#2B4FFF] font-medium ${darkMode ? 'text-white' : 'text-[#2B4FFF]'}` 
                : `${darkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-gray-700 dark:hover:text-white`
            }`}
          >
            Categorias
          </button>
          
          <button
            onClick={() => handleTabChange('blocked')}
            className={`pb-2 px-1 mr-4 ${
              activeTab === 'blocked' 
                ? `border-b-2 border-[#2B4FFF] font-medium ${darkMode ? 'text-white' : 'text-[#2B4FFF]'}` 
                : `${darkMode ? 'text-gray-400' : 'text-gray-500'} hover:text-gray-700 dark:hover:text-white`
            }`}
          >
            Bloqueados
          </button>
        </div>
        
        {/* Category Selector - only shown when Categories tab is active */}
        {activeTab === 'categories' && (
          <div className="mt-4">
            <select
              value={selectedCategory}
              onChange={handleCategoryChange}
              className={`w-full sm:w-1/3 rounded-lg px-3 py-2 ${
                darkMode 
                  ? 'bg-[#1F1F1F] border-[#333] text-white' 
                  : 'bg-white border-gray-300 text-gray-900'
              } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
            >
              {BUSINESS_CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
              <option value="Uncategorized">Não categorizados</option>
            </select>
          </div>
        )}
      </div>
      
      {/* Loading and Error states */}
      {isLoading && (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2B4FFF]"></div>
        </div>
      )}
      
      {error && !isLoading && (
        <div className={`p-4 text-center ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
          <p>Ocorreu um erro ao carregar os contatos. Por favor, tente novamente.</p>
          <button 
            onClick={loadContacts}
            className="mt-2 underline hover:text-[#2B4FFF]"
          >
            Tentar novamente
          </button>
        </div>
      )}
      
      {/* Add/Edit Contact Form */}
      {isAddingContact && (
        <div className={`py-6 px-5 mb-6 rounded-lg ${darkMode ? 'bg-[#1F1F1F] border-[#333]' : 'bg-white border-gray-200'} border shadow-sm mx-auto mt-6 max-w-full md:max-w-4xl overflow-auto`}>
          <h2 className={`text-lg font-medium mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
            {editingContact ? 'Editar Contato' : 'Adicionar Novo Contato'}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nome*</label>
              <input
                type="text"
                name="name"
                value={editingContact ? editingContact.name : newContact.name}
                onChange={handleInputChange}
                className={`w-full rounded-lg px-3 py-2 ${
                  darkMode 
                    ? 'bg-[#121212] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">E-mail*</label>
              <input
                type="email"
                name="email"
                value={editingContact ? editingContact.email : newContact.email}
                onChange={handleInputChange}
                className={`w-full rounded-lg px-3 py-2 ${
                  darkMode 
                    ? 'bg-[#121212] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="tel"
                name="phone"
                value={editingContact ? editingContact.phone : newContact.phone}
                onChange={handleInputChange}
                className={`w-full rounded-lg px-3 py-2 ${
                  darkMode 
                    ? 'bg-[#121212] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Empresa</label>
              <input
                type="text"
                name="company"
                value={editingContact ? editingContact.company : newContact.company}
                onChange={handleInputChange}
                className={`w-full rounded-lg px-3 py-2 ${
                  darkMode 
                    ? 'bg-[#121212] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                name="businessCategory"
                value={editingContact ? editingContact.businessCategory : newContact.businessCategory}
                onChange={handleInputChange}
                className={`w-full rounded-lg px-3 py-2 ${
                  darkMode 
                    ? 'bg-[#121212] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
              >
                <option value="">Selecione uma categoria</option>
                {BUSINESS_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">Observações</label>
              <textarea
                name="notes"
                value={editingContact ? editingContact.notes : newContact.notes}
                onChange={handleInputChange}
                rows="3"
                className={`w-full rounded-lg px-3 py-2 ${
                  darkMode 
                    ? 'bg-[#121212] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
              ></textarea>
            </div>
          </div>
          
          <div className="flex justify-end mt-4 space-x-2">
            <button
              type="button"
              onClick={handleCancelAdd}
              className={`px-4 py-2 rounded-lg ${
                darkMode 
                  ? 'bg-[#333] text-white hover:bg-[#444]' 
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
              } transition-colors`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveContact}
              className="px-4 py-2 rounded-lg bg-[#2B4FFF] text-white hover:bg-[#3D2AFF] transition-colors"
            >
              {editingContact ? 'Atualizar' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
      
      
      {/* Empty state */}
      {initialLoaded && contacts.length === 0 && !isAddingContact && (
        <div className="flex flex-col items-center justify-center h-64">
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-16 w-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className={`text-lg mb-4 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            Nenhum contato disponível
          </p>
          <button 
            onClick={() => setIsAddingContact(true)}
            className="px-4 py-2 bg-[#2B4FFF] text-white rounded-lg hover:bg-[#3D2AFF] transition-colors"
          >
            Adicionar contato
          </button>
        </div>
      )}
      
      {/* Contact tabs - categories */}
          {contacts.length > 0 && activeTab === 'categories' && (
            <div className="p-4">
              {Object.entries(getContactsGroupedByCategory()).map(([category, categoryContacts]) => {
                if (categoryContacts.length === 0) return null;
                return (
                  <div key={category} className="mb-6">
                    <h3 className={`text-lg font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {category} ({categoryContacts.length})
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryContacts.map(contact => (
                        <ContactCard 
                          key={contact.id} 
                          contact={contact}
                          darkMode={darkMode}
                          onEdit={() => handleEditContact(contact)}
                          onDelete={() => handleDeleteContact(contact.id)}
                          onBlock={() => handleBlockContact(contact.id)}
                          onUnblock={() => handleUnblockContact(contact.id)}
                          isBlocked={isContactBlocked(contact.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* Contact tabs - all or blocked contacts */}
          {contacts.length > 0 && activeTab !== 'categories' && (
            <div className="p-4">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8">
                  <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {activeTab === 'blocked' 
                      ? 'Nenhum contato bloqueado.' 
                      : searchTerm 
                        ? 'Nenhum contato encontrado.' 
                        : 'Nenhum contato adicionado.'}
                  </p>
                  {activeTab !== 'blocked' && !searchTerm && (
                    <button 
                      onClick={handleAddNewContact}
                      className="mt-2 text-[#2B4FFF] hover:underline"
                    >
                      Adicionar seu primeiro contato
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredContacts.map(contact => (
                    <ContactCard 
                      key={contact.id} 
                      contact={contact}
                      darkMode={darkMode}
                      onEdit={() => handleEditContact(contact)}
                      onDelete={() => handleDeleteContact(contact.id)}
                      onBlock={() => handleBlockContact(contact.id)}
                      onUnblock={() => handleUnblockContact(contact.id)}
                      isBlocked={isContactBlocked(contact.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      
  );
};

export default ContactsScreen;
