// src/components/Dashboard/TabNavigation.jsx
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Database from '../../utils/database';
const TabNavigation = () => {
  const { darkMode } = useTheme();
  const location = useLocation();
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  
  useEffect(() => {
    // Função para calcular o número total de mensagens não lidas
    const getUnreadCount = () => {
      const conversations = Database.getAllConversations();
      const totalUnread = conversations.reduce((total, conversation) => {
        return total + (conversation.unreadCount || 0);
      }, 0);
      setUnreadChatCount(totalUnread);
    };

    // Buscar contagem inicial
    getUnreadCount();

    // Atualizar a cada 30 segundos para refletir mudanças
    const intervalId = setInterval(getUnreadCount, 30000);

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(intervalId);
  }, []);
  
  const tabs = [
    {
      path: '/dashboard/chat',
      label: 'Chat',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      unreadCount: unreadChatCount > 0 ? unreadChatCount : null
    },
    {
      path: '/dashboard/contacts',
      label: 'Contatos',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      path: '/dashboard/search',
      label: 'Buscar',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ),
    },
    {
      path: '/dashboard/marketplace',
      label: 'Mercado',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
    },
    {
      path: '/dashboard/match',
      label: 'Match',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      unreadCount: 2
    },
    {
      path: '/dashboard/profile',
      label: 'Perfil',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      path: '/dashboard/settings',
      label: 'Config',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <nav className={`w-20 h-full py-4 flex flex-col items-center space-y-6 border-r ${
      darkMode ? 'bg-[#121212] border-[#666666]' : 'bg-white border-[#2B4FFF]/10'
    }`}>
      {tabs.map((tab) => {
        const isActive = location.pathname === tab.path;
        return (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={`relative flex flex-col items-center justify-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? darkMode
                  ? 'text-[#5C78FF] bg-[#2B4FFF]/20'
                  : 'text-[#2B4FFF] bg-[#2B4FFF]/10'
                : darkMode
                ? 'text-[#f1f1f1] hover:text-[#5C78FF] hover:bg-[#2B4FFF]/10'
                : 'text-[#171717] hover:text-[#2B4FFF] hover:bg-[#2B4FFF]/5'
            }`}
          >
            {tab.icon}
            <span className="text-xs font-medium">{tab.label}</span>
            
            {/* Unread Badge */}
            {tab.unreadCount && (
              <span className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-[#BA5AFF] text-white text-xs font-bold">
                {tab.unreadCount}
              </span>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};

export default TabNavigation;