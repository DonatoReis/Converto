// src/components/Profile/NotificationSettings.jsx
import React from 'react';

const NotificationSettings = ({ settings, onChange, darkMode }) => {
  return (
    <div className={`p-6 rounded-lg ${darkMode ? 'bg-[#1F1F1F]' : 'bg-white'} ${darkMode ? '' : 'shadow'}`}>
      <h2 className={`text-lg font-semibold mb-6 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
        Preferências de Notificações
      </h2>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Mensagens
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Notificações sobre novas mensagens e atualizações de chat
            </p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.messages} 
                onChange={(e) => onChange('messages', e.target.checked)}
                className="sr-only peer" 
              />
              <div className={`w-11 h-6 ${
                darkMode ? 'bg-[#333333]' : 'bg-gray-200'
              } peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${
                darkMode ? 'bg-[#1ac27d]' : 'bg-[#1ac27d]'
              }`}></div>
            </label>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Leads
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Alertas sobre novos leads e oportunidades de negócio
            </p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.leads} 
                onChange={(e) => onChange('leads', e.target.checked)}
                className="sr-only peer" 
              />
              <div className={`w-11 h-6 ${
                darkMode ? 'bg-[#333333]' : 'bg-gray-200'
              } peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${
                darkMode ? 'bg-[#1ac27d]' : 'bg-[#1ac27d]'
              }`}></div>
            </label>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Promoções
            </h3>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Ofertas especiais, atualizações e newsletters
            </p>
          </div>
          <div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={settings.promotions} 
                onChange={(e) => onChange('promotions', e.target.checked)}
                className="sr-only peer" 
              />
              <div className={`w-11 h-6 ${
                darkMode ? 'bg-[#333333]' : 'bg-gray-200'
              } peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:${
                darkMode ? 'bg-[#1ac27d]' : 'bg-[#1ac27d]'
              }`}></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className={`mt-8 p-4 rounded-lg text-sm ${
        darkMode ? 'bg-[#333333] text-gray-400' : 'bg-gray-50 text-gray-600'
      }`}>
        <p className="flex items-start">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            Você também pode ajustar suas preferências de notificação por e-mail através das configurações de conta.
          </span>
        </p>
      </div>
      
    </div>
  );
};

export default NotificationSettings;