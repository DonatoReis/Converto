// src/components/Logo.jsx
import React from 'react';

const Logo = ({ darkMode = false }) => {
  return (
    <div className="flex items-center">
      <img
        src="/logo_trans.png"
        alt="Ícone Mercatrix"
        className={`w-10 h-10 rounded-lg shadow-md mr-2 ${darkMode ? 'invert' : ''}`}
      />
      <img
        src="/logo.png"
        alt="Logo Mercatrix"
        className={`h-6 ${!darkMode ? 'invert' : ''}`}
      />
    </div>
  );
};

export default Logo;
