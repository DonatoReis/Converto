// src/screens/RegisterScreen.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import RegisterForm from '../components/Auth/RegisterForm';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';

const RegisterScreen = () => {
  const { darkMode } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col justify-center items-center p-4 ${darkMode ? 'bg-[#1A1A1A] text-white' : 'bg-[#F7F7FF] text-[#121212]'}`}>
      <div className={`absolute top-4 right-4`}>
        <ThemeToggle />
      </div>
      
      <div className={`w-full max-w-md p-6 rounded-lg shadow-lg ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
        <div className="flex justify-center mb-8">
          <Logo darkMode={darkMode} />
        </div>
        
        <h1 className="text-2xl font-bold mb-6 text-center">Criar Conta</h1>
        
        <RegisterForm />
        
        <div className="mt-6 text-center">
          <p>
            Já tem uma conta?{' '}
            <Link 
              to="/login" 
              className={`font-medium ${darkMode ? 'text-[#64DFDF]' : 'text-[#340068]'} hover:underline`}
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterScreen;