// src/screens/DashboardScreen.jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Dashboard/Header';
import TabNavigation from '../components/Dashboard/TabNavigation';

// Import existing app content
import ContactList from '../components/ContactList';
import ChatWindow from '../components/ChatWindow';
import MessageInput from '../components/MessageInput';
import SearchBar from '../components/SearchBar';
import Database from '../utils/database';

// Import new feature components
import SearchScreen from '../components/SmartSearch/SearchScreen';
import MarketplaceScreen from '../components/Marketplace/MarketplaceScreen';
import MatchScreen from '../components/AIMatchmaking/MatchScreen';
import ProfileScreen from '../components/Profile/ProfileScreen';
import PaymentScreen from '../components/Payments/PaymentScreen';
import ContactsScreen from '../components/Contacts/ContactsScreen';

const DashboardScreen = () => {
  const { darkMode } = useTheme();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  // Load contacts from database on component mount
  const [showArchived, setShowArchived] = useState(false);
  
  // Load contacts from database on component mount
  useEffect(() => {
    loadContacts();
  }, [showArchived]);
  
  const loadContacts = () => {
    try {
      // Get all conversations (with or without archived based on state)
      const allConversations = Database.getAllConversations(showArchived);
      
      // Safety check: ensure allConversations is an array
      const conversations = Array.isArray(allConversations) ? allConversations : [];
      
      // Extract contacts from conversations
      const contactsFromConversations = conversations
        .filter(conv => conv && (showArchived ? conv.isArchived : !conv.isArchived)) // Filter by archive status
        .map(conv => {
          if (!conv || !Array.isArray(conv.participants)) {
            return null; // Skip this conversation if it has no participants
          }
          
          // Find the contact in the participants (exclude current user)
          const currentUser = Database.getCurrentUser() || { id: 'current_user' };
          const participant = conv.participants.find(p => p && p.id !== 'current_user' && p.id !== currentUser.id);
          
          if (participant) {
            return {
              ...participant,
              conversationId: conv.id,
              lastMessage: conv.lastMessage ? conv.lastMessage.content : '',
              time: conv.lastMessage ? conv.lastMessage.time : '',
              unreadCount: conv.unreadCount || 0,
              isArchived: conv.isArchived || false
            };
          }
          return null;
        })
        .filter(Boolean); // Remove nulls
      
      setContacts(contactsFromConversations);
      setFilteredContacts(contactsFromConversations);
    } catch (error) {
      console.error('Error loading contacts:', error);
      // Set empty arrays as a fallback
      setContacts([]);
      setFilteredContacts([]);
    }
  };
  
  // Load messages when a contact is selected
  useEffect(() => {
    if (selectedContact) {
      const loadMessages = async () => {
        try {
          // Find conversation for this contact - include archived in search
          const conversations = await Database.getAllConversations(true);
          const conversation = conversations.find(conv => {
            return conv.participants.some(p => p.id === selectedContact.id);
          });
          
          if (conversation) {
            // Reset unread counter when loading messages
            if (conversation.unreadCount > 0) {
              await Database.updateConversation(conversation.id, {
                unreadCount: 0
              });
            }
            
            setMessages(conversation.messages || []);
          } else {
            setMessages([]);
          }
        } catch (error) {
          console.error("Error loading messages:", error);
          setMessages([]);
        }
      };
      
      // Call the async function
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [selectedContact]);
  // This is the original handler, now delegating to the one with reset functionality
  const handleSelectContact = async (contact) => {
    await handleSelectContactWithReset(contact);
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) {
      setFilteredContacts(contacts);
      return;
    }
    
    const filtered = contacts.filter(
      contact => contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);
  };

  const handleSendMessage = async (content) => {
    if (!selectedContact) return;
    
    const timestamp = new Date();
    const newMessage = {
      id: `msg_${Date.now()}`,
      content,
      sender: 'user',
      time: timestamp.toLocaleTimeString().slice(0, 5),
      timestamp: timestamp.toISOString(),
    };

    // Add message to UI immediately
    setMessages([...messages, newMessage]);
    
    // Save message to database
    // Find or create conversation for this contact
    const conversations = await Database.getAllConversations();
    let conversation = conversations.find(conv => {
      return conv.participants.some(p => p.id === selectedContact.id);
    });
    
    if (conversation) {
      // Add message to existing conversation
      Database.addMessage(conversation.id, newMessage);
    } else {
      // Create new conversation
      const newConvId = `conv_${Date.now()}`;
      const newConversation = {
        id: newConvId,
        participants: [Database.getCurrentUser(), selectedContact],
        messages: [newMessage],
        createdAt: timestamp.toISOString(),
        updatedAt: timestamp.toISOString(),
      };
      Database.addConversation(newConversation);
    }
    
    // Update contact's last message
    // Extract the content string if the message content is an object
    const messageContent = typeof content === 'object' && content !== null
      ? content.content  // Get the actual content string from the object
      : content;         // Use as is if it's already a string

    // Update contact with the string content
    const updatedContact = { 
      ...selectedContact, 
      lastMessage: messageContent, 
      time: timestamp.toLocaleTimeString().slice(0, 5) 
    };
    Database.updateContact(updatedContact);
    
    // Update contacts list to show the last message
    setContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    setFilteredContacts(prev => prev.map(c => c.id === updatedContact.id ? updatedContact : c));
    
    // Simulate received message
    setTimeout(() => {
      const receivedMessage = {
        id: `msg_${Date.now()}`,
        content: 'Obrigado pela mensagem! Retorno em breve.',
        sender: 'contact',
        time: new Date().toLocaleTimeString().slice(0, 5),
        timestamp: new Date().toISOString(),
      };
      
      // Add to UI
      setMessages(prev => [...prev, receivedMessage]);
      
      // Save to database
      const currentConversations = Database.getAllConversations();
      const currentConversation = currentConversations.find(conv => {
        return conv.participants.some(p => p.id === selectedContact.id);
      });
      
      if (currentConversation) {
        // Add the received message to the conversation
        Database.addMessage(currentConversation.id, {
          ...receivedMessage,
          sender: selectedContact.id // Set correct sender ID for the contact
        });
        
        // Update the contact's last message
        // Make sure the message content is always stored as a string
        const responseContent = typeof receivedMessage.content === 'object' && receivedMessage.content !== null
          ? receivedMessage.content.content  // Extract content from object
          : receivedMessage.content;         // Use as is if already a string

        const updatedContactWithResponse = { 
          ...selectedContact, 
          lastMessage: responseContent, 
          time: receivedMessage.time,
          unreadCount: 0 // Reset unread count since conversation is open
        };
        
        // Update contacts list
        setContacts(prev => prev.map(c => c.id === updatedContactWithResponse.id ? updatedContactWithResponse : c));
        setFilteredContacts(prev => prev.map(c => c.id === updatedContactWithResponse.id ? updatedContactWithResponse : c));
      }
    }, 2000);
  };
  
  // Reset unread counter when selecting a contact
  const handleSelectContactWithReset = async (contact) => {
    if (contact) {
      try {
        // Find the conversation for this contact
        const conversations = await Database.getAllConversations(true);
        const conversation = conversations.find(conv => {
          return conv.participants.some(p => p.id === contact.id);
        });
        
        if (conversation && conversation.unreadCount > 0) {
          // Reset unread counter in database
          await Database.updateConversation(conversation.id, {
            unreadCount: 0
          });
        }
        // Update the contact in the local state
        const updatedContact = {...contact, unreadCount: 0};
        setContacts(prev => prev.map(c => c.id === contact.id ? updatedContact : c));
        setFilteredContacts(prev => prev.map(c => c.id === contact.id ? updatedContact : c));
        
        // Set the selected contact
        setSelectedContact(updatedContact);
      } catch (err) {
        console.error('Erro ao resetar contador de não-lidos:', err);
        // você pode escolher ainda assim selecionar o contato
        setSelectedContact(contact);   
      }
    } else {
      setSelectedContact(null);
    }
  };
  
  // Function to handle adding a new contact
  const handleAddNewContact = () => {
    // For now, this is a simple implementation that shows the new conversation modal
    setShowNewConversationModal(true);
    
    // In a complete implementation, this would open a form to add contact details
    console.log('Adding new contact');
    
    // You could also navigate to the contacts screen:
    // navigate('/dashboard/contacts');
  };
  
  // ChatTab component - displays the main chat interface
  const ChatTab = () => {
    const [isLoadingContacts, setIsLoadingContacts] = useState(true);
    const [contactsError, setContactsError] = useState(null);
    
    return (
      <div className="flex h-full">
        {/* Left sidebar with contacts */}
        <div className={`w-80 flex-shrink-0 h-full border-r ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
          {/* Archive toggle button */}
          <div className="p-4">
            <button 
              onClick={() => setShowArchived(!showArchived)}
              className={`flex items-center text-sm font-medium py-2 px-3 rounded transition-colors ${
                showArchived 
                  ? 'bg-amber-500/10 text-amber-500' 
                  : darkMode 
                    ? 'bg-[#1F1F1F] text-gray-300 hover:bg-[#333]' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
              </svg>
              {showArchived ? 'Mostrar Ativas' : 'Mostrar Arquivadas'}
            </button>
            
            {/* Search Bar */}
            <SearchBar onSearch={handleSearch} darkMode={darkMode} />
          </div>
          
          {/* Conversations Section */}
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 pt-4 pb-2">
              <div className="flex items-center justify-between">
                <h2 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {showArchived ? 'Conversas Arquivadas' : 'Conversas'} ({filteredContacts.length})
                </h2>
                <button className={`text-xs ${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'} hover:underline`}>Ver todos</button>
              </div>
            </div>
            
            {/* Contact List */}
            <ContactList
              contacts={filteredContacts}
              selectedContact={selectedContact}
              onSelectContact={handleSelectContact}
              darkMode={darkMode}
              showNewConversationModal={showNewConversationModal}
              setShowNewConversationModal={setShowNewConversationModal}
              onAddNewContact={handleAddNewContact}
            />
          </div>
        </div>
        
        {/* Main chat area - takes remaining space */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ChatWindow
            messages={messages}
            selectedContact={selectedContact}
            darkMode={darkMode}
          />
          <MessageInput
            onSendMessage={handleSendMessage}
            selectedContact={selectedContact}
            darkMode={darkMode}
          />
        </div>
      </div>
    );
  };

  return (
    <div className={`flex flex-col h-screen ${darkMode ? 'bg-[#1A1A1A] text-white' : 'bg-[#F7F7FF] text-[#121212]'}`}>
      {/* Header with logo, notifications and avatar */}
      <Header />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Side tab navigation - fixed width */}
        <div className="flex-shrink-0 w-20">
          <TabNavigation />
        </div>
        
        {/* Main content area - takes remaining space */}
        <div className="flex-1 overflow-hidden">
          <Routes>
            <Route path="chat" element={<ChatTab />} />
            <Route path="search" element={<SearchScreen />} />
            <Route path="marketplace" element={<MarketplaceScreen />} />
            <Route path="match" element={<MatchScreen />} />
            <Route path="profile" element={<ProfileScreen />} />
            <Route path="settings" element={<PaymentScreen />} />
            <Route path="contacts" element={<ContactsScreen />} />
            <Route path="*" element={<Navigate to="chat" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default DashboardScreen;
