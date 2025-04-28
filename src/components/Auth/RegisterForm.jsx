// src/components/Auth/RegisterForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { fetchAddressByCEP, formatCEP, validateCEP } from '../../utils/addressLookup';
import { fetchCNPJData, formatDocument } from '../../utils/documentLookup';

// Form validation schema
const registerSchema = z.object({
  fullName: z.string().min(3, 'Nome completo deve ter pelo menos 3 caracteres'),
  company: z.string().min(2, 'Nome da empresa é obrigatório'),
  document: z
    .string()
    .min(11, 'CPF/CNPJ deve ter pelo menos 11 dígitos')
    .refine(
      (value) => {
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length === 11 || digitsOnly.length === 14;
      },
      {
        message: 'Formato inválido. Use um CPF (11 dígitos) ou CNPJ (14 dígitos) válido',
      }
    ),
  phone: z
    .string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .refine(
      (value) => {
        const digitsOnly = value.replace(/\D/g, '');
        return digitsOnly.length >= 10 && digitsOnly.length <= 11;
      },
      {
        message: 'Formato inválido. Use (00) 00000-0000',
      }
    ),
  email: z.string().email('E-mail inválido'),
  password: z
    .string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .regex(/[0-9]/, 'Senha deve conter pelo menos um número')
    .regex(/[^A-Za-z0-9]/, 'Senha deve conter pelo menos um caractere especial'),
  // Address fields
  cep: z.string().optional(),
  street: z.string().optional(),
  number: z.string().optional(),
  complement: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

const RegisterForm = () => {
  const { darkMode } = useTheme();
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      company: '',
      document: '',
      phone: '',
      email: '',
      password: '',
      // Address fields
      cep: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
    },
  });

  // Format document (CPF/CNPJ) as user types and fetch data for auto-fill
  const handleDocumentChange = async (e) => {
    // First format the document
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 11) {
      // CPF format: 000.000.000-00
      value = value
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    } else {
      // CNPJ format: 00.000.000/0000-00
      value = value
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }
    
    e.target.value = value;
    
    // Then fetch CNPJ data if it's a complete CNPJ
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 14) {
      try {
        setIsLoading(true);
        const cnpjData = await fetchCNPJData(cleanValue);
        
        // Auto-fill company related fields
        setValue('company', cnpjData.fantasia || cnpjData.name);
        setValue('email', cnpjData.email || watch('email'));
        setValue('phone', cnpjData.phone || watch('phone'));
        
        // Auto-fill address fields if available
        if (cnpjData.address) {
          setValue('cep', cnpjData.address.zipCode || '');
          setValue('street', cnpjData.address.street || '');
          setValue('number', cnpjData.address.number || '');
          setValue('complement', cnpjData.address.complement || '');
          setValue('neighborhood', cnpjData.address.neighborhood || '');
          setValue('city', cnpjData.address.city || '');
          setValue('state', cnpjData.address.state || '');
        }
      } catch (error) {
        console.error('Erro ao buscar dados do CNPJ:', error);
        // Don't show error to the user as this is just auto-fill functionality
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Format CEP as 00000-000 and fetch address data
  const handleCEPChange = async (e) => {
    // Format the CEP
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/^(\d{5})(\d{3})$/, '$1-$2');
    e.target.value = value;
    
    // Fetch address data if it's a complete CEP (8 digits)
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 8 && validateCEP(cleanValue)) {
      try {
        setIsLoading(true);
        const addressData = await fetchAddressByCEP(cleanValue);
        
        // Auto-fill address fields
        setValue('street', addressData.street || '');
        setValue('neighborhood', addressData.neighborhood || '');
        setValue('city', addressData.city || '');
        setValue('state', addressData.state || '');
        
        // Focus on the number field (which is typically the next field to fill)
        document.getElementById('number')?.focus();
      } catch (error) {
        console.error('Erro ao buscar endereço:', error);
        // Don't show error to the user as this is just auto-fill functionality
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Format phone as (00) 00000-0000
  const formatPhone = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    
    if (value.length <= 10) {
      value = value
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    } else {
      value = value
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    e.target.value = value;
  };

  // OnSubmit handler for form submission
  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setError('');
      
      // Call the register function from auth context
      await registerUser({
        fullName: data.fullName,
        company: data.company,
        document: data.document,
        phone: data.phone,
        email: data.email,
        password: data.password,
        // Include address data
        address: {
          cep: data.cep,
          street: data.street,
          number: data.number,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state
        }
      });
      
      // Navigate to dashboard on success
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.message || 'Erro ao registrar. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      {/* Display error message if there is one */}
      {error && (
        <div className="col-span-2 p-3 bg-red-100 text-red-600 rounded-md">
          {error}
        </div>
      )}
      
      {/* Full Name field */}
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-1">
          Nome Completo
        </label>
        <input
          type="text"
          id="fullName"
          className={`w-full px-3 py-2 rounded border ${
            errors.fullName 
              ? 'border-red-500' 
              : darkMode 
                ? 'border-gray-600 bg-gray-800' 
                : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      {/* Company field */}
      <div>
        <label htmlFor="company" className="block text-sm font-medium mb-1">
          Empresa
        </label>
        <input
          type="text"
          id="company"
          className={`w-full px-3 py-2 rounded border ${
            errors.company 
              ? 'border-red-500' 
              : darkMode 
                ? 'border-gray-600 bg-gray-800' 
                : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
          {...register('company')}
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-500">{errors.company.message}</p>
        )}
      </div>

      {/* Document field (CPF/CNPJ) */}
      <div>
        <label htmlFor="document" className="block text-sm font-medium mb-1">
          CNPJ/CPF
        </label>
        <input
          type="text"
          id="document"
          className={`w-full px-3 py-2 rounded border ${
            errors.document 
              ? 'border-red-500' 
              : darkMode 
                ? 'border-gray-600 bg-gray-800' 
                : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
          {...register('document')}
          onInput={handleDocumentChange}
          maxLength={18} // Max length for formatted CNPJ
        />
        {errors.document && (
          <p className="mt-1 text-sm text-red-500">{errors.document.message}</p>
        )}
      </div>

      {/* Phone field */}
      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-1">
          Telefone (WhatsApp)
        </label>
        <input
          type="tel"
          id="phone"
          className={`w-full px-3 py-2 rounded border ${
            errors.phone 
              ? 'border-red-500' 
              : darkMode 
                ? 'border-gray-600 bg-gray-800' 
                : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
          {...register('phone')}
          onInput={formatPhone}
          maxLength={15} // Max length for formatted phone
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>
        )}
      </div>

      {/* Email field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-1">
          E-mail
        </label>
        <input
          type="email"
          id="email"
          className={`w-full px-3 py-2 rounded border ${
            errors.email 
              ? 'border-red-500' 
              : darkMode 
                ? 'border-gray-600 bg-gray-800' 
                : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
          {...register('email')}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      {/* Address section heading */}
      <div className="col-span-2 mt-4 mb-2">
        <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
          Endereço
        </h3>
      </div>

      {/* CEP field */}
      <div>
        <label htmlFor="cep" className="block text-sm font-medium mb-1">
          CEP
        </label>
        <input
          type="text"
          id="cep"
          className={`w-full px-3 py-2 rounded border ${
            errors.cep 
              ? 'border-red-500' 
              : darkMode 
                ? 'border-gray-600 bg-gray-800' 
                : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
          {...register('cep')}
          onInput={handleCEPChange}
          maxLength={9} // Max length for formatted CEP (00000-000)
          placeholder="00000-000"
        />
        {errors.cep && (
          <p className="mt-1 text-sm text-red-500">{errors.cep.message}</p>
        )}
      </div>

      {/* Street and Number fields in one row */}
      <div className="col-span-2 grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label htmlFor="street" className="block text-sm font-medium mb-1">
            Rua/Avenida
          </label>
          <input
            type="text"
            id="street"
            className={`w-full px-3 py-2 rounded border ${
              errors.street 
                ? 'border-red-500' 
                : darkMode 
                  ? 'border-gray-600 bg-gray-800' 
                  : 'border-gray-300 bg-white'
            } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
            {...register('street')}
          />
          {errors.street && (
            <p className="mt-1 text-sm text-red-500">{errors.street.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="number" className="block text-sm font-medium mb-1">
            Número
          </label>
          <input
            type="text"
            id="number"
            className={`w-full px-3 py-2 rounded border ${
              errors.number 
                ? 'border-red-500' 
                : darkMode 
                  ? 'border-gray-600 bg-gray-800' 
                  : 'border-gray-300 bg-white'
            } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
            {...register('number')}
          />
          {errors.number && (
            <p className="mt-1 text-sm text-red-500">{errors.number.message}</p>
          )}
        </div>
      </div>

      {/* Complement field */}
      <div>
        <label htmlFor="complement" className="block text-sm font-medium mb-1">
          Complemento
        </label>
        <input
          type="text"
          id="complement"
          className={`w-full px-3 py-2 rounded border ${
            errors.complement 
              ? 'border-red-500' 
              : darkMode 
                ? 'border-gray-600 bg-gray-800' 
                : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
          {...register('complement')}
        />
        {errors.complement && (
          <p className="mt-1 text-sm text-red-500">{errors.complement.message}</p>
        )}
      </div>

      {/* Neighborhood field */}
      <div>
        <label htmlFor="neighborhood" className="block text-sm font-medium mb-1">
          Bairro
        </label>
        <input
          type="text"
          id="neighborhood"
          className={`w-full px-3 py-2 rounded border ${
            errors.neighborhood 
              ? 'border-red-500' 
              : darkMode 
                ? 'border-gray-600 bg-gray-800' 
                : 'border-gray-300 bg-white'
          } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
          {...register('neighborhood')}
        />
        {errors.neighborhood && (
          <p className="mt-1 text-sm text-red-500">{errors.neighborhood.message}</p>
        )}
      </div>

      {/* City and State fields in one row */}
      <div className="col-span-2 grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <label htmlFor="city" className="block text-sm font-medium mb-1">
            Cidade
          </label>
          <input
            type="text"
            id="city"
            className={`w-full px-3 py-2 rounded border ${
              errors.city 
                ? 'border-red-500' 
                : darkMode 
                  ? 'border-gray-600 bg-gray-800' 
                  : 'border-gray-300 bg-white'
            } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
            {...register('city')}
          />
          {errors.city && (
            <p className="mt-1 text-sm text-red-500">{errors.city.message}</p>
          )}
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium mb-1">
            Estado
          </label>
          <input
            type="text"
            id="state"
            className={`w-full px-3 py-2 rounded border ${
              errors.state 
                ? 'border-red-500' 
                : darkMode 
                  ? 'border-gray-600 bg-gray-800' 
                  : 'border-gray-300 bg-white'
            } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
            {...register('state')}
            maxLength={2}
          />
          {errors.state && (
            <p className="mt-1 text-sm text-red-500">{errors.state.message}</p>
          )}
        </div>
      </div>

      {/* Password field */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium mb-1">
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
                  ? 'border-gray-600 bg-gray-800' 
                  : 'border-gray-300 bg-white'
            } focus:outline-none focus:ring-2 focus:ring-[#340068]`}
            {...register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411M21 21l-6-6" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>
      
      {/* Submit button */}
      <button
        type="submit"
        disabled={!isValid || isLoading}
        className={`
          col-span-2 mt-4 px-6 py-3 rounded-lg font-medium
          ${
            !isValid || isLoading
              ? 'bg-gray-500 cursor-not-allowed'
              : darkMode
                ? 'bg-[#340068] hover:bg-[#450680]'
                : 'bg-[#340068] hover:bg-[#450680]'
          }
          text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#340068]
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Registrando...
          </span>
        ) : (
          'Registrar'
        )}
      </button>
    </form>
  );
};

export default RegisterForm;