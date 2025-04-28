// src/components/Marketplace/CartScreen.jsx
import React from 'react';

const CartScreen = ({ cart, onClose, onUpdateQuantity, onRemove, onCheckout, subtotal, darkMode }) => {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50`}>
      <div className={`w-full max-w-lg max-h-[90vh] rounded-lg shadow-xl overflow-hidden flex flex-col ${
        darkMode ? 'bg-[#1A1A1A]' : 'bg-white'
      }`}>
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between border-gray-700">
          <h2 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
            Carrinho de Compras
            <span className="ml-2 text-sm text-gray-500">({cart.length} {cart.length === 1 ? 'item' : 'itens'})</span>
          </h2>
          <button 
            onClick={onClose}
            className={`p-1 rounded-full ${darkMode ? 'hover:bg-[#333333]' : 'hover:bg-gray-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Seu carrinho está vazio
            </div>
          ) : (
            cart.map((item) => (
              <div 
                key={item.id} 
                className={`flex border-b pb-3 ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}
              >
                {/* Item image */}
                <div className="w-16 h-16 rounded overflow-hidden bg-gray-200 flex-shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${darkMode ? 'bg-[#333333]' : 'bg-gray-100'}`}>
                      <span className={`text-xl ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>📦</span>
                    </div>
                  )}
                </div>
                
                {/* Item details */}
                <div className="ml-4 flex-1">
                  <div className="flex justify-between">
                    <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                      {item.title}
                    </h3>
                    <button
                      onClick={() => onRemove(item.id)}
                      className={`p-1 rounded ${darkMode ? 'text-gray-400 hover:text-red-400' : 'text-gray-500 hover:text-red-500'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.supplier}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </div>
                    
                    {/* Quantity controls */}
                    <div className="flex items-center">
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-l ${
                          darkMode 
                            ? 'bg-[#333333] text-white hover:bg-[#444444]' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        -
                      </button>
                      <div className={`w-8 h-8 flex items-center justify-center ${
                        darkMode
                          ? 'bg-[#222222] text-white'
                          : 'bg-gray-50 text-gray-800'
                      }`}>
                        {item.quantity}
                      </div>
                      <button
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        className={`w-8 h-8 flex items-center justify-center rounded-r ${
                          darkMode 
                            ? 'bg-[#333333] text-white hover:bg-[#444444]' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Footer with total and checkout button */}
        {cart.length > 0 && (
          <div className={`p-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className="flex justify-between items-center mb-4">
              <span className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Subtotal
              </span>
              <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-[#121212]'}`}>
                R$ {subtotal.toFixed(2)}
              </span>
            </div>
            <button
              onClick={onCheckout}
              className={`w-full py-3 px-4 rounded-md font-bold text-white ${
                darkMode ? 'bg-[#2B4FFF] hover:bg-[#3D5AFF]' : 'bg-[#2B4FFF] hover:bg-[#3D5AFF]'
              }`}
            >
              Finalizar Compra
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartScreen;