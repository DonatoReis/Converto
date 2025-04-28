// src/components/Auth/LoginForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import ForgotPasswordModal from './ForgotPasswordModal';

// SVG icons for SSO providers
const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512" className="h-5 w-5">
    <path d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
  </svg>
);

const MicrosoftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="h-5 w-5">
    <path d="M0 32h214.6v214.6H0V32zm233.4 0H448v214.6H233.4V32zM0 265.4h214.6V480H0V265.4zm233.4 0H448V480H233.4V265.4z" />
  </svg>
);

const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 496 512" className="h-5 w-5">
    <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
  </svg>
);
// Form validation schema
const loginSchema = z.object({
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
  password: z.string().min(1, 'Senha é obrigatória'),
  rememberMe: z.boolean().optional()
});

const LoginForm = () => {
  const { darkMode } = useTheme();
  const { login, loginWithGoogle, loginWithMicrosoft, loginWithGithub } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError('');
    
    try {
      await login(data.email, data.password, data.rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError('Falha no login. Verifique suas credenciais.');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const openForgotPasswordModal = () => {
    setShowForgotPasswordModal(true);
  };

  const closeForgotPasswordModal = () => {
    setShowForgotPasswordModal(false);
  };

  // SSO login handlers
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err) {
      setError('Falha no login com Google. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await loginWithMicrosoft();
      navigate('/dashboard');
    } catch (err) {
      setError('Falha no login com Microsoft. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGithubLogin = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      await loginWithGithub();
      navigate('/dashboard');
    } catch (err) {
      setError('Falha no login com GitHub. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Email field */}
        <div>
          <label htmlFor="email" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            E-mail
          </label>
          <input
            type="email"
            id="email"
            placeholder="seu@exemplo.com"
            className={`w-full px-3 py-2 rounded border ${
              errors.email 
                ? 'border-red-500' 
                : darkMode 
                  ? 'border-[#666666] bg-[#1A1A1A] text-white placeholder-[#666666]' 
                  : 'border-[#2B4FFF] bg-white text-[#121212] placeholder-[#666666]'
            } focus:outline-none focus:ring-2 focus:ring-[#2B4FFF]`}
            {...register('email')}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
          )}
        </div>

        {/* Password field */}
        <div>
          <label htmlFor="password" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            Senha
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className={`w-full px-3 py-2 rounded border ${
                errors.password 
                  ? 'border-red-500' 
                  : darkMode 
                    ? 'border-[#666666] bg-[#1A1A1A] text-white placeholder-[#666666]' 
                    : 'border-[#2B4FFF] bg-white text-[#121212] placeholder-[#666666]'
              } focus:outline-none focus:ring-2 focus:ring-[#2B4FFF]`}
              {...register('password')}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-[#666666]' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-[#666666]' : 'text-gray-500'}`} viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
          )}
        </div>

        {/* Remember me & Forgot password */}
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="rememberMe"
              type="checkbox"
              className="h-4 w-4 rounded border-[#666666] text-[#2B4FFF] focus:ring-[#2B4FFF]"
              {...register('rememberMe')}
            />
            <label htmlFor="rememberMe" className={`ml-2 block text-sm ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Lembrar-me
            </label>
          </div>
          <div>
            <button
              type="button"
              onClick={openForgotPasswordModal}
              className={`text-sm font-medium ${darkMode ? 'text-[#5C78FF]' : 'text-[#2B4FFF]'} hover:underline`}
            >
              Esqueci minha senha
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 rounded bg-red-100 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Login button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-2 px-4 rounded font-medium
            ${darkMode ? 'bg-[#2B4FFF] hover:bg-[#3D2AFF]' : 'bg-[#2B4FFF] hover:bg-[#3D2AFF]'}
            text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B4FFF]
            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Entrando...
            </span>
          ) : (
            'Entrar'
          )}
        </button>
      </form>

      {/* Forgot Password Modal */}
      {showForgotPasswordModal && (
        <ForgotPasswordModal onClose={closeForgotPasswordModal} darkMode={darkMode} />
      )}
      
      {/* SSO Login Section */}
      <div className="mt-6">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className={`w-full border-t ${darkMode ? 'border-gray-700' : 'border-gray-300'}`}></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className={`px-2 ${darkMode ? 'bg-[#121212] text-gray-400' : 'bg-white text-gray-500'}`}>
              Ou continue com
            </span>
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-3">
          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              darkMode 
                ? 'bg-[#1A1A1A] text-white hover:bg-gray-800' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B4FFF]`}
          >
            <GoogleIcon />
          </button>
          
          {/* Microsoft Login Button */}
          <button
            type="button"
            onClick={handleMicrosoftLogin}
            disabled={isLoading}
            className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              darkMode 
                ? 'bg-[#1A1A1A] text-white hover:bg-gray-800' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B4FFF]`}
          >
            <MicrosoftIcon />
          </button>
          
          {/* GitHub Login Button */}
          <button
            type="button"
            onClick={handleGithubLogin}
            disabled={isLoading}
            className={`w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium ${
              darkMode 
                ? 'bg-[#1A1A1A] text-white hover:bg-gray-800' 
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2B4FFF]`}
          >
            <GithubIcon />
          </button>
        </div>
      </div>
    </>
  );
};

export default LoginForm;