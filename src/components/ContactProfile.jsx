import React, { useEffect, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const ContactProfile = ({ contact, isOpen, onClose }) => {
  const { darkMode } = useTheme();
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !contact) return null;

  // Mock shared media data
  const sharedMedia = [
    { type: 'image', url: '/assets/images/shared1.jpg', date: '2023-11-15' },
    { type: 'document', name: 'Proposal.pdf', size: '2.3MB', date: '2023-11-10' },
    { type: 'link', url: 'https://example.com', title: 'Example Website', date: '2023-11-05' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        ref={modalRef}
        className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-lg shadow-xl
          ${darkMode ? 'bg-[#1A1A1A] text-white' : 'bg-white text-gray-900'}`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className="text-lg font-semibold">Perfil do Contato</h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Profile information */}
        <div className="p-6">
          {/* Avatar and basic info */}
          <div className="flex flex-col items-center mb-6">
            <div className={`w-24 h-24 rounded-full mb-4
              ${darkMode ? 'bg-gradient-to-br from-[#2B4FFF] to-[#BA5AFF]' : 'bg-gradient-to-br from-[#2B4FFF] to-[#BA5AFF]'} 
              text-white flex items-center justify-center text-3xl font-bold shadow-md`}>
              {contact.name.charAt(0) + (contact.name.split(' ')[1] ? contact.name.split(' ')[1].charAt(0) : '')}
            </div>
            <h2 className="text-xl font-semibold">{contact.name}</h2>
            
            <div className="flex items-center mt-1">
              <span className={`inline-block w-2 h-2 rounded-full mr-2 ${contact.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {contact.online ? 'Online' : 'Offline'}
              </span>
            </div>

            {contact.company && (
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {contact.position} at {contact.company}
              </p>
            )}
          </div>

          {/* Contact Info Section */}
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
            <h3 className={`text-md font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Informações de Contato
            </h3>
            
            <div className="space-y-3">
              {contact.phone && (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="text-sm">{contact.phone}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Celular</p>
                  </div>
                </div>
              )}
              
              {contact.email && (
                <div className="flex items-start">
                  <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-3 mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-sm">{contact.email}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Media, Links, and Docs */}
          <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
            <h3 className={`text-md font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Mídia, Links e Documentos
            </h3>
            
            <div className="space-y-3">
              {sharedMedia.map((item, index) => (
                <div key={index} className="flex items-center">
                  {item.type === 'image' && (
                    <div className={`w-12 h-12 rounded-md overflow-hidden mr-3 ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div className="w-full h-full bg-blue-300"></div>
                    </div>
                  )}
                  
                  {item.type === 'document' && (
                    <div className="flex items-center justify-center w-12 h-12 rounded-md bg-red-100 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  
                  {item.type === 'link' && (
                    <div className="flex items-center justify-center w-12 h-12 rounded-md bg-green-100 mr-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.172 13.828a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.102-1.101" />
                      </svg>
                    </div>
                  )}
                  
                  <div>
                    <p className="text-sm font-medium">
                      {item.type === 'image' ? 'Imagem' : item.type === 'document' ? item.name : item.title}
                    </p>
                    <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {item.date} {item.size ? ` • ${item.size}` : ''}
                    </p>
                  </div>
                </div>
              ))}
              
              <button className={`text-sm w-full text-center mt-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Ver tudo
              </button>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button className={`py-2 px-4 rounded-md flex items-center justify-center ${
              darkMode ? 'bg-[#2B4FFF]/20 text-[#5C78FF] hover:bg-[#2B4FFF]/30' : 'bg-[#2B4FFF]/10 text-[#2B4FFF] hover:bg-[#2B4FFF]/20'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15l-2.172-2.172a1 1 0 010-1.414L5.586 9" />
              </svg>
              <span>Silenciar</span>
            </button>
            
            <button className={`py-2 px-4 rounded-md flex items-center justify-center ${
              darkMode ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
              <span>Bloquear</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactProfile;