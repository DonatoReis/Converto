// src/components/AIMatchmaking/MatchScreen.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import SuggestionCard from './SuggestionCard';

// Business categories
const BUSINESS_CATEGORIES = [
  'Tecnologia',
  'Design',
  'Marketing',
  'Finanças',
  'Construção',
  'Saúde',
  'Educação',
  'Alimentação',
  'Varejo',
  'Logística',
  'Jurídico',
  'Consultoria',
  'Imobiliário',
  'Manufatura',
  'Agricultura'
];

// Complementary services mapping (which services work well together)
const COMPLEMENTARY_SERVICES = {
  'Desenvolvimento de Software': ['Design de UI/UX', 'Marketing Digital', 'Consultoria de TI', 'Hospedagem de Sites'],
  'Design de UI/UX': ['Desenvolvimento de Software', 'Branding', 'Marketing Digital'],
  'Marketing Digital': ['Design de UI/UX', 'Desenvolvimento de Software', 'SEO', 'Branding', 'Gestão de Redes Sociais'],
  'Gestão Financeira': ['Contabilidade', 'Consultoria de Negócios', 'ERP', 'Recursos Humanos'],
  'Contabilidade': ['Gestão Financeira', 'Jurídico', 'Consultoria de Negócios'],
  'Construção Civil': ['Arquitetura', 'Design de Interiores', 'Materiais de Construção', 'Engenharia'],
  'Arquitetura': ['Construção Civil', 'Design de Interiores', 'Paisagismo'],
  'Serviços de Saúde': ['Tecnologia Médica', 'Equipamentos Médicos', 'Gestão Hospitalar'],
  'Educação Online': ['Produção de Conteúdo', 'Desenvolvimento de Software', 'Marketing Digital'],
  'Serviços de Alimentação': ['Delivery', 'Marketing Digital', 'Gestão de Estoque'],
  'E-commerce': ['Desenvolvimento de Software', 'Marketing Digital', 'Logística', 'Gestão de Estoque'],
  'Logística': ['E-commerce', 'Gestão de Estoque', 'Transporte'],
  'Serviços Jurídicos': ['Contabilidade', 'Consultoria de Negócios', 'Gestão de Documentos'],
  'Consultoria de Negócios': ['Gestão Financeira', 'Marketing Digital', 'Recursos Humanos'],
  'Imobiliário': ['Arquitetura', 'Design de Interiores', 'Jurídico', 'Marketing Digital'],
  'Manufatura': ['Logística', 'Gestão de Estoque', 'ERP', 'Automação Industrial'],
  'Agricultura': ['Tecnologia Agrícola', 'Logística', 'Análise de Dados']
};

// Mock data for user's own business
const CURRENT_BUSINESS = {
  id: 'user_business',
  name: 'Minha Empresa',
  sector: 'Tecnologia',
  services: ['Desenvolvimento de Software', 'Consultoria de TI', 'Cloud Computing'],
  location: 'São Paulo, SP'
};

