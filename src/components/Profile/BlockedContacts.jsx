// src/components/Profile/BlockedContacts.jsx
import React, { useState, useEffect } from 'react';
import Database from '../../utils/database';

const BlockedContacts = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [blockedContacts, setBlockedContacts] = useState([]);
  const [allContacts, setAllContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);

  // Load user and blocked contacts
  useEffect(() => {
    const user = Database.getCurrentUser();
    if (user) {
      setCurrentUser(user);
      
      // Get blocked contacts
      const blockedUsers = Database.getBlockedContacts(user.id);
      if (blockedUsers && blockedUsers.length > 0) {
        // Format blocked contacts for display
        const blockedDetails = blockedUsers.map(blocked => {
          const contact = Database.getContact(blocked.contactId) || { id: blocked.contactId, name: blocked.name };
          return {
            id: contact.id,
            name: contact.name || blocked.name,
            avatar: contact.avatar,
            email: contact.email,
            lastSeen: contact.lastSeen || 'Desconhecido',
            blockedAt: blocked.blockedAt
          };
        });
        
        setBlockedContacts(blockedDetails);
      }
      
      // Get all contacts for blocking new ones
      const contacts = Database.getAllContacts() || [];
      const blockedIds = blockedUsers ? blockedUsers.map(b => b.contactId) : [];
      
      setAllContacts(contacts.filter(contact => {
        // Filter out already blocked contacts
        return !blockedIds.includes(contact.id);
      }));
    }
  }, []);

  // Handle unblocking a contact
  const handleUnblock = (contactId) => {
    if (!currentUser) return;
    
    // Confirm before unblocking
    if (window.confirm('Desbloquear este contato? Eles poderão enviar mensagens novamente.')) {
      // Unblock in database
      const unblocked = Database.unblockContact(currentUser.id, contactId);
      
      if (unblocked) {
        // Remove from blocked list in UI
        const updatedBlocked = blockedContacts.filter(contact => contact.id !== contactId);
        setBlockedContacts(updatedBlocked);
        
        // Add back to available contacts
        const contact = Database.getContact(contactId) || Database.getUser(contactId);
        if (contact) {
          setAllContacts(prev => [...prev, {
            id: contact.id,
            name: contact.name,
            avatar: contact.avatar,
            email: contact.email
          }]);
        }
        
        alert('Contato desbloqueado com sucesso.');
      }
    }
  };

  // Handle blocking a new contact
  const handleBlock = () => {
    if (!selectedContact || !currentUser) return;
    
    // Find the contact details
    const contactToBlock = allContacts.find(contact => contact.id === selectedContact);
    if (!contactToBlock) return;
    
    // Block contact in database
    const blocked = Database.blockContact(currentUser.id, selectedContact);
    
    if (blocked) {
      // Add to blocked list in UI
      const updatedContact = {
        ...contactToBlock,
        blockedAt: blocked.blockedAt
      };
      
      setBlockedContacts(prev => [...prev, updatedContact]);
      
      // Remove from available contacts
      setAllContacts(prev => prev.filter(contact => contact.id !== selectedContact));
      
      // Reset selection and close modal
      setSelectedContact('');
      setShowBlockModal(false);
      
      alert('Contato bloqueado com sucesso.');
    }
  };

  // Filter contacts for search
  const filteredContacts = allContacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render block modal
  const renderBlockModal = () => {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md max-w-md w-full">
          <h3 className="text-xl font-medium mb-4 text-gray-900 dark:text-white">
            Bloquear um Contato
          </h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Pesquisar Contatos
            </label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nome ou email"
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Selecione um Contato
            </label>
            <div className="max-h-60 overflow-y-auto border rounded dark:border-gray-600">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <div 
                    key={contact.id}
                    onClick={() => setSelectedContact(contact.id)}
                    className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedContact === contact.id ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-600">
                      {contact.avatar ? (
                        <img src={contact.avatar} alt={contact.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                          {contact.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{contact.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-3 text-center text-gray-500 dark:text-gray-400">
                  Nenhum contato encontrado
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-between">
            <button 
              onClick={() => setShowBlockModal(false)}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button 
              onClick={handleBlock}
              disabled={!selectedContact}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              Bloquear Contato
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Contatos Bloqueados</h2>
        <button
          onClick={() => setShowBlockModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Bloquear Novo Contato
        </button>
      </div>
      
      <p className="mb-4 text-gray-600 dark:text-gray-400">
        Contatos bloqueados não podem enviar mensagens para você e não podem ver seu status online.
      </p>
      
      {blockedContacts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md text-center">
          <div className="flex justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
          <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Nenhum contato bloqueado</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Você não bloqueou nenhum contato ainda. Quando bloquear um contato, ele aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {blockedContacts.map(contact => (
            <div 
              key={contact.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden flex"
            >
              <div className="w-16 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                {contact.avatar ? (
                  <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300 font-medium text-lg">
                    {contact.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{contact.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</p>
                  </div>
                  <button
                    onClick={() => handleUnblock(contact.id)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Desbloquear
                  </button>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Bloqueado em: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showBlockModal && renderBlockModal()}
    </div>
  );
};

export default BlockedContacts;