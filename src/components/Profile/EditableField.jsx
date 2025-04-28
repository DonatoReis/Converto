// src/components/Profile/EditableField.jsx
import React, { useState } from 'react';

const EditableField = ({ label, value, type = 'text', onSave, darkMode }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [isSaving, setIsSaving] = useState(false);
  
  const handleEdit = () => {
    setInputValue(value);
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setInputValue(value);
  };
  
  const handleSave = () => {
    if (inputValue.trim() === '') return;
    
    setIsSaving(true);
    
    // Simulate API call delay
    setTimeout(() => {
      onSave(inputValue);
      setIsEditing(false);
      setIsSaving(false);
    }, 500);
  };
  
  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {label}
      </label>
      
      {isEditing ? (
        <div>
          <input
            type={type}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`block w-full rounded-md mb-2 ${
              darkMode 
                ? 'bg-[#333333] border-[#444444] text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:ring-2 focus:ring-[#2B4FFF] focus:border-[#2B4FFF]`}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                darkMode 
                  ? 'bg-[#333333] text-gray-300 hover:bg-[#444444]' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-3 py-1 rounded text-sm text-white transition-colors ${
                darkMode 
                  ? 'bg-[#2B4FFF] hover:bg-[#3D5AFF]' 
                  : 'bg-[#2B4FFF] hover:bg-[#3D5AFF]'
              } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Salvando
                </span>
              ) : 'Salvar'}
            </button>
          </div>
        </div>
      ) : (
        <div className={`flex justify-between items-center p-3 rounded-md ${
          darkMode ? 'bg-[#333333] hover:bg-[#3A3A3A]' : 'bg-gray-50 hover:bg-gray-100'
        }`}>
          <span className={darkMode ? 'text-white' : 'text-[#121212]'}>
            {value}
          </span>
          <button 
            onClick={handleEdit}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

export default EditableField;