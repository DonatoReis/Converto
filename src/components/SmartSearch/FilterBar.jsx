// src/components/SmartSearch/FilterBar.jsx
import React, { useState } from 'react';

const FilterBar = ({ filters, onFilterChange, onClearFilters, darkMode }) => {
  const sectors = ['Tecnologia', 'Marketing', 'Design', 'Finanças', 'Construção', 'Jurídico'];
  const locations = ['São Paulo, SP', 'Rio de Janeiro, RJ', 'Belo Horizonte, MG', 'Brasília, DF', 'Porto Alegre, RS'];
  const ratings = [5, 4, 3, 2, 1];
  
  const [showFilters, setShowFilters] = useState(true);
  
  const toggleFilter = (filterType, value) => {
    const newFilters = { ...filters };
    
    switch (filterType) {
      case 'sector':
        if (newFilters.sector.includes(value)) {
          newFilters.sector = newFilters.sector.filter(item => item !== value);
        } else {
          newFilters.sector = [...newFilters.sector, value];
        }
        break;
      case 'location':
        if (newFilters.location.includes(value)) {
          newFilters.location = newFilters.location.filter(item => item !== value);
        } else {
          newFilters.location = [...newFilters.location, value];
        }
        break;
      case 'rating':
        newFilters.rating = newFilters.rating === value ? null : value;
        break;
      case 'contacts':
      case 'favorites':
      case 'unread':
        newFilters[filterType] = !newFilters[filterType];
        break;
      default:
        break;
    }
    
    onFilterChange(newFilters);
  };
  
  const handlePriceChange = (e, index) => {
    const newRange = [...filters.priceRange];
    newRange[index] = parseInt(e.target.value, 10);
    const newFilters = { ...filters, priceRange: newRange };
    onFilterChange(newFilters);
  };

  return (
    <div className={`overflow-hidden ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`mr-2 p-1.5 rounded-md ${darkMode ? 'hover:bg-[#333333]' : 'hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-white' : 'text-[#121212]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
          <h2 className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            Filtros
          </h2>
        </div>
        <button 
          onClick={onClearFilters}
          className={`text-xs ${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'} hover:underline`}
        >
          Limpar filtros
        </button>
      </div>
      
      {showFilters && (
        <div className={`px-4 pb-3 border-b ${darkMode ? 'border-[#333333]' : 'border-gray-100'}`}>
          {/* Filter categories */}
          <div className="mb-4">
            <h3 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Setor
            </h3>
            <div className="flex flex-wrap gap-2">
              {sectors.map((sector) => (
                <button
                  key={sector}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.sector.includes(sector)
                      ? darkMode
                        ? 'bg-[#2B4FFF] text-white'
                        : 'bg-[#2B4FFF] text-white'
                      : darkMode
                        ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleFilter('sector', sector)}
                >
                  {sector}
                </button>
              ))}
            </div>
          </div>
          
          {/* Location filter */}
          <div className="mb-4">
            <h3 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Localização
            </h3>
            <div className="flex flex-wrap gap-2">
              {locations.map((location) => (
                <button
                  key={location}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    filters.location.includes(location)
                      ? darkMode
                        ? 'bg-[#2B4FFF] text-white'
                        : 'bg-[#2B4FFF] text-white'
                      : darkMode
                        ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleFilter('location', location)}
                >
                  {location}
                </button>
              ))}
            </div>
          </div>
          
          {/* Rating filter */}
          <div className="mb-4">
            <h3 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Avaliação mínima
            </h3>
            <div className="flex gap-2">
              {ratings.map((rating) => (
                <button
                  key={rating}
                  className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${
                    filters.rating === rating
                      ? darkMode
                        ? 'bg-[#2B4FFF] text-white'
                        : 'bg-[#2B4FFF] text-white' 
                      : darkMode
                        ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleFilter('rating', rating)}
                >
                  {rating}★
                </button>
              ))}
            </div>
          </div>
          
          {/* Price range filter - improved slider appearance */}
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <h3 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Faixa de preço
              </h3>
              <span className={`text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                R$ {filters.priceRange[0].toLocaleString('pt-BR')} - R$ {filters.priceRange[1].toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex flex-col gap-4 mt-3">
              <div className="relative">
                <div className={`absolute left-0 right-0 h-1 rounded-full ${darkMode ? 'bg-[#333333]' : 'bg-gray-200'}`}></div>
                <div 
                  className="absolute h-1 bg-[#2B4FFF] rounded-full" 
                  style={{
                    left: `${(filters.priceRange[0] / 5000) * 100}%`,
                    right: `${100 - (filters.priceRange[1] / 5000) * 100}%`
                  }}
                ></div>
                <input 
                  type="range" 
                  min="0" 
                  max="5000" 
                  step="100"
                  value={filters.priceRange[0]} 
                  onChange={(e) => handlePriceChange(e, 0)}
                  className="absolute w-full appearance-none bg-transparent pointer-events-auto cursor-pointer h-6 z-10"
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: 'transparent',
                  }}
                />
                <input 
                  type="range" 
                  min="0" 
                  max="5000" 
                  step="100"
                  value={filters.priceRange[1]} 
                  onChange={(e) => handlePriceChange(e, 1)}
                  className="absolute w-full appearance-none bg-transparent pointer-events-auto cursor-pointer h-6 z-10"
                  style={{
                    WebkitAppearance: 'none',
                    appearance: 'none',
                    background: 'transparent',
                  }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>R$ 0</span>
                <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>R$ 5.000</span>
              </div>
            </div>
          </div>
          
          {/* Toggle filters */}
          <div className="flex flex-wrap gap-4">
            <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input 
                type="checkbox" 
                checked={filters.contacts}
                onChange={() => toggleFilter('contacts')}
                className="rounded text-[#2B4FFF] focus:ring-[#2B4FFF]"
              />
              Meus contatos
            </label>
            <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input 
                type="checkbox" 
                checked={filters.favorites}
                onChange={() => toggleFilter('favorites')}
                className="rounded text-[#2B4FFF] focus:ring-[#2B4FFF]"
              />
              Favoritos
            </label>
            <label className={`flex items-center gap-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              <input 
                type="checkbox" 
                checked={filters.unread}
                onChange={() => toggleFilter('unread')}
                className="rounded text-[#2B4FFF] focus:ring-[#2B4FFF]"
              />
              Não lidos
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBar;