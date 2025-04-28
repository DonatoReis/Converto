// src/components/Payments/PaymentForm.jsx
import React, { useState } from 'react';

const PaymentForm = ({ onSubmit, amount, darkMode }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    saveCard: false,
  });
  
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };
  
  const formatCardNumber = (value) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add spaces after every 4 digits
    let formatted = '';
    for (let i = 0; i < digits.length; i++) {
      if (i > 0 && i % 4 === 0) {
        formatted += ' ';
      }
      formatted += digits[i];
    }
    
    return formatted.substring(0, 19); // limit to 16 digits + 3 spaces
  };
  
  const formatExpiryDate = (value) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');
    
    // Add slash after first 2 digits
    if (digits.length > 2) {
      return digits.substring(0, 2) + '/' + digits.substring(2, 4);
    }
    
    return digits;
  };
  
  const handleCardNumberChange = (e) => {
    e.target.value = formatCardNumber(e.target.value);
    handleChange(e);
  };
  
  const handleExpiryDateChange = (e) => {
    e.target.value = formatExpiryDate(e.target.value);
    handleChange(e);
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.cardNumber.trim() || formData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Número de cartão inválido';
    }
    
    if (!formData.cardName.trim()) {
      newErrors.cardName = 'Nome é obrigatório';
    }
    
    if (!formData.expiryDate.trim() || !/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
      newErrors.expiryDate = 'Data inválida';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const currentYear = new Date().getFullYear() % 100;
      const currentMonth = new Date().getMonth() + 1;
      
      if (parseInt(year) < currentYear || 
          (parseInt(year) === currentYear && parseInt(month) < currentMonth) ||
          parseInt(month) > 12 || parseInt(month) < 1) {
        newErrors.expiryDate = 'Data expirada';
      }
    }
    
    if (!formData.cvv.trim() || formData.cvv.length < 3) {
      newErrors.cvv = 'CVV inválido';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      setIsProcessing(true);
      
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        onSubmit(formData);
      }, 1500);
    }
  };
  
  return (
    <div className="p-6">
      <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
        Dados de pagamento
      </h2>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Número do cartão
          </label>
          <div className={`relative rounded-md shadow-sm`}>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <input
              type="text"
              name="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={formData.cardNumber}
              onChange={handleCardNumberChange}
              className={`pl-10 block w-full rounded-md ${
                darkMode 
                  ? 'bg-[#333333] border-[#444444] text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } ${errors.cardNumber ? (darkMode ? 'border-red-500' : 'border-red-500') : ''} focus:ring-2 focus:ring-[#2B4FFF] focus:border-[#2B4FFF]`}
            />
          </div>
          {errors.cardNumber && <p className="mt-1 text-sm text-red-500">{errors.cardNumber}</p>}
        </div>
        
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Nome no cartão
          </label>
          <input
            type="text"
            name="cardName"
            placeholder="NOME COMO APARECE NO CARTÃO"
            value={formData.cardName}
            onChange={handleChange}
            className={`block w-full rounded-md ${
              darkMode 
                ? 'bg-[#333333] border-[#444444] text-white placeholder-gray-500' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
            } ${errors.cardName ? (darkMode ? 'border-red-500' : 'border-red-500') : ''} focus:ring-2 focus:ring-[#2B4FFF] focus:border-[#2B4FFF]`}
          />
          {errors.cardName && <p className="mt-1 text-sm text-red-500">{errors.cardName}</p>}
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Data de validade
            </label>
            <input
              type="text"
              name="expiryDate"
              placeholder="MM/YY"
              value={formData.expiryDate}
              onChange={handleExpiryDateChange}
              maxLength={5}
              className={`block w-full rounded-md ${
                darkMode 
                  ? 'bg-[#333333] border-[#444444] text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } ${errors.expiryDate ? (darkMode ? 'border-red-500' : 'border-red-500') : ''} focus:ring-2 focus:ring-[#2B4FFF] focus:border-[#2B4FFF]`}
            />
            {errors.expiryDate && <p className="mt-1 text-sm text-red-500">{errors.expiryDate}</p>}
          </div>
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              CVV
            </label>
            <input
              type="password"
              name="cvv"
              placeholder="123"
              value={formData.cvv}
              onChange={handleChange}
              maxLength={4}
              className={`block w-full rounded-md ${
                darkMode 
                  ? 'bg-[#333333] border-[#444444] text-white placeholder-gray-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
              } ${errors.cvv ? (darkMode ? 'border-red-500' : 'border-red-500') : ''} focus:ring-2 focus:ring-[#2B4FFF] focus:border-[#2B4FFF]`}
            />
            {errors.cvv && <p className="mt-1 text-sm text-red-500">{errors.cvv}</p>}
          </div>
        </div>
        
        <div className="mb-6">
          <label className={`flex items-center ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            <input
              type="checkbox"
              name="saveCard"
              checked={formData.saveCard}
              onChange={handleChange}
              className={`rounded text-[#2B4FFF] focus:ring-[#2B4FFF] ${darkMode ? 'bg-[#333333] border-[#444444]' : ''}`}
            />
            <span className="ml-2 text-sm">Salvar cartão para futuras compras</span>
          </label>
        </div>
        
        <div className="py-4 border-t border-b mb-6 flex justify-between items-center">
          <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            Total a pagar:
          </span>
          <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            R$ {amount.toFixed(2)}
          </span>
        </div>
        
        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full py-3 px-4 rounded-md font-bold text-white transition-colors ${
            darkMode 
              ? 'bg-[#2B4FFF] hover:bg-[#3D5AFF] disabled:bg-[#333333] disabled:text-gray-500' 
              : 'bg-[#2B4FFF] hover:bg-[#3D5AFF] disabled:bg-gray-300 disabled:text-gray-500'
          }`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processando pagamento...
            </span>
          ) : (
            `Pagar R$ ${amount.toFixed(2)}`
          )}
        </button>
        
        <div className="mt-4 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <span className={`ml-2 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Pagamento seguro e criptografado
          </span>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;