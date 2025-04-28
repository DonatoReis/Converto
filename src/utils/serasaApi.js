/**
 * SERASA API Integration Utility
 * 
 * This utility provides functions to interact with SERASA's API for CPF validation
 * and credit score retrieval. It handles authentication, request formation, and
 * response parsing, while providing comprehensive error handling.
 * 
 * For demo purposes, we use mock implementations where actual API calls would be made.
 */

import APIConfig from './apiConfig';

// Validation helpers
const CPF_REGEX = /^\d{3}\.\d{3}\.\d{3}-\d{2}$|^\d{11}$/;

/**
 * Format a CPF number to standard format (XXX.XXX.XXX-XX)
 * @param {string} cpf - CPF number (with or without formatting)
 * @returns {string} - Formatted CPF
 */
export const formatCPF = (cpf) => {
  if (!cpf) return '';
  
  // Remove any non-numeric characters
  const cleaned = cpf.replace(/\D/g, '');
  
  // Check if we have 11 digits
  if (cleaned.length !== 11) {
    return cpf; // Return original if not valid
  }
  
  // Format as XXX.XXX.XXX-XX
  return `${cleaned.substring(0, 3)}.${cleaned.substring(3, 6)}.${cleaned.substring(6, 9)}-${cleaned.substring(9, 11)}`;
};

/**
 * Validate CPF format (without making API call)
 * @param {string} cpf - CPF number to validate
 * @returns {boolean} - Is valid format
 */
export const validateCPFFormat = (cpf) => {
  if (!cpf) return false;
  
  // Remove any non-numeric characters for validation
  const cleaned = cpf.replace(/\D/g, '');
  
  // Basic validation
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid patterns (all same digit)
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Calculate first verification digit
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = sum % 11;
  let dv1 = remainder < 2 ? 0 : 11 - remainder;
  
  // Calculate second verification digit
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = sum % 11;
  let dv2 = remainder < 2 ? 0 : 11 - remainder;
  
  // Check if verification digits match
  return (parseInt(cleaned.charAt(9)) === dv1 && parseInt(cleaned.charAt(10)) === dv2);
};

/**
 * Validate CPF with SERASA API
 * @param {string} cpf - CPF number to validate
 * @returns {Promise<Object>} - Validation result
 */
