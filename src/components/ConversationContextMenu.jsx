// src/components/ConversationContextMenu.jsx
import React, { useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

const ConversationContextMenu = ({ 
  isOpen, 
  position, 
  onClose, 
  onPin, 
  onArchive, 
  onDelete, 
  onMute, 
  onBlock, 
  onReport, 
  onClearConversation,
  isPinned, 
  isMuted, 
  isBlocked,
  contactName
}) => {
  const { darkMode } = useTheme();
  const menuRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
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
  
  if (!isOpen) return null;
  
  // Adjust position to ensure menu stays within viewport
  const adjustedPosition = {
    top: Math.min(position.y, window.innerHeight - 320), // Assuming menu height is about 320px max
    left: Math.min(position.x, window.innerWidth - 220)  // Assuming menu width is about 220px max
  };
  
  return (
    <div 
      ref={menuRef}
      className={`absolute z-50 w-56 rounded-lg shadow-lg py-1 ${
        darkMode ? 'bg-[#121212] border border-gray-700 text-white' : 'bg-white border border-gray-200 text-[#121212]'
      }`}
      style={{ 
        top: `${adjustedPosition.top}px`, 
        left: `${adjustedPosition.left}px`
      }}
    >
      {/* Header with contact name */}
      <div className={`px-4 py-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <p className="font-medium truncate">{contactName}</p>
      </div>
      
      {/* Menu items */}
      <div className="py-1">
        <button
          onClick={onPin}
          className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 ${
            darkMode ? 'hover:bg-gray-700' : ''
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 mr-3 ${isPinned ? 'text-[#2B4FFF]' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={isPinned ? 2.5 : 1.5} 
              d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" 
            />
          </svg>
          {isPinned ? 'Desafixar conversa' : 'Fixar conversa'}
        </button>
        
        <button
          onClick={onMute}
          className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 ${
            darkMode ? 'hover:bg-gray-700' : ''
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 mr-3 ${isMuted ? 'text-[#2B4FFF]' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={isMuted ? 2.5 : 1.5} 
              d={isMuted 
                ? "M5.586 15.0l-2.172-2.172a1 1 0 010-1.414l2.172-2.172m5.656 0l4 4a1 1 0 010 1.414l-4 4M13.414 15.0l6.586-6.586a1 1 0 000-1.414l-6.586-6.586A1 1 0 0012 1.0v14a1 1 0 001.414 0z" 
                : "M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15.0l-2.172-2.172a1 1 0 010-1.414l2.172-2.172m12.8 0l2.172-2.172a1 1 0 011.414 0l2.172 2.172m-4.242 0l-4 4a1 1 0 01-1.414 0l-4-4"
              } 
            />
          </svg>
          {isMuted ? 'Ativar notificações' : 'Silenciar notificações'}
        </button>
        
        <button
          onClick={onArchive}
          className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 ${
            darkMode ? 'hover:bg-gray-700' : ''
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" 
            />
          </svg>
          Arquivar conversa
        </button>
        
        <div className={`border-t my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
        
        <button
          onClick={onBlock}
          className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 ${
            darkMode ? 'hover:bg-gray-700' : ''
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 mr-3 ${isBlocked ? 'text-amber-500' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={isBlocked ? 2.5 : 1.5} 
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" 
            />
          </svg>
          {isBlocked ? 'Desbloquear contato' : 'Bloquear contato'}
        </button>
        
        <button
          onClick={onReport}
          className={`flex items-center w-full px-4 py-2 text-sm hover:bg-gray-50 ${
            darkMode ? 'hover:bg-gray-700' : ''
          }`}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-3 text-amber-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          Reportar contato
        </button>
        
        <div className={`border-t my-1 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`} />
        
        <button
          onClick={onClearConversation}
          className="flex items-center w-full px-4 py-2 text-sm text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
          Limpar Conversa
        </button>
        
        <button
          onClick={onDelete}
          className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-3" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
            />
          </svg>
          Excluir conversa
        </button>
      </div>
    </div>
  );
};

export default ConversationContextMenu;