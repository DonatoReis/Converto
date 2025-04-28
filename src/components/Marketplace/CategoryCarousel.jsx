// src/components/Marketplace/CategoryCarousel.jsx
import React, { useRef } from 'react';

const CategoryCarousel = ({ categories, selectedCategory, onSelectCategory, darkMode }) => {
  const scrollRef = useRef(null);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -220 : 220;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className={`py-3 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-white'} border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
      <div className="relative px-4">
        {/* Left scroll button */}
        <button 
          onClick={() => scroll('left')}
          className={`absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-1 rounded-full ${darkMode ? 'bg-[#333333] text-white hover:bg-[#444444]' : 'bg-white text-gray-800 hover:bg-gray-100 shadow-md'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        {/* Categories */}
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto hide-scrollbar gap-2 px-6"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onSelectCategory(category.name)}
              className={`flex flex-col items-center justify-center px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                selectedCategory === category.name
                  ? darkMode 
                    ? 'bg-[#2B4FFF] text-white' 
                    : 'bg-[#2B4FFF] text-white'
                  : darkMode 
                    ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="text-xl mb-1">{category.icon}</span>
              <span className="text-sm font-medium">{category.name}</span>
            </button>
          ))}
        </div>
        
        {/* Right scroll button */}
        <button 
          onClick={() => scroll('right')}
          className={`absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-1 rounded-full ${darkMode ? 'bg-[#333333] text-white hover:bg-[#444444]' : 'bg-white text-gray-800 hover:bg-gray-100 shadow-md'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default CategoryCarousel;