export const validateCPF = async (cpf) => {
  try {
    // First, validate format locally
    if (!validateCPFFormat(cpf)) {
      return {
        valid: false,
        error: 'CPF format is invalid',
        details: null
      };
    }
    
    // Get credentials and prepare headers
    const credentials = APIConfig.getCredentials('serasa');
    if (!credentials) {
      throw new Error('Failed to retrieve SERASA API credentials');
    }
    
    const headers = APIConfig.getAuthHeaders('serasa');
    
    // In a real app, make an actual API call
    // For demo purposes, simulate API response
    const cleaned = cpf.replace(/\D/g, '');
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // For demo, we'll return mock data based on the CPF
    // In a real implementation, this would be a fetch call to the SERASA API
    console.log(`SERASA API: Validating CPF ${formatCPF(cpf)}`);
    
    // Mock response for demo
    return {
      valid: true,
      cpf: formatCPF(cleaned),
      status: 'REGULAR',
      lastCheck: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error validating CPF with SERASA:', error);
    return {
      valid: false,
      error: error.message || 'Error validating CPF',
      details: null
    };
  }
};

/**
 * Get credit score from SERASA
 * @param {string} cpf - CPF number to check
 * @returns {Promise<Object>} - Credit score data
 */
export const getScore = async (cpf) => {
  try {
    // First validate the CPF
    const validationResult = await validateCPF(cpf);
    if (!validationResult.valid) {
      throw new Error(validationResult.error || 'Invalid CPF');
    }
    
    // Get credentials
    const credentials = APIConfig.getCredentials('serasa');
    if (!credentials) {
      throw new Error('Failed to retrieve SERASA API credentials');
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    console.log(`SERASA API: Retrieving credit score for CPF ${formatCPF(cpf)}`);
    
    // In a real implementation, this would call the actual SERASA API
    // Generate a deterministic but random-looking score based on the CPF
    const cpfSum = cpf.replace(/\D/g, '').split('').reduce((sum, digit) => sum + parseInt(digit), 0);
    const scoreBase = (cpfSum * 17) % 1000;
    const score = Math.min(Math.max(scoreBase, 1), 1000);
    
    // Score categories
    let category;
    if (score < 300) category = 'Baixo';
    else if (score < 500) category = 'Regular';
    else if (score < 700) category = 'Bom';
    else if (score < 900) category = 'Muito Bom';
    else category = 'Excelente';
    
    // Mock response for demo
    return {
      cpf: formatCPF(cpf),
      score: score,
      category: category,
      max_score: 1000,
      lastUpdated: new Date().toISOString(),
      factors: [
        {
          type: 'positive',
          description: 'Pagamentos em dia nos últimos 12 meses'
        },
        {
          type: score < 500 ? 'negative' : 'positive',
          description: score < 500 ? 'Consultas recentes ao CPF' : 'Poucas consultas recentes ao CPF'
        },
        {
          type: score < 700 ? 'neutral' : 'positive',
          description: 'Tempo de histórico de crédito'
        }
      ],
      pendingIssues: score < 500 ? 2 : 0,
      recommendations: [
        'Mantenha seus pagamentos em dia',
        'Evite múltiplas consultas de crédito em curto período',
        'Mantenha sua utilização de crédito abaixo de 30% do limite'
      ]
    };
  } catch (error) {
    console.error('Error retrieving credit score from SERASA:', error);
    return {
      error: error.message || 'Error retrieving credit score',
      details: null
    };
  }
};

/**
 * Get detailed CPF information from SERASA
 * @param {string} cpf - CPF number to check
 * @returns {Promise<Object>} - Detailed person information
 */
export const getDetailedInfo = async (cpf) => {
  try {
    // First validate the CPF
    const validationResult = await validateCPF(cpf);
    if (!validationResult.valid) {
      throw new Error(validationResult.error || 'Invalid CPF');
    }
    
    // Get credentials
    const credentials = APIConfig.getCredentials('serasa');
    if (!credentials) {
      throw new Error('Failed to retrieve SERASA API credentials');
    }
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log(`SERASA API: Retrieving detailed information for CPF ${formatCPF(cpf)}`);
    
    // In a real implementation, this would call the actual SERASA API
    // For demo purposes, generate mock data
    const cleaned = cpf.replace(/\D/g, '');
    
    // Generate a deterministic but seemingly random name
    const firstNames = ['João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Luiza', 'Miguel', 'Sofia'];
    const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Ferreira', 'Pereira', 'Almeida'];
    
    const nameIndex = (parseInt(cleaned.substring(0, 3)) % firstNames.length);
    const surnameIndex = (parseInt(cleaned.substring(3, 6)) % lastNames.length);
    
    const fullName = `${firstNames[nameIndex]} ${lastNames[surnameIndex]}`;
    
    // Use digits to create a plausible birthdate
    const year = 1960 + (parseInt(cleaned.substring(6, 8)) % 50); // births between 1960-2010
    const month = 1 + (parseInt(cleaned.substring(8, 9)) % 12);
    const day = 1 + (parseInt(cleaned.substring(9, 11)) % 28);
    
    const birthDate = new Date(year, month - 1, day);
    
    // Mock response for demo
    return {
      cpf: formatCPF(cleaned),
      name: fullName,
      birthDate: birthDate.toISOString().split('T')[0],
      mother: `Mãe de ${fullName}`,
      status: 'REGULAR',
      hasRestrictions: parseInt(cleaned.substring(10, 11)) % 5 === 0, // 20% chance of restrictions
      lastUpdate: new Date().toISOString(),
      address: {
        street: 'Rua exemplo',
        number: `${parseInt(cleaned.substring(9, 11))}`,
        complement: '',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01000-000'
      }
    };
  } catch (error) {
    console.error('Error retrieving detailed info from SERASA:', error);
    return {
      error: error.message || 'Error retrieving detailed information',
      details: null
    };
  }
};

const SerasaAPI = {
  validateCPFFormat,
  formatCPF,
  validateCPF,
  getScore,
  getDetailedInfo
};

export default SerasaAPI;

