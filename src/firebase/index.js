// src/firebase/index.js

// Importa configuração do Firebase
import { app, firestore, realtimeDB, auth } from './config';

// Importa serviços
import firestoreService from './firestoreService';
import realtimeService from './realtimeService';

// Exportar tudo para uso no app
export {
  // Configurações e instâncias
  app,
  firestore,
  realtimeDB,
  auth,
  
  // Serviços do Firestore (contatos, conversas, marketplace)
  firestoreService,
  
  // Serviço do Realtime Database (status online)
  realtimeService
};

/**
 * Inicializa os serviços do Firebase e configura a autenticação
 * Chamada uma vez na inicialização da aplicação
 * @returns {Promise<void>}
 */
export const initializeFirebase = async () => {
  try {
    // Configurar as regras de segurança e comportamento
    console.log('Firebase inicializado com sucesso');
    
    // Monitorar estado de autenticação (opcional)
    auth.onAuthStateChanged((user) => {
      if (user) {
        console.log('Usuário autenticado:', user.uid);
      } else {
        console.log('Usuário não autenticado');
      }
    });
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar Firebase:', error);
    throw error;
  }
};

/**
 * Migra dados de mock para o Firestore (uso em desenvolvimento)
 * @param {Object} mockData - Dados mock para migrar
 * @returns {Promise<Object>} - Resultado da migração
 */
export const migrateDataToFirebase = async (mockData) => {
  return firestoreService.migrateDataToFirestore(mockData);
};
