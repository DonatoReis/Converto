// src/components/Auth/ForgotPasswordModal.jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';

// Form validation schemas
const emailSchema = z.object({
  email: z.string().email('E-mail inválido').min(1, 'E-mail é obrigatório'),
});

const otpSchema = z.object({
  otp: z.string().length(6, 'O código deve ter 6 dígitos'),
  newPassword: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Senhas não conferem',
  path: ['confirmPassword'],
});

const ForgotPasswordModal = ({ onClose, darkMode }) => {
  const { requestPasswordReset, resetPassword } = useAuth();
  const [step, setStep] = useState(1); // 1: email input, 2: OTP verification
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form for email step
  const {
    register: registerEmail,
    handleSubmit: handleSubmitEmail,
    formState: { errors: emailErrors },
  } = useForm({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  // Form for OTP and new password step
  const {
    register: registerOtp,
    handleSubmit: handleSubmitOtp,
    formState: { errors: otpErrors },
    watch,
  } = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmitEmail = async (data) => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await requestPasswordReset(data.email);
      setEmail(data.email);
      setStep(2);
      setMessage({ 
        type: 'success', 
        text: 'Código de recuperação enviado para seu e-mail!' 
      });
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'Falha ao enviar o código. Verifique seu e-mail e tente novamente.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmitOtp = async (data) => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await resetPassword(email, data.otp, data.newPassword);
      setMessage({ 
        type: 'success', 
        text: 'Senha alterada com sucesso! Você já pode fazer login com sua nova senha.' 
      });
      
      // Close modal after 3 seconds on success
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err) {
      setMessage({ 
        type: 'error', 
        text: 'Código inválido ou expirado. Tente novamente.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div 
        className={`w-full max-w-md p-6 rounded-lg shadow-lg ${
          darkMode ? 'bg-[#121212]' : 'bg-white'
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recuperação de Senha</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fechar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {message.text && (
          <div 
            className={`p-3 rounded mb-4 ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            } text-sm`}
          >
            {message.text}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSubmitEmail(onSubmitEmail)} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                placeholder="seu@exemplo.com"
                className={`w-full px-3 py-2 rounded border ${
                  emailErrors.email 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'border-gray-600 bg-gray-800' 
                      : 'border-gray-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-[#2B4FFF]`}
                {...registerEmail('email')}
              />
              {emailErrors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {emailErrors.email.message}
                </p>
              )}
            </div>
            
            <p className="text-sm text-gray-500">
              Digite seu e-mail e enviaremos um código para recuperar sua senha.
            </p>
            
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
                  Enviando...
                </span>
              ) : (
                'Enviar Código'
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmitOtp(onSubmitOtp)} className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium mb-1">
                Código de Verificação
              </label>
              <input
                type="text"
                id="otp"
                placeholder="000000"
                className={`w-full px-3 py-2 rounded border ${
                  otpErrors.otp 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'border-gray-600 bg-gray-800' 
                      : 'border-gray-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-[#2B4FFF]`}
                {...registerOtp('otp')}
                maxLength={6}
              />
              {otpErrors.otp && (
                <p className="mt-1 text-sm text-red-500">
                  {otpErrors.otp.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1">
                Nova Senha
              </label>
              <input
                type="password"
                id="newPassword"
                className={`w-full px-3 py-2 rounded border ${
                  otpErrors.newPassword 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'border-gray-600 bg-gray-800' 
                      : 'border-gray-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-[#2B4FFF]`}
                {...registerOtp('newPassword')}
              />
              {otpErrors.newPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {otpErrors.newPassword.message}
                </p>
              )}
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                id="confirmPassword"
                className={`w-full px-3 py-2 rounded border ${
                  otpErrors.confirmPassword 
                    ? 'border-red-500' 
                    : darkMode 
                      ? 'border-gray-600 bg-gray-800' 
                      : 'border-gray-300 bg-white'
                } focus:outline-none focus:ring-2 focus:ring-[#2B4FFF]`}
                {...registerOtp('confirmPassword')}
              />
              {otpErrors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {otpErrors.confirmPassword.message}
                </p>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className={`flex-1 py-2 px-4 rounded font-medium
                  border ${darkMode ? 'border-gray-600' : 'border-gray-300'}
                  ${darkMode ? 'text-white' : 'text-gray-700'} bg-transparent
                `}
              >
                Voltar
              </button>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`flex-1 py-2 px-4 rounded font-medium
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
                    Confirmando...
                  </span>
                ) : (
                  'Confirmar'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;