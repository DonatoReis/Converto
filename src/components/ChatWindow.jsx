// src/components/ChatWindow.jsx
import React, { useEffect, useRef, useState } from 'react';
import Logo from './Logo';
import { useAuth } from '../context/AuthContext';
import firestoreService from '../firebase/firestoreService';

// Error boundary component for chat window
class ChatErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ChatWindow error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 flex items-center justify-center p-4 text-center">
          <div>
            <h3 className="text-xl font-medium text-red-500 mb-2">Algo deu errado</h3>
            <p className="text-gray-600 mb-4">Não foi possível carregar a conversa</p>
            <button 
              onClick={() => this.setState({ hasError: false })}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Tentar novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const ChatWindow = ({ messages: initialMessages, selectedContact, darkMode = false }) => {
  const { currentUser } = useAuth();
  const messagesEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat', 'shared', or 'profile'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState(initialMessages || []);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Subscribe to messages when selectedContact changes
  useEffect(() => {
    let unsubscribe = null;
    
    const fetchMessages = async () => {
      if (!selectedContact || !selectedContact.conversationId) {
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Set up real-time listener for messages
        unsubscribe = firestoreService.subscribeToMessages(
          selectedContact.conversationId,
          (fetchedMessages) => {
            if (fetchedMessages) {
              setMessages(fetchedMessages);
              setLoading(false);
              // Scroll to bottom when messages are loaded
              setTimeout(scrollToBottom, 100);
            } else {
              // Handle case when messages are null or undefined
              setMessages([]);
              setLoading(false);
            }
          },
          50 // Limit parameter - standard value for message retrieval
        );
      } catch (err) {
        console.error('Error setting up messages listener:', err);
        setError(err);
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Cleanup function to unsubscribe from Firestore listener
    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [selectedContact, scrollToBottom]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Render loading state
  if (loading && messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-[#121212]' : 'bg-[#FFFFFF]'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#2B4FFF] mb-4"></div>
          <p className={`${darkMode ? 'text-gray-400' : 'text-[#121212]/60'}`}>
            Carregando mensagens...
          </p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-[#121212]' : 'bg-[#FFFFFF]'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="text-red-500 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className={`text-xl font-medium mb-2 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            Erro ao carregar mensagens
          </h3>
          <p className={`${darkMode ? 'text-gray-400' : 'text-[#121212]/60'} mb-4`}>
            {error.message || 'Ocorreu um erro ao carregar a conversa.'}
          </p>
          <button
            onClick={() => setError(null)}
            className="px-4 py-2 bg-[#2B4FFF] text-white rounded-lg hover:bg-[#3D5AFF]"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  // Render welcome screen if no contact is selected
  if (!selectedContact) {
    return (
      <div className={`flex-1 flex items-center justify-center ${darkMode ? 'bg-[#121212]' : 'bg-[#FFFFFF]'}`}>
        <div className="flex flex-col items-center text-center">
          <div className="mb-4">
            <Logo darkMode={darkMode} />
          </div>
          <h2 className={`text-xl font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            Bem-vindo ao Mercatrix
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-[#121212]/60'}`}>
            Selecione um contato para começar a conversar
          </p>
        </div>
      </div>
    );
  }
  

  return (
    <div className={`flex-1 flex flex-col h-full overflow-hidden ${darkMode ? 'bg-[#121212]' : 'bg-[#FFFFFF]'}`}>
      <div className={`p-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F7FF]'} flex items-center justify-between border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full ${darkMode ? 'bg-[#2B4FFF]' : 'bg-[#2B4FFF]'} text-white flex items-center justify-center mr-3 font-medium`}>
            {selectedContact.name.charAt(0)}
          </div>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{selectedContact.name}</h2>
            <div className="flex space-x-3 mt-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`text-xs font-medium transition-colors ${
                  activeTab === 'chat' 
                    ? darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]' 
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('shared')}
                className={`text-xs font-medium transition-colors ${
                  activeTab === 'shared' 
                    ? darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]' 
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Compartilhado
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`text-xs font-medium transition-colors ${
                  activeTab === 'profile' 
                    ? darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]' 
                    : darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Perfil
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Content based on active tab */}
      {activeTab === 'chat' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length > 0 ? messages.map((message) => {
            const isAudio = message.type === 'audio';
            const isUserMessage = message.senderId === currentUser?.id;
            
            // Handle the case where message content is an object with type and content fields
            let displayContent;
            if (typeof message.content === 'object' && message.content !== null) {
              // If message.content is an object, extract the actual content string
              displayContent = message.content.content || 'No content available';
            } else {
              // If message.content is a string, use it directly
              displayContent = message.content;
            }
            
            return (
              <div
                key={message.id}
                className={`flex ${isUserMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    isUserMessage
                      ? 'bg-[#2B4FFF] text-white'
                      : darkMode 
                        ? 'bg-[#1F1F1F] text-gray-200' 
                        : 'bg-[#F7F7FF] text-[#121212]'
                  }`}
                >
                  {isAudio ? (
                    <AudioMessage 
                      audioSrc={message.content} 
                      duration={message.duration}
                      darkMode={darkMode}
                      isUserMessage={isUserMessage}
                    />
                  ) : (
                    <p>{displayContent}</p>
                  )}
                  <span className="text-xs opacity-70 mt-1 block text-right">{message.time}</span>
                </div>
              </div>
            );
          }) : (
            <div className="flex justify-center items-center h-64">
              <p className={`text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Nenhuma mensagem nesta conversa. Comece a conversar agora!
              </p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      )}
      
      {/* Shared Content Tab */}
      {activeTab === 'shared' && (
        <SharedContent darkMode={darkMode} selectedContact={selectedContact} />
      )}
      
      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <ContactProfileView darkMode={darkMode} contact={selectedContact} />
      )}
    </div>
  );
};

// Audio Message Component
const AudioMessage = ({ audioSrc, duration, darkMode, isUserMessage }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const handleEnded = () => setIsPlaying(false);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('pause', handleEnded);
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('pause', handleEnded);
      };
    }
  }, []);
  
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  
  const formatTime = (timeInSeconds) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const progress = audioRef.current && audioRef.current.duration 
    ? (currentTime / audioRef.current.duration) * 100 
    : 0;
  
  return (
    <div className={`flex items-center space-x-2 ${isUserMessage ? 'text-white' : ''}`}>
      <audio ref={audioRef} src={audioSrc} preload="metadata" className="hidden" />
      
      <button 
        onClick={togglePlay}
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
          ${isUserMessage 
            ? 'bg-white/20 text-white hover:bg-white/30' 
            : darkMode
              ? 'bg-[#333333] text-white hover:bg-[#444444]'
              : 'bg-[#E5E7EB] text-[#121212] hover:bg-[#D1D5DB]'
          }`}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 00-1 1v2a1 1 0 001 1h6a1 1 0 001-1V9a1 1 0 00-1-1H7z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
        )}
      </button>
      
      <div className="flex-1 min-w-0">
        <div className="relative w-full h-1.5 rounded-full overflow-hidden bg-white/20">
          <div 
            className="absolute top-0 left-0 h-full bg-white/70"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || 0)}</span>
        </div>
      </div>
    </div>
  );
};
// Shared Content Component
const SharedContent = ({ darkMode, selectedContact }) => {
  // Mock shared media data
  const sharedFiles = [
    {
      id: 1,
      name: 'Proposta de Projeto.pdf',
      type: 'pdf',
      size: '2.4 MB',
      date: '12/04/2025'
    },
    {
      id: 2,
      name: 'Calendário de Reuniões.xlsx',
      type: 'excel',
      size: '1.1 MB',
      date: '10/04/2025'
    },
    {
      id: 3,
      name: 'Logo_empresa.png',
      type: 'image',
      size: '0.8 MB',
      date: '05/04/2025'
    }
  ];

  const sharedLinks = [
    {
      id: 1,
      title: 'Dashboard de Análise',
      url: 'https://analytics.example.com/dashboard',
      date: '11/04/2025'
    },
    {
      id: 2,
      title: 'Artigo sobre Inteligência Artificial',
      url: 'https://tecnologia.example.com/ia-negocios',
      date: '08/04/2025'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
          Arquivos e links compartilhados
        </h3>
        <p className={`mb-6 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Todos os arquivos e links compartilhados entre você e {selectedContact.name}
        </p>
        
        {/* Shared Files Section */}
        <div className="mb-8">
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Arquivos ({sharedFiles.length})
          </h4>
          <div className={`rounded-lg overflow-hidden border ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
            {sharedFiles.map((file, index) => (
              <div 
                key={file.id} 
                className={`flex items-center p-4 ${
                  index !== sharedFiles.length - 1 ? (darkMode ? 'border-b border-[#333]' : 'border-b border-gray-200') : ''
                } ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  file.type === 'pdf' ? 'bg-red-100 text-red-600' :
                  file.type === 'excel' ? 'bg-green-100 text-green-600' :
                  file.type === 'image' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                }`}>
                  {file.type === 'pdf' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  {file.type === 'excel' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  {file.type === 'image' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{file.name}</p>
                  <div className="flex items-center">
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{file.size}</span>
                    <span className={`mx-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{file.date}</span>
                  </div>
                </div>
                
                <button 
                  className={`ml-2 p-2 rounded-full ${
                    darkMode 
                      ? 'hover:bg-[#333] text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                  title="Download"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
        
        {/* Shared Links Section */}
        <div>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Links ({sharedLinks.length})
          </h4>
          <div className={`rounded-lg overflow-hidden border ${darkMode ? 'border-[#333]' : 'border-gray-200'}`}>
            {sharedLinks.map((link, index) => (
              <div 
                key={link.id} 
                className={`flex items-center p-4 ${
                  index !== sharedLinks.length - 1 ? (darkMode ? 'border-b border-[#333]' : 'border-b border-gray-200') : ''
                } ${darkMode ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-50'} transition-colors cursor-pointer`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-purple-100 text-purple-600`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                
                <div className="ml-4 flex-1 min-w-0">
                  <p className={`font-medium truncate ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{link.title}</p>
                  <div className="flex items-center">
                    <span className={`text-xs text-blue-500 truncate`}>{link.url}</span>
                    <span className={`mx-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>•</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{link.date}</span>
                  </div>
                </div>
                
                <button 
                  className={`ml-2 p-2 rounded-full ${
                    darkMode 
                      ? 'hover:bg-[#333] text-gray-400 hover:text-white' 
                      : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
                  }`}
                  title="Abrir"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Contact Profile View Component
const ContactProfileView = ({ darkMode, contact }) => {
  // Mock data for business category and services
  const businessInfo = {
    category: 'Tecnologia',
    services: ['Desenvolvimento de Software', 'Consultoria de TI', 'Cloud Computing'],
    status: 'online',
    createdAt: '10/01/2025',
    notes: 'Cliente interessado em expandir sua presença digital. Prefere comunicação por e-mail durante horário comercial.',
    company: contact.company || 'TechSolutions Inc',
    position: 'CEO & Fundador',
    email: contact.email || 'contato@techsolutions.com',
    phone: contact.phone || '(11) 99999-9999',
    website: 'www.techsolutions.com',
    address: 'Av. Paulista, 1000 - São Paulo, SP'
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      {/* Contact Info */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <div className={`w-20 h-20 rounded-full ${darkMode ? 'bg-[#2B4FFF]' : 'bg-[#2B4FFF]'} text-white flex items-center justify-center mr-4 font-bold text-2xl`}>
            {contact.name.charAt(0)}
          </div>
          <div>
            <h3 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{contact.name}</h3>
            <div className="flex items-center">
              <span className={`inline-flex items-center ${
                businessInfo.status === 'online' 
                  ? 'text-green-500' 
                  : darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span className={`w-2 h-2 rounded-full mr-1.5 ${businessInfo.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                {businessInfo.status === 'online' ? 'Online' : 'Offline'}
              </span>
              <span className={`mx-2 text-xs ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>•</span>
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Contato desde {businessInfo.createdAt}</span>
            </div>
          </div>
        </div>
        
        {/* Business Information */}
        <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F7FF]'}`}>
          <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Informações Comerciais
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Empresa</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{businessInfo.company}</p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Cargo</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{businessInfo.position}</p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Categoria</p>
              <p className={`font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{businessInfo.category}</p>
            </div>
            <div>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Website</p>
              <a 
                href={`https://${businessInfo.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className={`font-medium text-blue-500 hover:underline`}
              >
                {businessInfo.website}
              </a>
            </div>
          </div>
          
          {/* Services */}
          <div className="mt-4">
            <p className={`text-xs mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Serviços</p>
            <div className="flex flex-wrap gap-2">
              {businessInfo.services.map((service, index) => (
                <span 
                  key={index}
                  className={`px-2.5 py-1 rounded-full text-xs ${
                    darkMode 
                      ? 'bg-[#333] text-gray-300' 
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {service}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Contact Options */}
      <div className="mb-8">
        <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Opções de Contato
        </h4>
        
        <div className={`grid grid-cols-1 gap-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          <a 
            href={`mailto:${businessInfo.email}`}
            className={`flex items-center p-3 rounded-lg ${
              darkMode 
                ? 'bg-[#1A1A1A] hover:bg-[#333]' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="flex-1">{businessInfo.email}</span>
          </a>
          
          <a 
            href={`tel:${businessInfo.phone}`}
            className={`flex items-center p-3 rounded-lg ${
              darkMode 
                ? 'bg-[#1A1A1A] hover:bg-[#333]' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span className="flex-1">{businessInfo.phone}</span>
          </a>
          
          {/* Address Contact Option */}
          <div 
            className={`flex items-center p-3 rounded-lg ${
              darkMode 
                ? 'bg-[#1A1A1A] hover:bg-[#333]' 
                : 'bg-white hover:bg-gray-50 border border-gray-200'
            } transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="flex-1">{businessInfo.address}</span>
          </div>
        </div>
      </div>
      
      {/* Notes Section */}
      <div className="mb-8">
        <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Observações
        </h4>
        
        <div className={`p-4 rounded-lg ${
          darkMode 
            ? 'bg-[#1A1A1A]' 
            : 'bg-white border border-gray-200'
        }`}>
          <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {businessInfo.notes || 'Nenhuma observação sobre este contato.'}
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-[#2B4FFF] hover:bg-[#3D5AFF] text-white' 
              : 'bg-[#2B4FFF] hover:bg-[#3D5AFF] text-white'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          Editar Perfil
        </button>
        
        <button
          className={`flex items-center justify-center p-3 rounded-lg transition-colors ${
            darkMode 
              ? 'bg-[#1A1A1A] hover:bg-[#333] text-white' 
              : 'bg-white hover:bg-gray-50 border border-gray-200 text-gray-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          Bloquear Contato
        </button>
        
        <button
          className={`flex items-center justify-center p-3 rounded-lg transition-colors col-span-2 ${
            darkMode 
              ? 'bg-red-900/20 hover:bg-red-900/30 text-red-400' 
              : 'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Excluir Contato
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
