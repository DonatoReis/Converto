// src/firebase/realtimeService.js
import { realtimeDB, auth } from './config';
import { ref, onDisconnect, onValue, set, serverTimestamp, off, update, onChildAdded, onChildChanged, onChildRemoved, get } from 'firebase/database';

/**
 * Serviço para gerenciar status online de usuários usando Realtime Database
 * O Realtime Database é usado especificamente para status online devido à sua
 * latência ultra-baixa e recursos nativos de conexão/desconexão
 */

// Status disponíveis para usuários
export const UserStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  AWAY: 'away'
};

/**
 * Configura o monitoramento de status online para um usuário
 * @param {string} userId - ID do usuário
 * @returns {Function} - Função para cancelar o monitoramento
 */
export const setupUserOnlineStatus = (userId) => {
  if (!userId) {
    console.error('ID de usuário é necessário para configurar status online');
    return () => {};
  }

  // Referências para os status online do usuário
  const userStatusRef = ref(realtimeDB, `status/${userId}`);
  const connectedRef = ref(realtimeDB, '.info/connected');

  // Estado de atividade do usuário
  let userActivityState = {
    isAway: false,
    activityTimer: null,
    lastActivity: Date.now()
  };

  // Função para monitorar mudanças na conexão
  const onConnectionChange = (snapshot) => {
    if (snapshot.val() === true) { // Se estamos conectados ao Realtime Database
      // Primeiro defina o status como offline quando desconectar
      onDisconnect(userStatusRef)
        .set({
          state: UserStatus.OFFLINE,
          lastChanged: serverTimestamp(),
          lastSeen: serverTimestamp()
        })
        .then(() => {
          // Então defina o status como online
          set(userStatusRef, {
            state: UserStatus.ONLINE,
            lastChanged: serverTimestamp(),
            lastSeen: serverTimestamp(),
            device: {
              type: 'web',
              userAgent: navigator.userAgent,
              language: navigator.language
            }
          });
        })
        .catch(error => {
          console.error('Erro ao configurar status online:', error);
        });
    }
  };

  // Configura detecção de inatividade (ausência)
  const setupActivityDetection = () => {
    // Tempo após o qual o usuário é considerado "ausente" (5 minutos)
    const INACTIVITY_TIMEOUT = 5 * 60 * 1000;
    
    // Função para redefinir o temporizador quando o usuário interage
    const resetActivityTimer = () => {
      // Atualiza timestamp da última atividade
      userActivityState.lastActivity = Date.now();
      
      // Limpa o temporizador existente
      if (userActivityState.activityTimer) {
        clearTimeout(userActivityState.activityTimer);
      }
      
      // Se o usuário estava "ausente", muda o status para "online"
      if (userActivityState.isAway) {
        update(userStatusRef, {
          state: UserStatus.ONLINE,
          lastChanged: serverTimestamp(),
          lastSeen: serverTimestamp()
        });
        userActivityState.isAway = false;
      }
      
      // Configura novo temporizador
      userActivityState.activityTimer = setTimeout(() => {
        update(userStatusRef, {
          state: UserStatus.AWAY,
          lastChanged: serverTimestamp(),
          lastSeen: serverTimestamp()
        });
        userActivityState.isAway = true;
      }, INACTIVITY_TIMEOUT);
    };
    
    // Adiciona listeners para detectar atividade do usuário
    window.addEventListener('mousemove', resetActivityTimer);
    window.addEventListener('keydown', resetActivityTimer);
    window.addEventListener('click', resetActivityTimer);
    window.addEventListener('touchstart', resetActivityTimer);
    window.addEventListener('scroll', resetActivityTimer);
    
    // Inicia o temporizador
    resetActivityTimer();
    
    // Intervalo para atualizar o lastSeen periodicamente (a cada 3 minutos)
    const updateIntervalId = setInterval(() => {
      // Só atualiza o lastSeen se o usuário estiver ativo
      if (!userActivityState.isAway) {
        update(userStatusRef, {
          lastSeen: serverTimestamp()
        });
      }
    }, 3 * 60 * 1000);
    
    // Retorna função para limpar event listeners
    return () => {
      window.removeEventListener('mousemove', resetActivityTimer);
      window.removeEventListener('keydown', resetActivityTimer);
      window.removeEventListener('click', resetActivityTimer);
      window.removeEventListener('touchstart', resetActivityTimer);
      window.removeEventListener('scroll', resetActivityTimer);
      
      clearInterval(updateIntervalId);
      
      if (userActivityState.activityTimer) {
        clearTimeout(userActivityState.activityTimer);
      }
    };
  };

  // Configura detecção de mudança de visibilidade (mudança de aba)
  const setupVisibilityChange = () => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // O usuário saiu da aba, atualize para "away"
        update(userStatusRef, {
          state: UserStatus.AWAY,
          lastChanged: serverTimestamp()
        });
        userActivityState.isAway = true;
      } else if (document.visibilityState === 'visible' && userActivityState.isAway) {
        // O usuário voltou para a aba, verifique tempo de inatividade
        const inactiveTime = Date.now() - userActivityState.lastActivity;
        
        // Se esteve inativo por menos de 5 minutos, volte para "online"
        if (inactiveTime < 5 * 60 * 1000) {
          update(userStatusRef, {
            state: UserStatus.ONLINE,
            lastChanged: serverTimestamp(),
            lastSeen: serverTimestamp()
          });
          userActivityState.isAway = false;
        }
      }
    };
    
    document.addEventListener('visibilitychange', onVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  };

  // Configura monitoramento de conexão de rede
  const setupNetworkMonitoring = () => {
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        // Reconectar quando voltamos a ter internet
        if (userActivityState.isAway) {
          update(userStatusRef, {
            state: UserStatus.AWAY,
            lastChanged: serverTimestamp(),
            lastSeen: serverTimestamp()
          });
        } else {
          update(userStatusRef, {
            state: UserStatus.ONLINE,
            lastChanged: serverTimestamp(),
            lastSeen: serverTimestamp()
          });
        }
      } else {
        // Quando perdemos conexão, não fazemos nada, pois o onDisconnect
        // do Realtime Database já vai tratar disso automaticamente
      }
    };
    
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  };

  // Inscrever-se nas mudanças de conexão
  onValue(connectedRef, onConnectionChange);
  
  // Configurar detecção de atividade
  const cleanupActivity = setupActivityDetection();
  
  // Configurar detecção de visibilidade
  const cleanupVisibility = setupVisibilityChange();
  
  // Configurar monitoramento de rede
  const cleanupNetwork = setupNetworkMonitoring();

  // Retorna função para cancelar o monitoramento
  return () => {
    off(connectedRef, 'value', onConnectionChange);
    cleanupActivity();
    cleanupVisibility();
    cleanupNetwork();
    
    // Define o status como offline explicitamente quando cancelamos o monitoramento
    set(userStatusRef, {
      state: UserStatus.OFFLINE,
      lastChanged: serverTimestamp(),
      lastSeen: serverTimestamp()
    }).catch(error => {
      console.error('Erro ao definir status offline:', error);
    });
  };
};

