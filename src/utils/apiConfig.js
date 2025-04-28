/**
 * API Configuration Utility
 * 
 * This utility provides secure management of API credentials and configurations.
 * It loads credentials from environment variables or secure storage and provides
 * methods to retrieve them safely.
 * 
 * Important security considerations:
 * - In a production environment, API keys should NEVER be stored in client-side code
 * - Use environment variables, secure vaults, or backend proxies for actual credentials
 * - This implementation provides a simulation of secure credential management for demo purposes
 */

// Secure credential storage (in a real app, these would come from environment variables or secure storage)
// This is a mock implementation for demo purposes
let apiCredentials = null;

/**
 * Initialize API credentials
 * In a real production app, this would load from environment variables or secure storage
 */
const initializeCredentials = () => {
  try {
    // In development, check if credentials are stored in localStorage (for demo)
    if (process.env.NODE_ENV === 'development') {
      const storedCredentials = localStorage.getItem('mercatrix_api_credentials');
      if (storedCredentials) {
        apiCredentials = JSON.parse(storedCredentials);
        return true;
      }
    }

    // In production, would use environment variables instead
    // For demo purposes, we'll use a mock implementation
    apiCredentials = {
      serasa: {
        apiKey: process.env.REACT_APP_SERASA_API_KEY || 'mock-serasa-api-key',
        apiSecret: process.env.REACT_APP_SERASA_API_SECRET || 'mock-serasa-api-secret',
        baseUrl: 'https://api.serasa.com.br/v1',
        timeout: 10000, // 10 seconds
      },
      sintegra: {
        apiKey: process.env.REACT_APP_SINTEGRA_API_KEY || 'mock-sintegra-api-key',
        apiSecret: process.env.REACT_APP_SINTEGRA_API_SECRET || 'mock-sintegra-api-secret',
        baseUrl: 'https://api.sintegra.gov.br/v1',
        timeout: 10000, // 10 seconds
      }
    };

    // For demo purposes only - in real app, NEVER store credentials in localStorage
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('mercatrix_api_credentials', JSON.stringify(apiCredentials));
    }

    return true;
  } catch (error) {
    console.error('Error initializing API credentials:', error);
    return false;
  }
};

/**
 * Get API credentials for a specific service
 * @param {string} service - The service to get credentials for (e.g., 'serasa', 'sintegra')
 * @returns {Object|null} - API credentials object or null if not found
 */
const getCredentials = (service) => {
  try {
    if (!apiCredentials) {
      const initialized = initializeCredentials();
      if (!initialized) {
        console.error(`Failed to initialize credentials for ${service}`);
        return null;
      }
    }

    if (!apiCredentials[service]) {
      console.error(`No credentials found for service: ${service}`);
      return null;
    }

    return apiCredentials[service];
  } catch (error) {
    console.error(`Error retrieving ${service} credentials:`, error);
    return null;
  }
};

/**
 * Update API credentials for a specific service
 * @param {string} service - The service to update credentials for
 * @param {Object} credentials - New credentials object
 * @returns {boolean} - Success or failure
 */
const updateCredentials = (service, credentials) => {
  try {
    if (!apiCredentials) {
      initializeCredentials();
    }

    apiCredentials[service] = {
      ...apiCredentials[service],
      ...credentials
    };

    // For demo purposes only - in real app, NEVER store credentials in localStorage
    if (process.env.NODE_ENV === 'development') {
      localStorage.setItem('mercatrix_api_credentials', JSON.stringify(apiCredentials));
    }

    return true;
  } catch (error) {
    console.error(`Error updating ${service} credentials:`, error);
    return false;
  }
};

/**
 * Generate an authorization header for API requests
 * @param {string} service - The service to generate the auth header for
 * @returns {Object|null} - Headers object or null if error
 */
const getAuthHeaders = (service) => {
  try {
    const credentials = getCredentials(service);
    if (!credentials) return null;

    return {
      'Authorization': `Bearer ${credentials.apiKey}`,
      'Content-Type': 'application/json',
      'X-API-Key': credentials.apiKey
    };
  } catch (error) {
    console.error(`Error generating auth headers for ${service}:`, error);
    return null;
  }
};

// Initialize credentials on module load
initializeCredentials();

export const APIConfig = {
  getCredentials,
  updateCredentials,
  getAuthHeaders
};

export default APIConfig;

