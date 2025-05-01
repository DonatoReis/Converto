// src/components/ContactList.jsx
import React, { useState, useEffect } from 'react';
import NewConversationModal from './NewConversationModal';
import ConversationContextMenu from './ConversationContextMenu';
import ContactProfile from './ContactProfile';
import Database from '../utils/database';

const ContactList = ({ 
  contacts, 
  selectedContact, 
  onSelectContact, 
  onAddNewContact, 
  darkMode = false 
}) => {
  // Modal and UI state
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const [showContactProfile, setShowContactProfile] = useState(false);
  const [selectedProfileContact, setSelectedProfileContact] = useState(null);
  
  // Context menu state
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    contactId: null
  });
  
  // Notification states
  const [notification, setNotification] = useState({
    show: false,
    message: '',
    type: 'success' // success, warning, error
  });

  // Effect to hide notification after a delay
  useEffect(() => {
    if (notification.show) {
      const timer = setTimeout(() => {
        setNotification(prev => ({ ...prev, show: false }));
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [notification.show]);

  // Show notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({
      show: true,
      message,
      type
    });
  };

  // Get selected contact for context menu
  const getContactForContextMenu = () => {
    return contacts.find(contact => contact.id === contextMenu.contactId);
  };

  // Handle context menu show
  const handleContextMenu = (e, contactId) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      contactId
    });
  };

  // Handle selecting an existing contact
  const handleSelectExistingContact = (contact) => {
    onSelectContact(contact);
    onClose();
  };
  
  // Handle pinning a conversation
  const handlePin = () => {
    const contactToPin = getContactForContextMenu();
    if (contactToPin) {
      const conversations = Database.getAllConversations();
      const conversation = conversations.find(conv => {
        return conv.participants.some(p => {
          if (typeof p === 'object' && p !== null) {
            return p.id === contactToPin.id;
          } else {
            return p === contactToPin.id;
          }
        });
      });

      if (conversation) {
        // Toggle pinned status
        const newPinnedStatus = !conversation.isPinned;
        
        // Update conversation in database
        Database.updateConversation(conversation.id, {
          isPinned: newPinnedStatus
        });

        // Update the UI via notification
        showNotification(
          newPinnedStatus 
            ? `Conversa com ${contactToPin.name} foi fixada` 
            : `Conversa com ${contactToPin.name} foi desafixada`
        );
        
        // Force re-render - in a real app, this would be handled via state management
        // Here we'll do a manual refresh of the contacts without full page reload
        setTimeout(() => {
          onSelectContact(selectedContact);
        }, 100);
      }
    }
    
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleArchive = () => {
    const contactToArchive = getContactForContextMenu();
    if (contactToArchive) {
      // Find conversation for this contact
      const conversations = Database.getAllConversations();
      const conversation = conversations.find(conv => {
        return conv.participants.some(p => {
          if (typeof p === 'object' && p !== null) {
            return p.id === contactToArchive.id;
          } else {
            return p === contactToArchive.id;
          }
        });
      });

      if (conversation) {
        // Update conversation to set it as archived
        Database.updateConversation(conversation.id, {
          isArchived: true
        });

        // If the archived conversation is currently selected, deselect it
        if (selectedContact?.id === contactToArchive.id) {
          onSelectContact(null);
        }

        // Show notification
        showNotification(`Conversa com ${contactToArchive.name} foi arquivada.`);
        
        // Force re-render contacts list without page reload
        // In a real app with proper state management, 
        // this would automatically update through state changes
        setTimeout(() => {
          onSelectContact(selectedContact);
        }, 100);
      }
    }
    
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleDelete = () => {
    const contactToDelete = getContactForContextMenu();
    if (contactToDelete && window.confirm(`Deseja realmente excluir o contato ${contactToDelete.name}?`)) {
      // Delete from database
      Database.deleteContact(contactToDelete.id);
      
      // Force re-render by updating the parent component
      if (selectedContact?.id === contactToDelete.id) {
        onSelectContact(null); // Deselect the contact if it was selected
      }
      
      // Close the context menu
      setContextMenu({ ...contextMenu, isOpen: false });
      
      // Show notification
      showNotification(`Contato ${contactToDelete.name} excluído com sucesso.`, 'warning');
      
      // Force re-render contacts list without page reload
      setTimeout(() => {
        onSelectContact(selectedContact);
      }, 100);
    } else {
      setContextMenu({ ...contextMenu, isOpen: false });
    }
  };

  const handleMute = () => {
    const contactToMute = getContactForContextMenu();
    if (contactToMute) {
      // Find conversation for this contact
      const conversations = Database.getAllConversations();
      const conversation = conversations.find(conv => {
        return conv.participants.some(p => p.id === contactToMute.id);
      });
      
      if (conversation) {
        // Toggle muted status
        const newMuteStatus = !conversation.isMuted;
        
        // Update conversation
        Database.updateConversation(conversation.id, {
          isMuted: newMuteStatus
        });
        
        // Show notification
        showNotification(
          newMuteStatus 
            ? `Notificações silenciadas para ${contactToMute.name}` 
            : `Notificações ativadas para ${contactToMute.name}`
        );
        
        // Force re-render without page reload
        setTimeout(() => {
          onSelectContact(selectedContact);
        }, 100);
      }
    }
    
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleBlock = () => {
    const contactToBlock = getContactForContextMenu();
    if (contactToBlock) {
      // Toggle blocked status
      const newBlockStatus = !contactToBlock.isBlocked;
      
      // Update in database
      Database.updateContact(contactToBlock.id, {
        isBlocked: newBlockStatus
      });
      
      // Show notification
      showNotification(
        newBlockStatus 
          ? `${contactToBlock.name} foi bloqueado` 
          : `${contactToBlock.name} foi desbloqueado`,
        newBlockStatus ? 'warning' : 'success'
      );
      
      // Force re-render without page reload
      setTimeout(() => {
        onSelectContact(selectedContact);
      }, 100);
    }
    
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleReport = () => {
    const contactToReport = getContactForContextMenu();
    if (contactToReport) {
      // Show a confirmation dialog
      if (window.confirm(`Deseja realmente reportar ${contactToReport.name}?`)) {
        // In a real app, this would send a report to the server
        // For now, just show a notification
        showNotification(`${contactToReport.name} foi reportado à nossa equipe.`, 'warning');
      }
    }
    
    setContextMenu({ ...contextMenu, isOpen: false });
  };

  const handleClearConversation = (contactId) => {
    const contactToClear = getContactForContextMenu();
    if (contactToClear && window.confirm(`Deseja realmente limpar o histórico de conversa com ${contactToClear.name}?`)) {
      // Find conversation for this contact
      const conversations = Database.getAllConversations();
      const conversation = conversations.find(conv => {
        return conv.participants.some(p => p.id === contactId);
      });
      
      if (conversation) {
        // Clear messages in the database
        Database.clearConversation(conversation.id);
        
        // Show notification
        showNotification(`Conversa com ${contactToClear.name} foi limpa.`);
        
        // If this conversation is currently selected, refresh the UI
        if (selectedContact?.id === contactToClear.id) {
          onSelectContact({ ...selectedContact, lastMessage: null });
        }
      } else {
        showNotification('Não foi possível encontrar a conversa para este contato.', 'error');
      }
    }
    
    setContextMenu({ ...contextMenu, isOpen: false });
  };
  
  const handleViewProfile = (contact, e) => {
    e.stopPropagation(); // Prevent triggering the parent onClick
    setSelectedProfileContact(contact);
    setShowContactProfile(true);
  };

  return (
    <div className={`h-full overflow-y-auto relative ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F7FF]'}`}>
      {/* Notification banner */}
      {notification.show && (
        <div 
          className={`absolute top-0 left-0 right-0 p-2 z-10 text-white text-center transition-opacity duration-300 ${
            notification.type === 'success' ? (darkMode ? 'bg-green-700' : 'bg-green-500') :
            notification.type === 'warning' ? (darkMode ? 'bg-amber-700' : 'bg-amber-500') :
            (darkMode ? 'bg-red-700' : 'bg-red-500')
          }`}
        >
          {notification.message}
        </div>
      )}

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewConversationModal}
        onClose={() => setShowNewConversationModal(false)}
        contacts={contacts}
        onSelectContact={onSelectContact}
        onAddNewContact={onAddNewContact}
      />

      {/* Contact Profile Modal */}
      <ContactProfile
        contact={selectedProfileContact}
        isOpen={showContactProfile}
        onClose={() => setShowContactProfile(false)}
      />

      {/* Context Menu */}
      {contextMenu.isOpen && (
        <ConversationContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
          onPin={handlePin}
          onArchive={handleArchive}
          onDelete={handleDelete}
          onMute={handleMute}
          onBlock={handleBlock}
          onReport={handleReport}
          onClearConversation={() => handleClearConversation(contextMenu.contactId)}
          isPinned={getContactForContextMenu()?.isPinned}
          isMuted={getContactForContextMenu()?.isMuted}
          isBlocked={getContactForContextMenu()?.isBlocked}
          contactName={getContactForContextMenu()?.name}
        />
      )}

      <div className="p-4 space-y-3">
        {/* New Conversation Button */}
        <button 
          onClick={() => setShowNewConversationModal(true)}
          className={`w-full py-2 px-4 rounded-lg flex items-center justify-center ${
            darkMode 
              ? 'bg-[#2B4FFF] hover:bg-[#3D2AFF] text-white' 
              : 'bg-[#2B4FFF] hover:bg-[#3D2AFF] text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Conversa
        </button>
      </div>

      <div className="overflow-y-auto pb-4">
        {contacts.length === 0 ? (
          <div className={`p-4 text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Nenhuma conversa disponível
          </div>
        ) : (
          contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              onContextMenu={(e) => handleContextMenu(e, contact.id)}
              className={`relative px-4 py-3 cursor-pointer transition-colors 
                ${selectedContact?.id === contact.id 
                  ? darkMode 
                    ? 'bg-[#2B4FFF]/20' 
                    : 'bg-[#2B4FFF]/10'
                  : ''}
                ${darkMode 
                  ? 'hover:bg-[#2B4FFF]/10 text-white' 
                  : 'hover:bg-[#2B4FFF]/5 text-[#121212]'}
                ${contact.isPinned ? 'border-l-4 border-[#2B4FFF]' : ''}
              `}
            >
              <div className="flex items-center">  
                {/* Avatar */}
                <div 
                  className="relative mr-3 cursor-pointer" 
                  onClick={(e) => handleViewProfile(contact, e)}
                  title="View profile"
                >
                  <div className={`w-12 h-12 rounded-full ${contact.online ? 'ring-2 ring-green-500' : ''} 
                    ${darkMode ? 'bg-gradient-to-br from-[#2B4FFF] to-[#BA5AFF]' : 'bg-gradient-to-br from-[#2B4FFF] to-[#BA5AFF]'} 
                    text-white flex items-center justify-center shadow-md hover:opacity-90 transition-opacity`}>
                    {contact.name.charAt(0) + (contact.name.split(' ')[1] ? contact.name.split(' ')[1].charAt(0) : '')}
                  </div>
                  {contact.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>
                
                {/* Contact Info */}
                <div className="flex-1 min-w-0">  
                  <div className="flex items-center justify-between">  
                    <h3 className={`font-semibold truncate ${contact.unread ? 'text-white' : ''}`}>{contact.name}</h3>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{contact.time || '12:30'}</span>
                  </div>
                  <div className="flex items-center justify-between">  
                    <p className={`text-sm truncate mr-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'} ${contact.unread ? 'font-medium' : ''}`}>
                      {typeof contact.lastMessage === 'object' && contact.lastMessage !== null
                        ? (contact.lastMessage.content || 'Nova mensagem')
                        : contact.lastMessage}
                    </p>
                    {contact.unread && (
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#BA5AFF] text-white text-xs flex items-center justify-center">
                        {contact.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ContactList;