/**
 * Verifica se um usuário está online
 * @param {string} userId - ID do usuário para verificar
 * @param {Function} callback - Chamada quando o status muda (recebe objeto com state e lastChanged)
 * @returns {Function} - Função para cancelar o monitoramento
 */
export const monitorUserOnlineStatus = (userId, callback) => {
  if (!userId) {
    console.error('ID de usuário é necessário para monitorar status online');
    return () => {};
  }

  const userStatusRef = ref(realtimeDB, `status/${userId}`);
  
  // Monitora mudanças no status
  const onStatusChange = (snapshot) => {
    const data = snapshot.val() || { 
      state: UserStatus.OFFLINE, 
      lastChanged: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
    callback(data);
  };

  // Inscrever-se nas mudanças de status
  onValue(userStatusRef, onStatusChange);

  // Retorna função para cancelar o monitoramento
  return () => {
    off(userStatusRef, 'value', onStatusChange);
  };
};

/**
 * Obtém o status atual de um usuário (sem monitoramento contínuo)
 * @param {string} userId - ID do usuário
 * @returns {Promise<Object>} - Objeto com o status do usuário
 */
export const getUserStatus = async (userId) => {
  if (!userId) {
    console.error('ID de usuário é necessário para obter status');
    return { state: UserStatus.OFFLINE };
  }
  
  try {
    const userStatusRef = ref(realtimeDB, `status/${userId}`);
    const snapshot = await get(userStatusRef);
    
    if (snapshot.exists()) {
      return snapshot.val();
    }
    
    return { 
      state: UserStatus.OFFLINE, 
      lastChanged: new Date().toISOString(),
      lastSeen: new Date().toISOString()
    };
  } catch (error) {
    console.error('Erro ao obter status do usuário:', error);
    return { state: UserStatus.OFFLINE };
  }
};

/**
 * Monitora o status online de múltiplos usuários
 * @param {Array<string>} userIds - Lista de IDs de usuários para monitorar
 * @param {Function} callback - Chamada quando qualquer status mudar (recebe objeto { userId: statusData })
 * @returns {Function} - Função para cancelar o monitoramento
 */
export const monitorMultipleUsersStatus = (userIds, callback) => {
  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    console.error('Lista de IDs de usuário é necessária para monitorar status online');
    return () => {};
  }

  const statusMap = {};
  const cleanupFunctions = [];

  // Configura monitoramento para cada usuário
  userIds.forEach(userId => {
    const onStatusUpdate = (statusData) => {
      statusMap[userId] = statusData;
      callback({...statusMap}); // Copia para evitar problemas de referência
    };
    
    const cleanup = monitorUserOnlineStatus(userId, onStatusUpdate);
    cleanupFunctions.push(cleanup);
  });

  // Retorna função para cancelar todos os monitoramentos
  return () => {
    cleanupFunctions.forEach(cleanup => cleanup());
  };
};

/**
 * Define o status de um usuário manualmente
 * @param {string} userId - ID do usuário
 * @param {string} status - Status para definir ('online', 'offline', 'away')
 */
export const setUserStatus = async (userId, status) => {
  if (!userId) {
    console.error('ID de usuário é necessário para definir status');
    return;
  }

  if (![UserStatus.ONLINE, UserStatus.OFFLINE, UserStatus.AWAY].includes(status)) {
    console.error('Status deve ser "online", "offline" ou "away"');
    return;
  }

  const userStatusRef = ref(realtimeDB, `status/${userId}`);
  
  try {
    await update(userStatusRef, {
      state: status,
      lastChanged: serverTimestamp(),
      lastSeen: serverTimestamp()
    });
  } catch (error) {
    console.error(`Erro ao definir status ${status}:`, error);
    throw error;
  }
};

/**
 * Obter lista de usuários online
 * @param {number} limit - Limite de usuários a retornar
 * @returns {Promise<Array>} - Lista de usuários online
 */
export const getOnlineUsers = async (limit = 50) => {
  try {
    const statusRef = ref(realtimeDB, 'status');
    const snapshot = await get(statusRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const usersStatus = snapshot.val();
    const onlineUsers = [];
    
    // Converter o objeto de status em array de usuários online
    Object.entries(usersStatus).forEach(([userId, status]) => {
      if (status.state === UserStatus.ONLINE || status.state === UserStatus.AWAY) {
        onlineUsers.push({
          userId,
          ...status
        });
      }
    });
    
    // Ordenar por lastSeen (mais recente primeiro) e limitar
    return onlineUsers
      .sort((a, b) => {
        const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
        const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('Erro ao obter usuários online:', error);
    return [];
  }
};

/**
 * Monitora mudanças em usuários online
 * @param {Function} callback - Chamada quando a lista de usuários online muda
 * @returns {Function} - Função para cancelar o monitoramento
 */
export const monitorOnlineUsers = (callback) => {
  const statusRef = ref(realtimeDB, 'status');
  
  const processSnapshot = (snapshot) => {
    if (!snapshot.exists()) {
      callback([]);
      return;
    }
    
    const usersStatus = snapshot.val();
    const onlineUsers = [];
    
    // Converter o objeto de status em array de usuários online
    Object.entries(usersStatus).forEach(([userId, status]) => {
      if (status.state === UserStatus.ONLINE || status.state === UserStatus.AWAY) {
        onlineUsers.push({
          userId,
          ...status
        });
      }
    });
    
    // Ordenar por lastSeen (mais recente primeiro)
    const sortedUsers = onlineUsers.sort((a, b) => {
      const aTime = a.lastSeen ? new Date(a.lastSeen).getTime() : 0;
      const bTime = b.lastSeen ? new Date(b.lastSeen).getTime() : 0;
      return bTime - aTime;
    });
    
    callback(sortedUsers);
  };
  
  // Monitorar todas as mudanças
  onValue(statusRef, processSnapshot);
  
  // Retornar função para cancelar monitoramento
  return () => {
    off(statusRef, 'value', processSnapshot);
  };
};

/**
 * Verifica quanto tempo um usuário está offline
 * @param {string} userId - ID do usuário para verificar
 * @returns {Promise<Object>} - Objeto com informações sobre tempo offline
 */
export const getUserOfflineTime = async (userId) => {
  try {
    const status = await getUserStatus(userId);
    
    if (status.state !== UserStatus.OFFLINE) {
      return { isOffline: false, duration: 0 };
    }
    
    // Calcular quanto tempo o usuário está offline
    const lastChanged = status.lastChanged 
      ? new Date(status.lastChanged).getTime() 
      : new Date().getTime();
    
    const now = new Date().getTime();
    const offlineDuration = now - lastChanged;
    
    return {
      isOffline: true,
      duration: offlineDuration,
      lastSeen: status.lastSeen || status.lastChanged,
      // Helpers para interface
      minutes: Math.floor(offlineDuration / (1000 * 60)),
      hours: Math.floor(offlineDuration / (1000 * 60 * 60)),
      days: Math.floor(offlineDuration / (1000 * 60 * 60 * 24))
    };
  } catch (error) {
    console.error('Erro ao verificar tempo offline:', error);
    return { isOffline: true, duration: 0 };
  }
};

/**
 * Limpa dados de presença antigos do Realtime Database
 * @param {number} olderThanDays - Limpar dados mais antigos que este número de dias
 * @returns {Promise<number>} - Número de registros removidos
 */
export const cleanupOldPresenceData = async (olderThanDays = 30) => {
  try {
    const statusRef = ref(realtimeDB, 'status');
    const snapshot = await get(statusRef);
    
    if (!snapshot.exists()) {
      return 0;
    }
    
    const now = new Date().getTime();
    const cutoffTime = now - (olderThanDays * 24 * 60 * 60 * 1000);
    const usersStatus = snapshot.val();
    let removedCount = 0;
    
    // Processa cada status
    const batch = {};
    
    Object.entries(usersStatus).forEach(([userId, status]) => {
      // Verifica se está offline há mais tempo que cutoffTime
      if (status.state === UserStatus.OFFLINE) {
        const lastChanged = status.lastChanged 
          ? new Date(status.lastChanged).getTime() 
          : 0;
          
        if (lastChanged < cutoffTime) {
          // Marcamos para remoção
          batch[`status/${userId}`] = null;
          removedCount++;
        }
      }
    });
    
    // Se há registros para remover, faz update em lote
    if (removedCount > 0) {
      await update(ref(realtimeDB), batch);
    }
    
    return removedCount;
  } catch (error) {
    console.error('Erro ao limpar dados de presença antigos:', error);
    return 0;
  }
};

// Exportar todas as funções como um objeto
const realtimeService = {
  UserStatus,
  setupUserOnlineStatus,
  monitorUserOnlineStatus,
  monitorMultipleUsersStatus,
  getUserStatus,
  setUserStatus,
  getOnlineUsers,
  monitorOnlineUsers,
  getUserOfflineTime,
  cleanupOldPresenceData
};

export default realtimeService;
