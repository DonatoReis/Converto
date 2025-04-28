// src/utils/documentLookup.js
/**
 * Utility functions for CPF/CNPJ validation and data lookup
 */

// Function to validate and format CPF (000.000.000-00)
const validateCPF = (cpf) => {
  // Remove non-numeric characters
  cpf = cpf.replace(/\D/g, '');
  
  // CPF must have exactly 11 digits
  if (cpf.length !== 11) return false;
  
  // Check if all digits are the same (invalid CPF)
  if (/^(\d)\1+$/.test(cpf)) return false;
  
  // Calculate verification digits
  let sum = 0;
  let remainder;
  
  // First verification digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(9, 10))) return false;
  
  // Second verification digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cpf.substring(i-1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cpf.substring(10, 11))) return false;
  
  return true;
};

// Function to validate and format CNPJ (00.000.000/0000-00)
const validateCNPJ = (cnpj) => {
  // Remove non-numeric characters
  cnpj = cnpj.replace(/\D/g, '');
  
  // CNPJ must have exactly 14 digits
  if (cnpj.length !== 14) return false;
  
  // Check if all digits are the same (invalid CNPJ)
  if (/^(\d)\1+$/.test(cnpj)) return false;
  
  // Calculate verification digits
  let size = cnpj.length - 2;
  let numbers = cnpj.substring(0, size);
  let digits = cnpj.substring(size);
  let sum = 0;
  let pos = size - 7;
  
  // First digit
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Second digit
  size += 1;
  numbers = cnpj.substring(0, size);
  sum = 0;
  pos = size - 7;
  
  for (let i = size; i >= 1; i--) {
    sum += numbers.charAt(size - i) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
};

// Function to format a CPF string (000.000.000-00)
const formatCPF = (cpf) => {
  cpf = cpf.replace(/\D/g, '');
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

// Function to format a CNPJ string (00.000.000/0000-00)
const formatCNPJ = (cnpj) => {
  cnpj = cnpj.replace(/\D/g, '');
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
};

// Function to identify if a document is CPF or CNPJ based on length
const identifyDocumentType = (document) => {
  const numbers = document.replace(/\D/g, '');
  
  if (numbers.length === 11) return 'CPF';
  if (numbers.length === 14) return 'CNPJ';
  return 'UNKNOWN';
};

// Function to validate a document (either CPF or CNPJ)
const validateDocument = (document) => {
  const type = identifyDocumentType(document);
  
  if (type === 'CPF') return validateCPF(document);
  if (type === 'CNPJ') return validateCNPJ(document);
  
  return false;
};

// Function to format a document (either CPF or CNPJ)
const formatDocument = (document) => {
  const type = identifyDocumentType(document);
  
  if (type === 'CPF') return formatCPF(document);
  if (type === 'CNPJ') return formatCNPJ(document);
  
  return document;
};

// Function to fetch company data from a CNPJ using BrasilAPI
const fetchCNPJData = async (cnpj) => {
  try {
    // Clean CNPJ to remove special characters
    const cleanCNPJ = cnpj.replace(/\D/g, '');
    
    if (!validateCNPJ(cleanCNPJ)) {
      throw new Error('CNPJ inválido');
    }
    
    // Using BrasilAPI
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCNPJ}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CNPJ não encontrado');
      }
      throw new Error(`Erro ao buscar CNPJ: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Extract phone number and email if available
    let phone = '';
    let email = '';
    
    // Extract main establishment data for address information
    const mainEstablishment = data.estabelecimento || {};
    
    // Get the first DDD and phone if available
    if (mainEstablishment.ddd_telefone_1 && mainEstablishment.ddd_telefone_1.trim() !== '') {
      phone = mainEstablishment.ddd_telefone_1;
      // Format if it contains numbers
      if (/\d/.test(phone)) {
        // Remove non-numeric characters, then format
        const numbers = phone.replace(/\D/g, '');
        if (numbers.length >= 10) {
          const ddd = numbers.slice(0, 2);
          const prefix = numbers.slice(2, 7);
          const suffix = numbers.slice(7, 11);
          phone = `(${ddd}) ${prefix}-${suffix}`;
        }
      }
    }

    // Get email from contact data if available
    if (data.email && data.email.trim() !== '') {
      email = data.email;
    } else if (mainEstablishment.email && mainEstablishment.email.trim() !== '') {
      email = mainEstablishment.email;
    }
    
    return {
      name: data.razao_social || '',
      fantasia: data.nome_fantasia || '',
      email: email,
      phone: phone,
      address: {
        street: mainEstablishment.tipo_logradouro ? 
          `${mainEstablishment.tipo_logradouro} ${mainEstablishment.logradouro}` : 
          (mainEstablishment.logradouro || ''),
        number: mainEstablishment.numero || '',
        complement: mainEstablishment.complemento || '',
        neighborhood: mainEstablishment.bairro || '',
        city: mainEstablishment.cidade?.nome || mainEstablishment.municipio || '',
        state: mainEstablishment.uf || '',
        zipCode: mainEstablishment.cep ? 
          mainEstablishment.cep.replace(/^(\d{5})(\d{3})$/, '$1-$2') : ''
      },
      situation: data.descricao_situacao_cadastral || '',
      openDate: data.data_inicio_atividade || '',
      type: data.natureza_juridica?.descricao || '',
      size: data.porte?.descricao || ''
    };
  } catch (error) {
    console.error('Erro ao buscar dados do CNPJ:', error);
    throw error;
  }
};

// Function to fetch data based on document type (CPF or CNPJ)
const fetchDocumentData = async (document) => {
  try {
    // Clean document to remove special characters
    const cleanDocument = document.replace(/\D/g, '');
    
    // Identify the document type
    const documentType = identifyDocumentType(cleanDocument);
    
    if (!validateDocument(cleanDocument)) {
      throw new Error('Documento inválido');
    }
    
    if (documentType === 'CNPJ') {
      // For CNPJ, use the existing function
      return await fetchCNPJData(cleanDocument);
    } else if (documentType === 'CPF') {
      // For CPF, we don't have a lookup service, so return an empty structure
      return {
        name: '',
        email: '',
        phone: '',
        document: formatCPF(cleanDocument),
        documentType: 'CPF',
        address: {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zipCode: ''
        }
      };
    } else {
      throw new Error('Tipo de documento desconhecido');
    }
  } catch (error) {
    console.error('Erro ao buscar dados do documento:', error);
    throw error;
  }
};

export {
  validateCPF,
  validateCNPJ,
  validateDocument,
  formatCPF,
  formatCNPJ,
  formatDocument,
  identifyDocumentType,
  fetchCNPJData,
  fetchDocumentData
};
