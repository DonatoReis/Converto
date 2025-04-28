// src/components/SmartSearch/ResultsList.jsx
import React, { useRef, useEffect } from 'react';

const ResultsList = ({ results, loading, onLoadMore, darkMode }) => {
  const observerRef = useRef(null);
  const lastItemRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    
    // Intersection Observer for infinite scroll
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && results.length > 0) {
        onLoadMore();
      }
    });
    
    if (lastItemRef.current) {
      observerRef.current.observe(lastItemRef.current);
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, results.length, onLoadMore]);

  // Star rating component
  const StarRating = ({ rating }) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i}
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill={i < Math.floor(rating) ? "#FFC107" : "none"}
            stroke={i < Math.floor(rating) ? "#FFC107" : "#9CA3AF"}
            className="h-3 w-3"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ))}
        <span className={`ml-1 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {rating.toFixed(1)}
        </span>
      </div>
    );
  };

  return (
    <div className="py-2">
      {results.map((result, index) => (
        <div 
          key={result.id}
          ref={index === results.length - 1 ? lastItemRef : null}
          className={`mx-4 mb-3 p-4 rounded-lg ${darkMode ? 'bg-[#1F1F1F]' : 'bg-white'} shadow-sm transition-all hover:shadow-md ${
            darkMode ? 'hover:bg-[#282828]' : 'hover:bg-gray-50'
          }`}
        >
          <div className="flex items-start">
            <div className={`w-14 h-14 rounded-full ${darkMode ? 'bg-[#333333]' : 'bg-gray-100'} flex items-center justify-center overflow-hidden border-2 ${darkMode ? 'border-[#333333]' : 'border-white'} flex-shrink-0`}>
              {result.image ? (
                <img src={result.image} alt={result.name} className="w-full h-full object-cover" />
              ) : (
                <span className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-700'}`}>
                  {result.name.charAt(0)}
                </span>
              )}
              {result.online && (
                <span className="absolute w-3 h-3 bg-green-500 border-2 border-white rounded-full bottom-0 right-0"></span>
              )}
            </div>
            <div className="ml-4 flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>{result.name}</h3>
                  <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{result.title || result.position || 'Profissional'}</p>
                </div>
                {result.premium && (
                  <span className="bg-amber-500/10 text-amber-500 text-xs px-2 py-0.5 rounded-full font-medium flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 mr-1">
                      <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
                    </svg>
                    Premium
                  </span>
                )}
              </div>
              <div className="flex flex-wrap items-center mt-2">
                <span className={`text-xs mr-3 flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 6V5a3 3 0 013-3h2a3 3 0 013 3v1h2a2 2 0 012 2v3.57A22.952 22.952 0 0110 13a22.95 22.95 0 01-8-1.43V8a2 2 0 012-2h2zm2-1a1 1 0 011-1h2a1 1 0 011 1v1H8V5zm1 5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" />
                    <path d="M2 13.692V16a2 2 0 002 2h12a2 2 0 002-2v-2.308A24.974 24.974 0 0110 15c-2.796 0-5.487-.46-8-1.308z" />
                  </svg>
                  {result.sector}
                </span>
                <span className={`text-xs mr-3 flex items-center ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  {result.location}
                </span>
                <StarRating rating={result.rating} />
              </div>
              {result.tags && result.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {result.tags.map((tag, i) => (
                    <span 
                      key={i}
                      className={`px-2 py-0.5 rounded-full text-xs ${darkMode ? 'bg-[#333333] text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 pt-3 border-t flex justify-between items-center ${darkMode ? 'border-[#333333]' : 'border-gray-100'}">
            <div>
              {result.price && (
                <span className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  A partir de R$ {result.price.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex">
              <button 
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center ${
                  darkMode 
                    ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Ver perfil
              </button>
              <button 
                className={`ml-2 px-3 py-1.5 rounded text-xs font-medium transition-colors flex items-center ${
                  darkMode 
                    ? 'bg-[#2B4FFF] text-white hover:bg-[#3D5AFF]' 
                    : 'bg-[#2B4FFF] text-white hover:bg-[#3D5AFF]'
                }`}
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Conectar
              </button>
              {result.favorite && (
                <button className="ml-2 p-1.5 rounded-full bg-red-50 text-red-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResultsList;