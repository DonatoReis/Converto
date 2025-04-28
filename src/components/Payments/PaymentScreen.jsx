// src/components/Payments/PaymentScreen.jsx
import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import PaymentForm from './PaymentForm';
import ConfirmationScreen from './ConfirmationScreen';

const PaymentScreen = () => {
  const { darkMode } = useTheme();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(149.90);
  const [paymentDetails, setPaymentDetails] = useState(null);
  
  // Mock payment plans
  const paymentPlans = [
    { id: 1, name: 'Plano Básico', price: 149.90, features: ['Até 50 contatos', 'Acesso básico ao marketplace', '3 matches por mês'] },
    { id: 2, name: 'Plano Profissional', price: 299.90, features: ['Até 200 contatos', 'Acesso completo ao marketplace', '10 matches por mês', 'Suporte prioritário'] },
    { id: 3, name: 'Plano Enterprise', price: 599.90, features: ['Contatos ilimitados', 'Acesso VIP ao marketplace', 'Matches ilimitados', 'Suporte 24/7', 'API de integração'] }
  ];

  const [selectedPlan, setSelectedPlan] = useState(paymentPlans[0]);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setPaymentAmount(plan.price);
  };

  const handlePaymentSubmit = (formData) => {
    // In a real app, this would process the payment via Stripe/Pagar.me
    console.log('Processing payment:', formData);
    
    // Store payment details for confirmation screen
    setPaymentDetails({
      ...formData,
      amount: paymentAmount,
      planName: selectedPlan.name,
      date: new Date().toLocaleDateString(),
      transactionId: Math.random().toString(36).substr(2, 9).toUpperCase()
    });
    
    // Show confirmation screen
    setShowConfirmation(true);
  };

  return (
    <div className={`h-full flex flex-col ${darkMode ? 'bg-[#121212]' : 'bg-white'}`}>
      {/* Header */}
      <div className={`px-6 py-4 ${darkMode ? 'bg-[#1A1A1A]' : 'bg-[#F7F7FF]'} border-b ${darkMode ? 'border-[#333333]' : 'border-[#E5E7EB]'}`}>
        <div className="flex justify-between items-center">
          <div>
            <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Pagamento & Faturamento
            </h1>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Gerencie seus planos e métodos de pagamento
            </p>
          </div>
          <div className={`px-3 py-1 rounded-full flex items-center ${darkMode ? 'bg-[#232323]' : 'bg-gray-100'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${darkMode ? 'text-green-400' : 'text-green-600'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className={`ml-1 text-xs font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>Seguro</span>
          </div>
        </div>
      </div>
      
      {showConfirmation ? (
        <ConfirmationScreen 
          paymentDetails={paymentDetails}
          onBack={() => setShowConfirmation(false)}
          darkMode={darkMode}
        />
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Plan selection */}
          <div className={`p-6 border-b ${darkMode ? 'border-[#333333]' : 'border-gray-200'}`}>
            <h2 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              Escolha seu plano
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {paymentPlans.map((plan) => {
                const isSelected = selectedPlan.id === plan.id;
                const isPro = plan.id === 2;
                const isEnterprise = plan.id === 3;
                
                return (
                  <div 
                    key={plan.id}
                    onClick={() => handleSelectPlan(plan)}
                    className={`relative p-6 rounded-xl cursor-pointer transition-all transform hover:scale-[1.02] ${
                      isSelected
                        ? darkMode 
                          ? 'bg-[#2B4FFF]/20 border-2 border-[#2B4FFF] shadow-[0_0_15px_rgba(43,79,255,0.3)]' 
                          : 'bg-[#2B4FFF]/10 border-2 border-[#2B4FFF] shadow-lg'
                        : darkMode
                          ? 'bg-[#1F1F1F] border border-[#333333] hover:bg-[#282828]'
                          : 'bg-white border border-gray-200 hover:bg-gray-50 shadow-md'
                    }`}
                  >
                    {isPro && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs font-bold">
                        Mais Popular
                      </span>
                    )}
                    {isEnterprise && (
                      <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold">
                        Máximo Valor
                      </span>
                    )}
                    
                    <div className="flex justify-between items-start">
                      <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                        {plan.name}
                      </h3>
                      {isSelected && (
                        <div className={`p-1 rounded-full ${darkMode ? 'bg-[#2B4FFF]' : 'bg-[#2B4FFF]'}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-baseline mt-3 mb-5">
                      <span className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                        R$ {plan.price.toFixed(2)}
                      </span>
                      <span className={`text-sm ml-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        /mês
                      </span>
                    </div>
                    
                    <div className={`h-[1px] w-full my-4 ${darkMode ? 'bg-[#333333]' : 'bg-gray-200'}`}></div>
                    
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <div className={`flex-shrink-0 p-1 rounded-full mr-2 ${isSelected ? 'bg-green-500/20' : darkMode ? 'bg-[#333333]' : 'bg-gray-100'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Payment Form */}
          <PaymentForm 
            onSubmit={handlePaymentSubmit}
            amount={paymentAmount}
            darkMode={darkMode}
          />
        </div>
      )}
    </div>
  );
};

export default PaymentScreen;