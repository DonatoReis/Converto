// src/components/Payments/ConfirmationScreen.jsx
import React from 'react';

const ConfirmationScreen = ({ paymentDetails, onBack, darkMode }) => {
  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center p-4">
      <div className={`w-full max-w-md p-6 rounded-lg ${darkMode ? 'bg-[#1F1F1F]' : 'bg-white'} ${darkMode ? 'shadow-none' : 'shadow-lg'}`}>
        <div className="flex flex-col items-center mb-6">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${darkMode ? 'bg-[#2B4FFF]/20' : 'bg-[#2B4FFF]/10'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            Pagamento bem-sucedido
          </h2>
          <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Sua transação foi processada com sucesso
          </p>
        </div>
        
        <div className={`p-4 rounded-lg mb-6 ${darkMode ? 'bg-[#333333]' : 'bg-gray-50'}`}>
          <div className="mb-4">
            <h3 className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Resumo da transação
            </h3>
            <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
              R$ {paymentDetails.amount.toFixed(2)}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Plano
              </h4>
              <p className={`${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                {paymentDetails.planName}
              </p>
            </div>
            <div>
              <h4 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Data
              </h4>
              <p className={`${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                {paymentDetails.date}
              </p>
            </div>
            <div>
              <h4 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Método
              </h4>
              <p className={`${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                •••• {paymentDetails.cardNumber.substring(paymentDetails.cardNumber.length - 4)}
              </p>
            </div>
            <div>
              <h4 className={`text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                ID da transação
              </h4>
              <p className={`${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                {paymentDetails.transactionId}
              </p>
            </div>
          </div>
        </div>
        
        <div className={`text-sm mb-6 p-4 rounded-lg ${darkMode ? 'bg-[#2B4FFF]/20 text-[#5C78FF]' : 'bg-[#2B4FFF]/10 text-[#2B4FFF]'}`}>
          <p className="flex">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Um comprovante foi enviado para seu e-mail
          </p>
        </div>
        
        <div className="flex space-x-4">
          <button 
            onClick={onBack}
            className={`flex-1 py-2 px-4 rounded-md font-medium ${
              darkMode 
                ? 'bg-[#333333] text-white hover:bg-[#444444]' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Voltar
          </button>
          <button 
            className={`flex-1 py-2 px-4 rounded-md font-medium text-white ${
              darkMode 
                ? 'bg-[#2B4FFF] hover:bg-[#3D5AFF]' 
                : 'bg-[#2B4FFF] hover:bg-[#3D5AFF]'
            }`}
          >
            Ver fatura
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationScreen;