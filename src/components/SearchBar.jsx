// src/components/SearchBar.jsx
import React, { useState } from 'react';

const SearchBar = ({ onSearch, darkMode = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (onSearch) {
      onSearch(e.target.value);
    }
  };
  
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };
  
  return (
    <div className="w-full">
      <div className="relative flex w-full">
        {/* Search input */}
        <input
          type="text"
          value={searchTerm}
          onChange={handleSearch}
          placeholder="Pesquisar mensagens"
          className={`w-full py-2 pl-4 pr-10 rounded-l-lg focus:outline-none border 
            ${darkMode 
              ? 'bg-[#121212] border-[#121212]/30 text-white placeholder-gray-400' 
              : 'bg-white border-[#121212]/10 text-[#121212]'}`}
        />
        
        {/* Filter button */}
        <button 
          onClick={toggleFilters} 
          className={`px-3 rounded-r-lg flex items-center justify-center
            ${darkMode 
              ? 'bg-[#340068] text-white hover:bg-[#340068]/80' 
              : 'bg-[#64DFDF] text-[#340068] hover:bg-[#64DFDF]/80'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>
      
      {/* Filter dropdown (simplified version) */}
      {showFilters && (
        <div className={`mt-2 p-3 rounded-md shadow-md z-10 absolute
          ${darkMode 
            ? 'bg-[#121212] text-white' 
            : 'bg-white text-[#121212]'}`}>
          <div className="flex flex-col space-y-2">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-[#340068]" />
              <span>Mensagens não lidas</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-[#340068]" />
              <span>Contatos ativos</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="rounded text-[#340068]" />
              <span>Mensagens recentes</span>
            </label>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;