// src/utils/serasaScore.js
/**
 * Utility functions for Serasa score integration
 */

// Score ranges for credit classification
const SCORE_RANGES = {
  LOW: { min: 0, max: 300, label: 'Baixo', color: '#FF4545' },
  MEDIUM_LOW: { min: 301, max: 500, label: 'Médio-Baixo', color: '#FF8D45' },
  MEDIUM: { min: 501, max: 700, label: 'Médio', color: '#FFD145' },
  MEDIUM_HIGH: { min: 701, max: 800, label: 'Bom', color: '#9BDB3D' },
  HIGH: { min: 801, max: 1000, label: 'Excelente', color: '#00A84E' }
};

// Mock API key (in a real application, this would be stored securely)
const API_KEY = 'serasa_api_key_mock';

// Get color based on score value
const getScoreColor = (score) => {
  if (score <= SCORE_RANGES.LOW.max) return SCORE_RANGES.LOW.color;
  if (score <= SCORE_RANGES.MEDIUM_LOW.max) return SCORE_RANGES.MEDIUM_LOW.color;
  if (score <= SCORE_RANGES.MEDIUM.max) return SCORE_RANGES.MEDIUM.color;
  if (score <= SCORE_RANGES.MEDIUM_HIGH.max) return SCORE_RANGES.MEDIUM_HIGH.color;
  return SCORE_RANGES.HIGH.color;
};

// Get label based on score value
const getScoreLabel = (score) => {
  if (score <= SCORE_RANGES.LOW.max) return SCORE_RANGES.LOW.label;
  if (score <= SCORE_RANGES.MEDIUM_LOW.max) return SCORE_RANGES.MEDIUM_LOW.label;
  if (score <= SCORE_RANGES.MEDIUM.max) return SCORE_RANGES.MEDIUM.label;
  if (score <= SCORE_RANGES.MEDIUM_HIGH.max) return SCORE_RANGES.MEDIUM_HIGH.label;
  return SCORE_RANGES.HIGH.label;
};

// Function to check if Serasa API is properly configured
const isConfigured = () => {
  // In a real application, check if API keys are valid
  return API_KEY !== 'serasa_api_key_mock';
};

// Mock function to get a Serasa score for a person or company
// In a real application, this would make an API call to Serasa
const getScore = async (document) => {
  try {
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real application, this would call the actual Serasa API
    // For demonstration, we'll generate a random score
    const score = Math.floor(Math.random() * 1000);
    
    // Generate some risk factors based on the score
    let riskFactors = [];
    
    if (score < 300) {
      riskFactors = [
        'Histórico recente de inadimplência',
        'Múltiplos empréstimos em atraso',
        'Protestos em cartório'
      ];
    } else if (score < 500) {
      riskFactors = [
        'Dívida em negociação',
        'Histórico de pagamentos irregulares'
      ];
    } else if (score < 700) {
      riskFactors = [
        'Algumas contas pagas com atraso'
      ];
    }
    
    // Generate some opportunity factors based on the score
    let opportunityFactors = [];
    
    if (score > 700) {
      opportunityFactors = [
        'Elegível para crédito premium',
        'Histórico de pagamentos em dia'
      ];
    } else if (score > 500) {
      opportunityFactors = [
        'Comportamento de crédito melhorando',
        'Elegível para ofertas padrão'
      ];
    } else {
      opportunityFactors = [
        'Oportunidade para renegociação de dívidas',
        'Planos de recuperação de crédito disponíveis'
      ];
    }
    
    return {
      score,
      color: getScoreColor(score),
      label: getScoreLabel(score),
      riskFactors,
      opportunityFactors,
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao buscar score Serasa:', error);
    throw error;
  }
};

// Function to register a contact for score monitoring (mock)
const registerForMonitoring = async (document, name, email) => {
  try {
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // In a real application, this would call the actual Serasa API
    return {
      success: true,
      monitoringId: `monitor_${Date.now()}`,
      activeSince: new Date().toISOString(),
      notificationEmail: email
    };
  } catch (error) {
    console.error('Erro ao registrar monitoramento:', error);
    throw error;
  }
};

// Create a Serasa history report (mock)
const createHistoryReport = async (document) => {
  try {
    // Simulating API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate random historical data
    const months = 6;
    const history = [];
    
    let baseScore = Math.floor(Math.random() * 300) + 400; // Base score between 400-700
    
    for (let i = 0; i < months; i++) {
      // Random fluctuation between -30 and +50 points
      const change = Math.floor(Math.random() * 80) - 30;
      baseScore += change;
      
      // Keep score within valid range
      baseScore = Math.max(0, Math.min(1000, baseScore));
      
      const date = new Date();
      date.setMonth(date.getMonth() - (months - i - 1));
      
      history.push({
        date: date.toISOString().substring(0, 10),
        score: baseScore,
        change
      });
    }
    
    return {
      documentNumber: document,
      history: history.sort((a, b) => new Date(a.date) - new Date(b.date)),
      reportDate: new Date().toISOString(),
      reportId: `report_${Date.now()}`
    };
  } catch (error) {
    console.error('Erro ao criar relatório histórico:', error);
    throw error;
  }
};

export {
  SCORE_RANGES,
  getScoreColor,
  getScoreLabel,
  isConfigured,
  getScore,
  registerForMonitoring,
  createHistoryReport
};