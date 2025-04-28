// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore, CACHE_SIZE_UNLIMITED, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { getDatabase, ref } from 'firebase/database';
import { getAuth, browserLocalPersistence } from 'firebase/auth';

// Firebase configuration
// IMPORTANTE: Em produção, estas chaves devem vir de variáveis de ambiente (.env)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyAPKNfrxRSdALlWM55M1GUXECen0IgtSxA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mercatrix-f825c.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mercatrix-f825c",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mercatrix-f825c.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "321931501267",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:321931501267:web:157d8456c333b6a6de7e26",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://mercatrix-f825c-default-rtdb.firebaseio.com/" // URL para Realtime Database
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore com configurações avançadas para melhor performance e persistência
const firestore = initializeFirestore(app, {
  cacheSizeBytes: CACHE_SIZE_UNLIMITED, // Aumenta o tamanho de cache para melhor performance offline
  experimentalForceLongPolling: false, // Usar WebSockets quando possível para menor latência
  ignoreUndefinedProperties: true, // Ignora propriedades undefined, evitando erros
  cache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  }) // Nova configuração recomendada para persistência
});

// Inicializar Realtime Database
const realtimeDB = getDatabase(app);

// Inicializar Authentication
const auth = getAuth(app);

// Log the auth configuration to help diagnose issues
console.log('Firebase Auth initialized successfully');
console.log('Firebase configuration status:', {
  apiKeyExists: !!firebaseConfig.apiKey,
  authDomainExists: !!firebaseConfig.authDomain,
  projectIdExists: !!firebaseConfig.projectId
});

// Note: Persistence is now configured in AuthContext.jsx using browserLocalPersistence
// This ensures there's a single source of truth for authentication persistence

console.log('Firebase inicializado com sucesso');

// Exportar todas as instâncias para uso nos outros módulos
export { app, firestore, realtimeDB, auth };

