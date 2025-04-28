// src/utils/addressLookup.js
/**
 * Utility functions for CEP (Brazilian postal code) validation and lookup
 */

// Function to validate CEP format
const validateCEP = (cep) => {
  // Remove non-numeric characters
  cep = cep.replace(/\D/g, '');
  
  // CEP must have exactly 8 digits
  return cep.length === 8;
};

// Function to format CEP (00000-000)
const formatCEP = (cep) => {
  cep = cep.replace(/\D/g, '');
  return cep.replace(/(\d{5})(\d{3})/, "$1-$2");
};

// Function to fetch address data from CEP
const fetchAddressByCEP = async (cep) => {
  try {
    // Clean CEP to remove special characters
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (!validateCEP(cleanCEP)) {
      throw new Error('CEP inválido');
    }
    
    // Using the BrasilAPI 
    const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${cleanCEP}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CEP não encontrado');
      }
      throw new Error(`Erro ao buscar CEP: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return {
      zipCode: formatCEP(cleanCEP),
      street: data.street || data.logradouro || '',
      complement: '',  // BrasilAPI doesn't return complement directly
      neighborhood: data.neighborhood || data.bairro || '',
      city: data.city || data.localidade || '',
      state: data.state || data.uf || '',
      ibge: data.ibge || '',
      gia: '',  // BrasilAPI doesn't return gia
      ddd: data.ddd || '',
      siafi: ''  // BrasilAPI doesn't return siafi
    };
  } catch (error) {
    console.error('Erro ao buscar endereço:', error);
    throw error;
  }
};

export {
  validateCEP,
  formatCEP,
  fetchAddressByCEP
};