// Enhanced mock data for match suggestions with services
const mockSuggestions = [
  {
    id: 1,
    name: 'TechSolutions Inc',
    sector: 'Tecnologia',
    services: ['Hospedagem de Sites', 'Segurança Digital', 'Suporte de TI', 'Cloud Computing'],
    location: 'São Paulo, SP',
    logo: '/assets/images/company1.jpg',
    description: 'Empresa especializada em soluções tecnológicas para negócios de todos os tamanhos.',
    foundedYear: 2015,
    employees: '10-50',
    website: 'techsolutions.com.br',
    complementaryServices: ['Hospedagem de Sites', 'Segurança Digital'],
    similarServices: ['Cloud Computing'],
    matchScore: 94,
  },
  {
    id: 2,
    name: 'Design Masters',
    sector: 'Design',
    services: ['Design de UI/UX', 'Branding', 'Design de Interfaces', 'Prototipagem'],
    location: 'Rio de Janeiro, RJ',
    logo: '/assets/images/company2.jpg',
    description: 'Agência criativa com foco em design de marca e experiência do usuário.',
    foundedYear: 2018,
    employees: '5-20',
    website: 'designmasters.com.br',
    complementaryServices: ['Design de UI/UX', 'Branding'],
    similarServices: [],
    matchScore: 87,
  },
  {
    id: 3,
    name: 'Marketing Pro',
    sector: 'Marketing',
    location: 'Belo Horizonte, MG',
    logo: '/assets/images/company3.jpg',
    description: 'Especialistas em marketing digital e estratégias de crescimento.',
    matchScore: 82,
  },
  {
    id: 4,
    name: 'Finantech',
    sector: 'Finanças',
    location: 'São Paulo, SP',
    logo: '/assets/images/company4.jpg',
    description: 'Soluções financeiras inovadoras para empresas de todos os portes.',
    matchScore: 78,
  },
  {
    id: 5,
    name: 'ConstruBuild',
    sector: 'Construção',
    services: ['Construção Civil', 'Reforma', 'Consultoria de Projetos', 'Materiais de Construção'],
    location: 'Brasília, DF',
    logo: '/assets/images/company5.jpg',
    description: 'Construtora com expertise em projetos comerciais e residenciais.',
    foundedYear: 2010,
    employees: '50-200',
    website: 'construbuild.com.br',
    complementaryServices: [],
    similarServices: [],
    matchScore: 75,
  },
  {
    id: 6,
    name: 'DigiMarket Pro',
    sector: 'Marketing',
    services: ['Marketing Digital', 'SEO', 'Gestão de Redes Sociais', 'Branding'],
    location: 'São Paulo, SP',
    logo: '/assets/images/company6.jpg',
    description: 'Agência de marketing digital especializada em estratégias de crescimento online.',
    foundedYear: 2019,
    employees: '10-50',
    website: 'digimarketpro.com.br',
    complementaryServices: ['Marketing Digital', 'SEO', 'Gestão de Redes Sociais'],
    similarServices: [],
    matchScore: 92,
  },
  {
    id: 7,
    name: 'UX Vision',
    sector: 'Design',
    services: ['Design de UI/UX', 'Pesquisa de Usuários', 'Testes de Usabilidade', 'Prototipagem'],
    location: 'Curitiba, PR',
    logo: '/assets/images/company7.jpg',
    description: 'Estúdio focado em criar experiências digitais centradas no usuário.',
    foundedYear: 2017,
    employees: '5-20',
    website: 'uxvision.com.br',
    complementaryServices: ['Design de UI/UX', 'Pesquisa de Usuários'],
    similarServices: [],
    matchScore: 89,
  }
];

// Helper function to calculate match score based on services
const calculateMatchScore = (userServices, companyServices, matchType = 'complementary') => {
  // Get potential complementary services for user's services
  let potentialMatches = [];
  userServices.forEach(service => {
    if (COMPLEMENTARY_SERVICES[service]) {
      potentialMatches = [...potentialMatches, ...COMPLEMENTARY_SERVICES[service]];
    }
  });
  
  // Remove duplicates
  potentialMatches = [...new Set(potentialMatches)];
  
  // For similar services, look for direct matches
  if (matchType === 'similar') {
    const similarCount = companyServices.filter(service => userServices.includes(service)).length;
    return similarCount > 0 ? Math.min(95, 60 + (similarCount / userServices.length) * 40) : 0;
  }
  
  // For complementary services
  const complementaryCount = companyServices.filter(service => potentialMatches.includes(service)).length;
  return complementaryCount > 0 ? Math.min(98, 70 + (complementaryCount / potentialMatches.length) * 30) : 0;
};

const MatchScreen = () => {
  const { darkMode } = useTheme();
  const [suggestions, setSuggestions] = useState([]);
  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);
  const [matchesFound, setMatchesFound] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sector: '',
    location: '',
    matchType: 'complementary', // 'complementary' or 'similar'
    minScore: 70
  });

  useEffect(() => {
    // Simulate loading suggestions
    setLoading(true);
    
    setTimeout(() => {
      // Pre-process suggestions to set complementary and similar services
      const processedSuggestions = mockSuggestions.map(suggestion => {
        // Calculate real match score based on services
        const calculatedScore = calculateMatchScore(
          CURRENT_BUSINESS.services, 
          suggestion.services,
          filters.matchType
        );
        
        // Determine which services are complementary to user's business
        let complementaryServices = [];
        let similarServices = [];
        
        CURRENT_BUSINESS.services.forEach(userService => {
          // Check for similar services
          if (suggestion.services.includes(userService)) {
            similarServices.push(userService);
          }
          
          // Check for complementary services
          if (COMPLEMENTARY_SERVICES[userService]) {
            const complementary = COMPLEMENTARY_SERVICES[userService].filter(
              service => suggestion.services.includes(service)
            );
            complementaryServices = [...complementaryServices, ...complementary];
          }
        });
        
        // Remove duplicates
        complementaryServices = [...new Set(complementaryServices)];
        similarServices = [...new Set(similarServices)];
        
        return {
          ...suggestion,
          matchScore: Math.round(calculatedScore),
          complementaryServices,
          similarServices
        };
      });
      
      // Apply filters
      const filteredSuggestions = processedSuggestions.filter(suggestion => {
        // Filter by sector if selected
        if (filters.sector && suggestion.sector !== filters.sector) {
          return false;
        }
        
        // Filter by location if selected
        if (filters.location && !suggestion.location.includes(filters.location)) {
          return false;
        }
        
        // Filter by minimum match score
        if (suggestion.matchScore < filters.minScore) {
          return false;
        }
        
        return true;
      });
      
      // Sort by match score (highest first)
      filteredSuggestions.sort((a, b) => b.matchScore - a.matchScore);
      
      setSuggestions(filteredSuggestions);
      setTotalMatches(filteredSuggestions.length);
      setLoading(false);
    }, 1500);
  }, [filters]); // Re-run when filters change

  // Toggle filter panel
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Handle filter changes
  const handleFilterChange = (name, value) => {
    setFilters({
      ...filters,
      [name]: value
    });
  };

  const handleConnect = () => {
    if (currentSuggestionIndex < suggestions.length) {
      // In a real app, would initiate a connection with the current suggestion
      console.log(`Connecting with ${suggestions[currentSuggestionIndex].name}`);
      
      // Move to the next suggestion
      setMatchesFound(prev => prev + 1);
      setCurrentSuggestionIndex(prev => prev + 1);
      
      // Simulate success notification
      alert(`Conexão solicitada com sucesso: ${suggestions[currentSuggestionIndex].name}`);
    }
  };

  const handleSkip = () => {
    if (currentSuggestionIndex < suggestions.length) {
      // Move to the next suggestion
      setCurrentSuggestionIndex(prev => prev + 1);
    }
  };

  const currentSuggestion = suggestions[currentSuggestionIndex];
  const progressPercentage = totalMatches > 0 
    ? Math.min(100, (matchesFound / totalMatches) * 100) 
    : 0;

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-6 py-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F7FF]'} border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
        <div className="flex justify-between items-center">
          <div>
            <div className="flex items-center">
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                IA Matchmaking
              </h1>
              <div className={`ml-2 px-2 py-0.5 text-xs font-bold rounded-full ${darkMode ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-800'}`}>BETA</div>
            </div>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Encontre parceiros ideais para o seu negócio
            </p>
          </div>
          <div className="flex space-x-2">
            <div 
              onClick={toggleFilters}
              className={`px-3 py-1 rounded-full ${darkMode ? 'bg-[#333333]' : 'bg-gray-100'} flex items-center hover:bg-opacity-80 cursor-pointer transition-colors`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 mr-1 ${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'}`} viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
              </svg>
              <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Filtros</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Filter Panel */}
      {showFilters && (
        <div className={`px-6 py-4 ${darkMode ? 'bg-[#1F1F1F]' : 'bg-[#F7F7FF]'} border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Category/Sector Filter */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Setor
              </label>
              <select
                value={filters.sector}
                onChange={(e) => handleFilterChange('sector', e.target.value)}
                className={`w-full rounded-lg px-3 py-2 ${
                  darkMode 
                    ? 'bg-[#121212] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
              >
                <option value="">Todos os setores</option>
                {BUSINESS_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            {/* Location Filter */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Localização
              </label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className={`w-full rounded-lg px-3 py-2 ${
                  darkMode 
                    ? 'bg-[#121212] border-[#333] text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                } border focus:ring-2 focus:ring-[#2B4FFF] focus:border-transparent`}
              >
                <option value="">Todas as localizações</option>
                <option value="São Paulo">São Paulo</option>
                <option value="Rio de Janeiro">Rio de Janeiro</option>
                <option value="Belo Horizonte">Belo Horizonte</option>
                <option value="Brasília">Brasília</option>
                <option value="Curitiba">Curitiba</option>
              </select>
            </div>
            
            {/* Match Type Filter */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Tipo de Match
              </label>
              <div className="flex space-x-3">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="matchType"
                    checked={filters.matchType === 'complementary'}
                    onChange={() => handleFilterChange('matchType', 'complementary')}
                    className="mr-1.5 h-4 w-4 text-[#2B4FFF]"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Complementares</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="matchType"
                    checked={filters.matchType === 'similar'}
                    onChange={() => handleFilterChange('matchType', 'similar')}
                    className="mr-1.5 h-4 w-4 text-[#2B4FFF]"
                  />
                  <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Similares</span>
                </label>
              </div>
            </div>
            
            {/* Minimum Match Score */}
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Score Mínimo: {filters.minScore}%
              </label>
              <input
                type="range"
                min="50"
                max="90"
                step="5"
                value={filters.minScore}
                onChange={(e) => handleFilterChange('minScore', parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <div className="flex-1 p-4 flex flex-col items-center justify-center relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              {/* Background gradient circle */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full blur-md"></div>
              
              {/* Animated rings */}
              <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full animate-[ping_3s_infinite]" style={{ animationDelay: '0s' }}></div>
              <div className="absolute inset-1 border-4 border-purple-500/20 rounded-full animate-[ping_3s_infinite]" style={{ animationDelay: '0.5s' }}></div>
              <div className="absolute inset-2 border-4 border-indigo-500/10 rounded-full animate-[ping_3s_infinite]" style={{ animationDelay: '1s' }}></div>
              
              {/* Center circle with icon */}
              <div className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br ${darkMode ? 'from-blue-600/80 to-purple-600/80' : 'from-blue-500 to-purple-500'} shadow-lg`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            <div className="mt-8 text-center max-w-xs">
              <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                Encontrando matches para você...
              </p>
              <p className={`mt-2 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Nossa IA está analisando perfis com base em suas preferências e histórico de negócios
              </p>
              
              {/* Loading dots */}
              <div className="flex items-center justify-center space-x-1 mt-4">
                <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-blue-400' : 'bg-blue-500'} animate-bounce`} style={{ animationDelay: '0s' }}></div>
                <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-indigo-400' : 'bg-indigo-500'} animate-bounce`} style={{ animationDelay: '0.2s' }}></div>
                <div className={`w-2 h-2 rounded-full ${darkMode ? 'bg-purple-400' : 'bg-purple-500'} animate-bounce`} style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        ) : currentSuggestionIndex < suggestions.length && currentSuggestion ? (
          <>
            <SuggestionCard 
              suggestion={currentSuggestion}
              onConnect={handleConnect}
              onSkip={handleSkip}
              darkMode={darkMode}
            />
            
            {/* Progress indicator */}
            <div className="absolute bottom-8 left-0 right-0 px-6">
              <div className="flex justify-between items-center mb-2">
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {matchesFound} de {totalMatches} matches encontrados
                </span>
                <span className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentSuggestionIndex + 1}/{suggestions.length}
                </span>
              </div>
              <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-[#333333]' : 'bg-gray-200'}`}>
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-[#2B4FFF] to-[#BA5AFF]" 
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center text-center w-full max-w-md">
            <div className="relative">
              <div className={`absolute -inset-1 rounded-full ${darkMode ? 'bg-gradient-to-r from-[#2B4FFF]/30 to-[#BA5AFF]/30' : 'bg-gradient-to-r from-[#2B4FFF]/20 to-[#BA5AFF]/20'} blur-sm`}></div>
              <div className={`relative w-24 h-24 rounded-full flex items-center justify-center ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-14 w-14 ${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <h2 className={`text-xl font-bold mt-6 mb-2 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Matches concluídos!
            </h2>
            <p className={`text-sm mb-6 max-w-md ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Você encontrou <span className="font-semibold text-green-500">{matchesFound}</span> novos parceiros potenciais! Continue navegando para descobrir mais oportunidades.
            </p>
            
            {/* Match Stats */}
            <div className={`w-full p-4 rounded-lg mb-6 ${darkMode ? 'bg-[#1F1F1F]' : 'bg-gray-50'}`}>
              <h3 className={`text-sm font-medium mb-3 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                Resumo de Atividade
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Conexões</p>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{matchesFound}</p>
                </div>
                <div className="text-center">
                  <p className={`text-xs mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Taxa de Match</p>
                  <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                    {totalMatches > 0 ? Math.round((matchesFound / totalMatches) * 100) : 0}%
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => window.location.reload()}
              className={`w-full px-6 py-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 ${darkMode ? 'bg-[#2B4FFF] text-white hover:bg-[#3D5AFF]' : 'bg-[#2B4FFF] text-white hover:bg-[#3D5AFF]'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              Encontrar mais parceiros
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MatchScreen;