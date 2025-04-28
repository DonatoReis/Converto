// src/components/AIMatchmaking/SuggestionCard.jsx
import React, { useState } from 'react';

const SuggestionCard = ({ suggestion, onConnect, onSkip, darkMode }) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const { 
    name, 
    sector, 
    services,
    location, 
    logo, 
    description, 
    matchScore,
    complementaryServices,
    similarServices,
    foundedYear,
    employees,
    website
  } = suggestion;

  return (
    <div className={`w-full max-w-lg rounded-xl overflow-hidden shadow-lg transform transition-all hover:scale-[1.02] ${darkMode ? 'bg-[#1F1F1F]' : 'bg-white'}`}>
      {/* Top section with logo, name and match score */}
      <div className={`relative ${darkMode ? 'bg-gradient-to-r from-[#2B4FFF]/30 to-[#BA5AFF]/30' : 'bg-gradient-to-r from-[#2B4FFF]/10 to-[#BA5AFF]/10'}`}>
        <div className="flex items-center p-6">
          <div className={`w-20 h-20 rounded-full overflow-hidden border-4 ${darkMode ? 'border-[#1F1F1F]' : 'border-white'} bg-gray-200 flex-shrink-0`}>
            {logo ? (
              <img 
                src={logo} 
                alt={name}
                className="w-full h-full object-cover" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://via.placeholder.com/150?text=Logo';
                }}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-[#333333]' : 'bg-gray-100'}`}>
                <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  {name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          <div className="ml-6 flex-1">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              {name}
            </h2>
            <div className="flex flex-wrap items-center mt-1">
              <span className={`text-sm mr-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{sector}</span>
              <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{location}</span>
            </div>
          </div>
          
          <div className={`flex-shrink-0 w-16 h-16 rounded-full flex items-center justify-center ${darkMode ? 'bg-[#1F1F1F]/80' : 'bg-white/80'}`}>
            <div className={`text-center`}>
              <div className="relative">
                <div className={`absolute -inset-1 rounded-full opacity-30 ${
                  matchScore >= 90 
                    ? 'bg-green-500 animate-pulse' 
                    : matchScore >= 80 
                      ? 'bg-blue-500' 
                      : 'bg-yellow-500'
                }`}></div>
                <span className={`relative block text-xl font-bold ${
                  matchScore >= 90 
                    ? 'text-green-500' 
                    : matchScore >= 80 
                      ? 'text-blue-500' 
                      : 'text-yellow-500'
                }`}>
                  {matchScore}%
                </span>
              </div>
              <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                match
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Details section */}
      <div className="p-6">
        <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Sobre a empresa
        </h3>
        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {description}
        </p>
        
        {/* Match reasons */}
        <h3 className={`text-sm font-medium mb-2 flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 mr-1 text-green-500">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
            Por que vocês combinam
          </h3>
          
          {/* Match Strength Indicator */}
          <div className={`mb-3 p-2 rounded-lg ${
            darkMode 
              ? matchScore >= 90 ? 'bg-green-900/20' : matchScore >= 80 ? 'bg-blue-900/20' : 'bg-yellow-900/20'
              : matchScore >= 90 ? 'bg-green-50' : matchScore >= 80 ? 'bg-blue-50' : 'bg-yellow-50'
          }`}>
            <div className="flex items-center mb-1">
              <span className={`text-xs font-medium ${
                matchScore >= 90 
                  ? 'text-green-500' 
                  : matchScore >= 80 
                    ? 'text-blue-500' 
                    : 'text-yellow-500'
              }`}>
                {matchScore >= 90 
                  ? 'Compatibilidade Excelente'
                  : matchScore >= 80 
                    ? 'Boa Compatibilidade'
                    : 'Compatibilidade Média'}
              </span>
            </div>
            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`absolute left-0 top-0 h-full ${
                  matchScore >= 90 
                    ? 'bg-green-500' 
                    : matchScore >= 80 
                      ? 'bg-blue-500' 
                      : 'bg-yellow-500'
                }`} 
                style={{ width: `${matchScore}%` }}
              ></div>
            </div>
          </div>
          
          {/* Complementary Services Section */}
          {complementaryServices && complementaryServices.length > 0 && (
            <div className="mb-3">
              <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                Serviços Complementares
              </h4>
              <div className="flex flex-wrap gap-1">
                {complementaryServices.map((service, idx) => (
                  <span 
                    key={idx}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      darkMode 
                        ? 'bg-green-900/30 text-green-400 border border-green-800/50' 
                        : 'bg-green-50 text-green-700 border border-green-200'
                    }`}
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Similar Services Section */}
          {similarServices && similarServices.length > 0 && (
            <div className="mb-3">
              <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                Serviços Similares
              </h4>
              <div className="flex flex-wrap gap-1">
                {similarServices.map((service, idx) => (
                  <span 
                    key={idx}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      darkMode 
                        ? 'bg-blue-900/30 text-blue-400 border border-blue-800/50' 
                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                    }`}
                  >
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          <div className={`space-y-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {location && (
              <div className="flex items-start">
                <div className={`mr-2 mt-0.5 w-1.5 h-1.5 rounded-full ${matchScore >= 90 ? 'bg-green-500' : matchScore >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                <span>Localização próxima: {location}</span>
              </div>
            )}
            {sector && (
              <div className="flex items-start">
                <div className={`mr-2 mt-0.5 w-1.5 h-1.5 rounded-full ${matchScore >= 90 ? 'bg-green-500' : matchScore >= 80 ? 'bg-blue-500' : 'bg-yellow-500'}`}></div>
                <span>Atua no setor: {sector}</span>
              </div>
            )}
          </div>

        {/* Services offered */}
        <div className="mt-4">
          <h3 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Serviços oferecidos
          </h3>
          <div className="flex flex-wrap gap-2">
            {services && services.map((service, i) => (
              <span 
                key={i}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${darkMode ? 'bg-[#333333] text-gray-300' : 'bg-gray-100 text-gray-700'}`}
              >
                {service}
              </span>
            ))}
          </div>
        </div>

        {/* Company details - expandable section */}
        <div className="mt-4">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className={`flex items-center text-sm font-medium ${
              darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'
            } transition-colors`}
          >
            <span>
              {showDetails ? 'Ocultar detalhes' : 'Ver mais detalhes'}
            </span>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`h-4 w-4 ml-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showDetails && (
            <div className={`mt-3 p-3 rounded-lg ${darkMode ? 'bg-[#181818]' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-2 gap-3">
                {foundedYear && (
                  <div>
                    <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Ano de fundação
                    </h4>
                    <p className={`${darkMode ? 'text-white' : 'text-black'} font-medium`}>{foundedYear}</p>
                  </div>
                )}
                
                {employees && (
                  <div>
                    <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Funcionários
                    </h4>
                    <p className={`${darkMode ? 'text-white' : 'text-black'} font-medium`}>{employees}</p>
                  </div>
                )}
                
                {website && (
                  <div className="col-span-2">
                    <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      Website
                    </h4>
                    <a 
                      href={`https://${website}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={`${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-500'} font-medium underline`}
                    >
                      {website}
                    </a>
                  </div>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <h4 className={`text-xs font-medium mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Potencial de negócios
                </h4>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm`}>
                  Esta empresa oferece {complementaryServices?.length || 0} serviços complementares e {similarServices?.length || 0} serviços similares aos seus.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons */}
      <div className={`flex border-t ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
        <button
          onClick={onSkip}
          className={`flex-1 py-4 font-medium text-sm transition-colors flex items-center justify-center gap-2 ${
            darkMode 
              ? 'bg-[#1F1F1F] text-gray-400 hover:bg-[#282828]' 
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          PULAR
        </button>
        <button
          onClick={onConnect}
          className={`flex-1 py-4 font-medium text-sm text-white transition-colors flex items-center justify-center gap-2 ${
            darkMode 
              ? 'bg-[#2B4FFF] hover:bg-[#3D5AFF]' 
              : 'bg-[#2B4FFF] hover:bg-[#3D5AFF]'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          CONECTAR
        </button>
      </div>
    </div>
  );
};

export default SuggestionCard;