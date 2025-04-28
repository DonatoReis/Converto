// src/components/SmartSearch/SearchScreen.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import FilterBar from './FilterBar';
import ResultsList from './ResultsList';
import firestoreService from '../../firebase/firestoreService';
import { useAuth } from '../../context/AuthContext';

// Error Boundary Component for Search Screen
class SearchErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('SearchScreen error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-full items-center justify-center p-4 text-center">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-xl font-medium text-red-500 mb-2">Algo deu errado</h3>
            <p className="text-gray-600 mb-4">Não foi possível carregar a busca</p>
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

// Fallback data for development/testing
const fallbackResults = [
  {
    id: 1,
    name: 'TechSolutions Inc',
    sector: 'Tecnologia',
    location: 'São Paulo, SP',
    rating: 4.8,
    image: '/assets/images/company1.jpg'
  },
  {
    id: 2,
    name: 'Design Masters',
    sector: 'Design',
    location: 'Rio de Janeiro, RJ',
    rating: 4.5,
    image: '/assets/images/company2.jpg'
  },
  {
    id: 3,
    name: 'Marketing Pro',
    sector: 'Marketing',
    location: 'Belo Horizonte, MG',
    rating: 4.2,
    image: '/assets/images/company3.jpg'
  },
  {
    id: 4,
    name: 'ConstruBuild',
    sector: 'Construção',
    location: 'Brasília, DF',
    rating: 4.0,
    image: '/assets/images/company4.jpg'
  },
  {
    id: 5,
    name: 'Finantech',
    sector: 'Finanças',
    location: 'São Paulo, SP',
    rating: 4.7,
    image: '/assets/images/company5.jpg'
  }
];

const SearchScreen = () => {
  const { darkMode } = useTheme();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize states with values from URL or defaults
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get('q') || '');
  const [filters, setFilters] = useState({
    sector: searchParams.getAll('sector') || [],
    location: searchParams.getAll('location') || [],
    rating: searchParams.get('rating') ? Number(searchParams.get('rating')) : null,
    contacts: searchParams.get('contacts') === 'true',
    favorites: searchParams.get('favorites') === 'true',
    unread: searchParams.get('unread') === 'true',
    priceRange: [
      searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : 0, 
      searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : 5000
    ]
  });
  
  // Component state
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  
  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        
        // Try to fetch from Firestore
        let searchResults = [];
        
        if (searchTerm) {
          // If search term exists, use it for search
          searchResults = await fetchSearchResults(searchTerm, filters);
        } else {
          // Otherwise, fetch popular or recommended items
          try {
            searchResults = await firestoreService.getMarketplaceProducts(filters, 10);
          } catch (firestoreError) {
            console.error('Error fetching from Firestore:', firestoreError);
            // Fallback to mock data in development
            searchResults = [...fallbackResults];
          }
        }
        
        setResults(searchResults);
        setTotalResults(searchResults.length);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError(err);
        // Fallback to mock data if there's an error
        setResults([...fallbackResults]);
      } finally {
        setInitialLoading(false);
        setLoading(false);
      }
    };
    
    loadInitialData();
  }, [location.pathname]); // Only run on initial load or path change
  
  // Update URL when search or filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (searchTerm) params.set('q', searchTerm);
    
    // Add filter params
    filters.sector.forEach(sector => params.append('sector', sector));
    filters.location.forEach(location => params.append('location', location));
    if (filters.rating) params.set('rating', filters.rating);
    if (filters.contacts) params.set('contacts', 'true');
    if (filters.favorites) params.set('favorites', 'true');
    if (filters.unread) params.set('unread', 'true');
    params.set('minPrice', filters.priceRange[0]);
    params.set('maxPrice', filters.priceRange[1]);
    
    // Update URL without causing a navigation/reload
    setSearchParams(params, { replace: true });
  }, [searchTerm, filters, setSearchParams]);
  
  // Fetch search results from Firestore
  const fetchSearchResults = async (term, filterOptions) => {
    try {
      if (!term) return [];
      
      // Try to use Firestore search if available
      if (typeof firestoreService.searchMarketplaceProducts === 'function') {
        const firestoreResults = await firestoreService.searchMarketplaceProducts(term, filterOptions);
        return firestoreResults || [];
      }
      
      // Fallback to filtering mock results
      return fallbackResults.filter(item => 
        item.name.toLowerCase().includes(term.toLowerCase()) ||
        item.sector.toLowerCase().includes(term.toLowerCase()) ||
        item.location.toLowerCase().includes(term.toLowerCase())
      );
    } catch (error) {
      console.error('Search error:', error);
      return fallbackResults; // Fallback data
    }
  };
  
  const handleSearch = async (term) => {
    setSearchTerm(term);
    setLoading(true);
    setError(null);
    
    try {
      const searchResults = await fetchSearchResults(term, filters);
      setResults(searchResults);
    } catch (err) {
      console.error('Error during search:', err);
      setError(err);
      // Fallback to mock data
      setResults([...fallbackResults]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      sector: [],
      location: [],
      rating: null,
      contacts: false,
      favorites: false,
      unread: false,
      priceRange: [0, 5000]
    });
    setResults(mockResults);
  };

  const loadMore = () => {
    setLoading(true);
    // Simulate loading more results
    setTimeout(() => {
      setPage(prev => prev + 1);
      // In a real app, would fetch more results here
      setLoading(false);
    }, 500);
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
      <div className={`px-6 py-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F7FF]'} border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
        <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
          Busca Inteligente
        </h1>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Encontre leads e serviços para o seu negócio
        </p>
      </div>
      
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Search Input - Enhanced Global Search Bar with magnifying glass icon */}
        <div className={`p-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'} sticky top-0 z-10`}>
          <div className={`relative rounded-lg ${darkMode ? 'bg-[#333333]' : 'bg-gray-100'} flex items-center shadow-sm`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ml-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Buscar leads, serviços, produtos..." 
              className={`w-full p-3 outline-none ${darkMode ? 'bg-[#333333] text-white placeholder-gray-500' : 'bg-gray-100 text-[#121212] placeholder-gray-500'}`} 
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => handleSearch('')}
                className={`p-2 mr-1 rounded-full ${darkMode ? 'hover:bg-[#444444]' : 'hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            <button 
              onClick={() => handleSearch(searchTerm)}
              className={`p-2 mr-2 rounded-lg ${darkMode ? 'bg-[#2B4FFF] hover:bg-[#3D5AFF]' : 'bg-[#2B4FFF] hover:bg-[#3D5AFF]'} text-white`}
            >
              Buscar
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <FilterBar 
          filters={filters} 
          onFilterChange={handleFilterChange} 
          onClearFilters={handleClearFilters}
          darkMode={darkMode} 
        />
        
        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          <ResultsList 
            results={results} 
            loading={loading} 
            onLoadMore={loadMore}
            darkMode={darkMode} 
          />
          
          {/* Loading indicator */}
          {loading && (
            <div className="flex justify-center py-4">
              <svg className={`animate-spin h-6 w-6 ${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          
          {/* Empty state */}
          {!loading && results.length === 0 && (
            <div className={`flex flex-col items-center justify-center p-8 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
              <p className="text-sm opacity-75 text-center mt-1">
                Tente ajustar seus filtros ou buscar por outro termo
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SearchScreen;
