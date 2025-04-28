// src/components/Marketplace/CartButton.jsx
import React from 'react';

const CartButton = ({ itemCount, onClick, darkMode }) => {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-6 right-6 px-4 py-3 rounded-full shadow-2xl flex items-center gap-2 transition-all hover:scale-105 hover:shadow-lg ${darkMode ? 'bg-gradient-to-r from-[#2B4FFF] to-[#4361FF]' : 'bg-gradient-to-r from-[#2B4FFF] to-[#4361FF]'}`}
    >
      <div className="relative">
        <div className="absolute -inset-1 bg-white/30 rounded-full blur-sm animate-pulse"></div>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white relative" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        
        {/* Badge with item count */}
        <div className="absolute -top-2 -right-2 min-w-5 h-5 rounded-full bg-[#BA5AFF] text-white text-xs flex items-center justify-center px-1.5 font-bold">
          {itemCount}
        </div>
      </div>
      
      <span className="font-medium text-white text-sm">
        Ver carrinho
      </span>
    </button>
  );
};

export default CartButton;