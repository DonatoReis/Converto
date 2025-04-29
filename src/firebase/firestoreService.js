// src/firebase/firestoreService.js
import {
  collection,
  doc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  runTransaction,
  increment,
} from "firebase/firestore";
import {
  getAuth,
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { firestore } from "./config";
import { standardizeContact } from "../models/ContactModel";

const auth = getAuth();

// ============= USUÁRIOS =============

/**
 * Obtém informações do usuário atual
 * @param {string} userId ID do usuário
 * @returns {Promise<Object>} Dados do usuário
 */
export const getUser = async (userId) => {
  try {
    const userRef = doc(firestore, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() };
    }

    return null;
  } catch (error) {
    console.error("Erro ao obter usuário:", error);
    throw error;
  }
};

/**
 * Atualiza os dados do usuário
 * @param {string} userId ID do usuário
 * @param {Object} userData Dados para atualizar
 * @returns {Promise<Object>} Dados atualizados
 */
export const updateUser = async (userId, userData) => {
  try {
    const userRef = doc(firestore, "users", userId);

    // Adiciona timestamp de atualização
    const dataToUpdate = {
      ...userData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(userRef, dataToUpdate);

    // Obtém os dados atualizados
    const updatedUser = await getDoc(userRef);
    return { id: updatedUser.id, ...updatedUser.data() };
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    throw error;
  }
};

/**
 * Verifica se um usuário existe e cria um novo usuário se não existir
 * @param {Object} userData Dados do usuário (nome, empresa, cpfCnpj, telefone, email, senha)
 * @returns {Promise<Object>} Dados do usuário criado ou existente
 */
export const createUser = async (userData) => {
  try {
    // Validar campos obrigatórios
    const requiredFields = [
      "nome",
      "empresa",
      "cpfCnpj",
      "telefone",
      "email",
      "senha",
    ];
    const missingFields = requiredFields.filter((field) => !userData[field]);

    if (missingFields.length > 0) {
      throw new Error(
        `Campos obrigatórios ausentes: ${missingFields.join(", ")}`,
      );
    }

    const { email, senha, ...profileData } = userData;

    // Verificar se o e-mail já está em uso
    const methods = await fetchSignInMethodsForEmail(auth, email);

    if (methods && methods.length > 0) {
      // Usuário já existe, buscar dados do Firestore
      try {
        // Tentar fazer login para obter o UID
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          senha,
        );
        const userId = userCredential.user.uid;

        // Buscar dados do usuário no Firestore
        const existingUser = await getUser(userId);
        return existingUser;
      } catch (loginError) {
        throw new Error(
          `E-mail já cadastrado com credenciais diferentes: ${loginError.message}`,
        );
      }
    }

    // Criar novo usuário no Authentication
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      senha,
    );
    const userId = userCredential.user.uid;

    // Salvar dados do usuário no Firestore
    const userRef = doc(firestore, "users", userId);
    const userData = {
      id: userId,
      email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      ...profileData,
    };

    await setDoc(userRef, userData);

    // Converter timestamp para Date para uso imediato no cliente
    return {
      ...userData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Erro ao criar/verificar usuário:", error);
    throw error;
  }
};

// ============= CONTATOS =============

/**
 * Obtém todos os contatos do usuário
 * @param {string} userId ID do usuário proprietário dos contatos
 * @returns {Promise<Array>} Lista de contatos
 */
export const getAllContacts = async (userId) => {
  try {
    const contactsRef = collection(firestore, "contacts");
    const q = query(
      contactsRef,
      where("ownerId", "==", userId),
      orderBy("name", "asc"),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao obter contatos:", error);
    throw error;
  }
};

/**
 * Configura listener para atualizações de contatos em tempo real
 * @param {string} userId ID do usuário
 * @param {Function} callback Função a ser chamada quando houver mudanças
 * @returns {Function} Função para cancelar a inscrição
 */
export const subscribeToContacts = (userId, callback) => {
  if (userId == null) {
    console.warn("subscribeToContacts chamado com userId nulo; ignorando listener");
    return () => {};
  }
  try {
    const contactsRef = collection(firestore, "contacts");
    const q = query(
      contactsRef,
      where("ownerId", "==", userId),
      orderBy("name", "asc"),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const contacts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(contacts);
      },
      (error) => {
        console.error("Erro ao observar contatos:", error);
      },
    );
  } catch (error) {
    console.error("Erro ao configurar listener de contatos:", error);
    throw error;
  }
};

/**
 * Adiciona um novo contato
 * @param {Object} contactData Dados do contato
 * @returns {Promise<Object>} Contato adicionado
 */
export const addContact = async (contactData) => {
  if (!contactData || contactData.ownerId == null) {
    throw new Error("Campo ownerId é obrigatório e não pode ser null/undefined");
  }
  try {
    // Se ainda quiser lançar aqui:
    // if (algumaOutraCondição) {
    //   throw new Error("Dados do contato são obrigatórios");
    // }

    // Padronizar os dados do contato usando a função do ContactModel
    const sanitizedData = standardizeContact(contactData);

    // Garantir que o campo ownerId esteja presente
    if (!sanitizedData.ownerId) {
      throw new Error("Campo ownerId é obrigatório");
    }

    // Adicionar timestamps
    const data = {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Verificação adicional para garantir que não há valores nulos
    Object.keys(data).forEach((key) => {
      if (data[key] === null) {
        data[key] = ""; // Convert null to empty string
      }
    });

    // Salvar no Firestore
    const docRef = await addDoc(collection(firestore, "contacts"), data);

    // Retornar o contato com ID e timestamps convertidos para uso imediato
    return {
      id: docRef.id,
      ...sanitizedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Erro ao adicionar contato:", error);
    throw error;
  }
};

/**
 * Atualiza um contato existente
 * @param {string} contactId ID do contato
 * @param {Object} contactData Dados para atualizar
 * @returns {Promise<Object>} Contato atualizado
 */
export const updateContact = async (contactId, contactData) => {
  try {
    const contactRef = doc(firestore, "contacts", contactId);

    // Adiciona timestamp de atualização
    const dataToUpdate = {
      ...contactData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(contactRef, dataToUpdate);

    // Retorna o contato atualizado
    return {
      id: contactId,
      ...contactData,
    };
  } catch (error) {
    console.error("Erro ao atualizar contato:", error);
    throw error;
  }
};

/**
 * Remove um contato
 * @param {string} contactId ID do contato
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const deleteContact = async (contactId) => {
  try {
    await deleteDoc(doc(firestore, "contacts", contactId));
    return true;
  } catch (error) {
    console.error("Erro ao excluir contato:", error);
    throw error;
  }
};

// ============= CONVERSAS =============

/**
 * Obtém todas as conversas do usuário
 * @param {string} userId ID do usuário
 * @param {boolean} includeArchived Incluir conversas arquivadas
 * @returns {Promise<Array>} Lista de conversas
 */
export const getAllConversations = async (userId, includeArchived = false) => {
  try {
    const conversationsRef = collection(firestore, "conversations");

    // Busca conversas onde o usuário é participante
    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId),
      includeArchived
        ? where("isArchived", "==", true)
        : where("isArchived", "==", false),
      orderBy("updatedAt", "desc"),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao obter conversas:", error);
    throw error;
  }
};

/**
 * Configura listener para atualizações de conversas em tempo real
 * @param {string} userId ID do usuário
 * @param {boolean} includeArchived Incluir conversas arquivadas
 * @param {Function} callback Função a ser chamada quando houver mudanças
 * @returns {Function} Função para cancelar a inscrição
 */
export const subscribeToConversations = (
  userId,
  includeArchived = false,
  callback,
) => {
  try {
    const conversationsRef = collection(firestore, "conversations");

    const q = query(
      conversationsRef,
      where("participants", "array-contains", userId),
      includeArchived
        ? where("isArchived", "==", true)
        : where("isArchived", "==", false),
      orderBy("updatedAt", "desc"),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const conversations = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(conversations);
      },
      (error) => {
        console.error("Erro ao observar conversas:", error);
      },
    );
  } catch (error) {
    console.error("Erro ao configurar listener de conversas:", error);
    throw error;
  }
};

/**
 * Obtém ou cria uma conversa entre participantes
 * @param {Array<string>} participantIds IDs dos participantes
 * @returns {Promise<Object>} Conversa
 */
  export const getOrCreateConversation = async (participantIds) => {
    try {
      const conversationsRef = collection(firestore, "conversations");
      return await runTransaction(firestore, async (transaction) => {
        // Query para conversas contendo o primeiro participante
        const q = query(
          conversationsRef,
          where("participants", "array-contains", participantIds[0])
        );
        const snapshot = await transaction.get(q);
        // Verifica correspondência exata de participantes
        const existingDoc = snapshot.docs.find((doc) => {
          const data = doc.data();
          return (
            data.participants.length === participantIds.length &&
            participantIds.every((id) => data.participants.includes(id))
          );
        });
        if (existingDoc) {
          const data = existingDoc.data();
          return { id: existingDoc.id, ...data };
        }
        // Cria nova conversa de forma atômica
        const newConvRef = doc(conversationsRef);
        const newConversation = {
          participants: participantIds,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastMessage: null,
          unreadCount: 0,
          isPinned: false,
          isMuted: false,
          isArchived: false,
        };
        transaction.set(newConvRef, newConversation);
        // Retorna conversa recém-criada com timestamps locais
        return {
          id: newConvRef.id,
          ...newConversation,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      });
    } catch (error) {
      console.error("Erro ao obter/criar conversa:", error);
      throw error;
    }
  };

/**
 * Atualiza os dados de uma conversa
 * @param {string} conversationId ID da conversa
 * @param {Object} conversationData Dados para atualizar
 * @returns {Promise<Object>} Conversa atualizada
 */
export const updateConversation = async (conversationId, conversationData) => {
  try {
    const conversationRef = doc(firestore, "conversations", conversationId);

    // Adiciona timestamp de atualização
    const dataToUpdate = {
      ...conversationData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(conversationRef, dataToUpdate);

    // Retorna a conversa atualizada
    return {
      id: conversationId,
      ...conversationData,
    };
  } catch (error) {
    console.error("Erro ao atualizar conversa:", error);
    throw error;
  }
};

/**
 * Marca todas as mensagens de uma conversa como lidas
 * @param {string} conversationId ID da conversa
 * @param {string} userId ID do usuário que está lendo as mensagens
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const markConversationAsRead = async (conversationId, userId) => {
  try {
    const conversationRef = doc(firestore, "conversations", conversationId);

    // Atualiza o contador de não lidas para 0
    await updateDoc(conversationRef, {
      unreadCount: 0,
      updatedAt: serverTimestamp(),
    });

    // Também marcamos as mensagens individuais como lidas
    const messagesRef = collection(firestore, "messages");
    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      where("readBy", "array-contains-any", [userId]),
    );

    const querySnapshot = await getDocs(q);

    // Usa batch para atualizar múltiplas mensagens de uma vez
    const batch = writeBatch(firestore);

    querySnapshot.docs.forEach((doc) => {
      const messageRef = doc.ref;
      const messageData = doc.data();

      // Adiciona o usuário à lista de leitores se não estiver lá
      if (!messageData.readBy.includes(userId)) {
        batch.update(messageRef, {
          readBy: [...messageData.readBy, userId],
        });
      }
    });

    // Executa todas as atualizações em batch
    await batch.commit();

    return true;
  } catch (error) {
    console.error("Erro ao marcar conversa como lida:", error);
    throw error;
  }
};

/**
 * Obtém as mensagens de uma conversa
 * @param {string} conversationId ID da conversa
 * @param {number} limit Limite de mensagens a retornar
 * @param {string} startAfter ID da última mensagem para paginação
 * @returns {Promise<Array>} Lista de mensagens
 */
export const getMessages = async (
  conversationId,
  limit = 50,
  startAfter = null,
) => {
  try {
    const messagesRef = collection(firestore, "messages");

    let q;

    if (startAfter) {
      // Se temos um ponto de início, usamos para paginação
      const startAfterDoc = await getDoc(
        doc(firestore, "messages", startAfter),
      );

      if (startAfterDoc.exists()) {
        q = query(
          messagesRef,
          where("conversationId", "==", conversationId),
          orderBy("timestamp", "desc"),
          startAfter(startAfterDoc),
          limit(limit),
        );
      } else {
        throw new Error("Mensagem de referência para paginação não encontrada");
      }
    } else {
      // Consulta inicial sem paginação
      q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "desc"),
        limit(limit),
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao obter mensagens:", error);
    throw error;
  }
};

/**
 * Configura listener para atualizações de mensagens em tempo real
 * @param {string} conversationId ID da conversa
 * @param {Function} callback Função a ser chamada quando houver mudanças
 * @param {number} limit Limite de mensagens a observar
 * @returns {Function} Função para cancelar a inscrição
 */
export const subscribeToMessages = (conversationId, callback, limit = 50) => {
  try {
    const messagesRef = collection(firestore, "messages");

    const q = query(
      messagesRef,
      where("conversationId", "==", conversationId),
      orderBy("timestamp", "desc"),
      limit(limit),
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const messages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(messages);
      },
      (error) => {
        console.error("Erro ao observar mensagens:", error);
      },
    );
  } catch (error) {
    console.error("Erro ao configurar listener de mensagens:", error);
    throw error;
  }
};

/**
 * Envia uma nova mensagem
 * @param {string} conversationId ID da conversa
 * @param {string} senderId ID do remetente
 * @param {string|Object} content Conteúdo da mensagem ou objeto com dados
 * @returns {Promise<Object>} Mensagem criada
 */
export const sendMessage = async (conversationId, senderId, content) => {
  try {
    // Determina o tipo de mensagem
    const isComplexContent = typeof content === "object";
    const messageType = isComplexContent ? content.type || "text" : "text";
    const messageContent = isComplexContent ? content.content : content;

    // Cria a mensagem
    const messageData = {
      conversationId,
      senderId,
      content: messageContent,
      type: messageType,
      timestamp: serverTimestamp(),
      readBy: [],
      mediaAttachments: [],
    };

    // Processar anexos de mídia, se houver
    if (isComplexContent && content.mediaAttachments) {
      messageData.mediaAttachments = content.mediaAttachments;
    }

    // Adicionar a mensagem à coleção de mensagens
    const messageRef = await addDoc(
      collection(firestore, "messages"),
      messageData,
    );

    // Atualizar a conversa com a referência à última mensagem e contador de não lidas
    const conversationRef = doc(firestore, "conversations", conversationId);
    await updateDoc(conversationRef, {
      lastMessage: messageRef.id,
      updatedAt: serverTimestamp(),
      // Incrementar contador de não lidas de forma segura para múltiplas leituras simultâneas
      unreadCount: increment(1),
    });

    // Retornar a mensagem enviada com ID
    return {
      id: messageRef.id,
      ...messageData,
      // Converter timestamp de servidor para objeto Date para uso imediato
      timestamp: new Date(),
    };
  } catch (error) {
    console.error("Erro ao enviar mensagem:", error);
    throw error;
  }
};

/**
 * Exclui uma mensagem
 * @param {string} messageId ID da mensagem
 * @param {string} conversationId ID da conversa
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const deleteMessage = async (messageId, conversationId) => {
  try {
    // Excluir a mensagem
    const messageRef = doc(firestore, "messages", messageId);
    await deleteDoc(messageRef);

    // Verificar se era a última mensagem e atualizar a conversa se necessário
    const conversationRef = doc(firestore, "conversations", conversationId);
    const conversationSnap = await getDoc(conversationRef);

    if (
      conversationSnap.exists() &&
      conversationSnap.data().lastMessage === messageId
    ) {
      // Buscar a mensagem mais recente para atualizar a conversa
      const messagesRef = collection(firestore, "messages");
      const q = query(
        messagesRef,
        where("conversationId", "==", conversationId),
        orderBy("timestamp", "desc"),
        limit(1),
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.docs.length > 0) {
        // Atualizar com a nova última mensagem
        await updateDoc(conversationRef, {
          lastMessage: querySnapshot.docs[0].id,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Não há mais mensagens
        await updateDoc(conversationRef, {
          lastMessage: null,
          updatedAt: serverTimestamp(),
        });
      }
    }

    return true;
  } catch (error) {
    console.error("Erro ao excluir mensagem:", error);
    throw error;
  }
};

// ============= MARKETPLACE =============

/**
 * Obtém produtos do marketplace
 * @param {Object} filters Filtros a aplicar (categoria, preço, etc)
 * @param {number} limit Número máximo de produtos a retornar
 * @returns {Promise<Array>} Lista de produtos
 */
export const getMarketplaceProducts = async (filters = {}, limit = 20) => {
  try {
    const productsRef = collection(firestore, "marketplace_products");

    // Construir a query com base nos filtros fornecidos
    let productQuery = query(productsRef, orderBy("createdAt", "desc"));

    // Aplicar filtros se fornecidos
    if (filters.category) {
      productQuery = query(
        productQuery,
        where("category", "==", filters.category),
      );
    }

    if (filters.minPrice) {
      productQuery = query(
        productQuery,
        where("price", ">=", filters.minPrice),
      );
    }

    if (filters.maxPrice) {
      productQuery = query(
        productQuery,
        where("price", "<=", filters.maxPrice),
      );
    }

    // Aplicar limite
    productQuery = query(productQuery, limit(limit));

    const querySnapshot = await getDocs(productQuery);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error("Erro ao obter produtos do marketplace:", error);
    throw error;
  }
};

/**
 * Obtém detalhes de um produto específico
 * @param {string} productId ID do produto
 * @returns {Promise<Object>} Dados do produto
 */
export const getMarketplaceProduct = async (productId) => {
  try {
    const productRef = doc(firestore, "marketplace_products", productId);
    const productSnap = await getDoc(productRef);

    if (productSnap.exists()) {
      return { id: productSnap.id, ...productSnap.data() };
    }

    return null;
  } catch (error) {
    console.error("Erro ao obter detalhes do produto:", error);
    throw error;
  }
};

/**
 * Atualiza um produto do marketplace
 * @param {string} productId ID do produto
 * @param {Object} productData Dados para atualizar
 * @returns {Promise<Object>} Produto atualizado
 */
export const updateMarketplaceProduct = async (productId, productData) => {
  try {
    const productRef = doc(firestore, "marketplace_products", productId);

    // Adiciona timestamp de atualização
    const dataToUpdate = {
      ...productData,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(productRef, dataToUpdate);

    // Retorna o produto atualizado
    return {
      id: productId,
      ...productData,
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Erro ao atualizar produto do marketplace:", error);
    throw error;
  }
};

/**
 * Remove um produto do marketplace
 * @param {string} productId ID do produto
 * @returns {Promise<boolean>} Sucesso da operação
 */
export const deleteMarketplaceProduct = async (productId) => {
  try {
    await deleteDoc(doc(firestore, "marketplace_products", productId));
    return true;
  } catch (error) {
    console.error("Erro ao excluir produto do marketplace:", error);
    throw error;
  }
};

// ============= BUSCA =============

/**
 * Realiza busca em contatos
 * @param {string} userId ID do usuário proprietário dos contatos
 * @param {string} query Texto da busca
 * @returns {Promise<Array>} Resultados da busca
 */
export const searchContacts = async (userId, searchText) => {
  try {
    // Normaliza a consulta (minúsculas e sem espaços extras)
    const normalizedQuery = searchText.toLowerCase().trim();

    if (!normalizedQuery) {
      return [];
    }

    // Busca os contatos do usuário
    const contactsRef = collection(firestore, "contacts");
    const q = query(contactsRef, where("ownerId", "==", userId));

    const querySnapshot = await getDocs(q);

    // Filtrar no cliente os contatos que correspondem à busca
    return querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((contact) => {
        const name = contact.name?.toLowerCase() || "";
        const email = contact.email?.toLowerCase() || "";
        const company = contact.company?.toLowerCase() || "";

        return (
          name.includes(normalizedQuery) ||
          email.includes(normalizedQuery) ||
          company.includes(normalizedQuery)
        );
      });
  } catch (error) {
    console.error("Erro ao buscar contatos:", error);
    throw error;
  }
};

/**
 * Realiza busca em mensagens
 * @param {string} userId ID do usuário
 * @param {string} query Texto da busca
 * @param {string} conversationId ID da conversa (opcional, para limitar a busca)
 * @returns {Promise<Array>} Resultados da busca
 */
export const searchMessages = async (
  userId,
  searchText,
  conversationId = null,
) => {
  try {
    // Normaliza a consulta
    const normalizedQuery = searchText.toLowerCase().trim();

    if (!normalizedQuery) {
      return [];
    }

    // Obtém as conversas do usuário
    const conversationsRef = collection(firestore, "conversations");
    let conversationQuery = query(
      conversationsRef,
      where("participants", "array-contains", userId),
    );

    let conversations = [];

    // Se um ID de conversa específico foi fornecido, filtre apenas essa conversa
    if (conversationId) {
      const conversationSnap = await getDoc(
        doc(firestore, "conversations", conversationId),
      );
      if (conversationSnap.exists()) {
        conversations = [
          { id: conversationSnap.id, ...conversationSnap.data() },
        ];
      }
    } else {
      const conversationsSnapshot = await getDocs(conversationQuery);
      conversations = conversationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    // Se não houver conversas, retorna um array vazio
    if (conversations.length === 0) {
      return [];
    }

    // Array para armazenar os resultados
    const results = [];

    // Para cada conversa, obter mensagens e filtrar as que contêm a consulta
    const conversationIds = conversations.map((conv) => conv.id);

    // Usar uma busca eficiente por todas as mensagens das conversas relevantes de uma só vez
    const messagesRef = collection(firestore, "messages");
    const messagesQuery = query(
      messagesRef,
      where("conversationId", "in", conversationIds),
      orderBy("timestamp", "desc"),
      limit(100), // Limite para evitar carregar muitas mensagens
    );

    const messagesSnapshot = await getDocs(messagesQuery);

    // Filtrar mensagens que contêm a consulta
    const filteredMessages = messagesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((message) => {
        // Filtrar apenas mensagens de texto que contêm a consulta
        if (message.type === "text") {
          return message.content.toLowerCase().includes(normalizedQuery);
        }
        return false;
      });

    // Agora enriquecer as mensagens com informações da conversa
    for (const message of filteredMessages) {
      const conversation = conversations.find(
        (conv) => conv.id === message.conversationId,
      );

      if (conversation) {
        results.push({
          ...message,
          conversation: {
            id: conversation.id,
            title: conversation.title || "Conversa sem título",
            participants: conversation.participants,
          },
        });
      }
    }

    return results;
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    throw error;
  }
};

/**
 * Busca produtos no marketplace
 * @param {string} query Texto da busca
 * @param {Object} filters Filtros adicionais (categoria, preço, etc)
 * @returns {Promise<Array>} Resultados da busca
 */
export const searchMarketplaceProducts = async (searchText, filters = {}) => {
  try {
    // Normaliza a consulta
    const normalizedQuery = searchText.toLowerCase().trim();

    if (!normalizedQuery) {
      return [];
    }

    // Busca produtos (infelizmente Firestore não suporta busca de texto completo,
    // então precisamos buscar todos os produtos e filtrar no cliente)
    const productsRef = collection(firestore, "marketplace_products");
    let productsQuery = query(
      productsRef,
      where("status", "==", "active"),
      orderBy("createdAt", "desc"),
    );

    // Aplicar filtros adicionais
    if (filters.category) {
      productsQuery = query(
        productsQuery,
        where("category", "==", filters.category),
      );
    }

    if (filters.minPrice) {
      productsQuery = query(
        productsQuery,
        where("price", ">=", filters.minPrice),
      );
    }

    if (filters.maxPrice) {
      productsQuery = query(
        productsQuery,
        where("price", "<=", filters.maxPrice),
      );
    }

    const querySnapshot = await getDocs(productsQuery);

    // Filtrar os produtos que correspondem à busca de texto no lado do cliente
    return querySnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((product) => {
        const name = product.name?.toLowerCase() || "";
        const description = product.description?.toLowerCase() || "";
        const tags = product.tags?.join(" ").toLowerCase() || "";

        return (
          name.includes(normalizedQuery) ||
          description.includes(normalizedQuery) ||
          tags.includes(normalizedQuery)
        );
      });
  } catch (error) {
    console.error("Erro ao buscar produtos do marketplace:", error);
    throw error;
  }
};

/**
 * Adiciona um produto ao marketplace
 * @param {Object} productData Dados do produto
 * @returns {Promise<Object>} Produto adicionado
 */
export const addMarketplaceProduct = async (productData) => {
  try {
    // Sanitizar os dados do produto
    const sanitizedData = {
      name: productData.name || "",
      description: productData.description || "",
      price: productData.price || 0,
      sellerId: productData.sellerId,
      category: productData.category || "other",
      images: productData.images || [],
      status: "active",
    };

    // Adicionar timestamps
    const data = {
      ...sanitizedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(firestore, "marketplace_products"),
      data,
    );

    return {
      id: docRef.id,
      ...sanitizedData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error("Erro ao adicionar produto ao marketplace:", error);
    throw error;
  }
};

/**
 * Busca usuários globais por telefone
 * @param {string} phone Número de telefone a ser buscado
 * @returns {Promise<Array>} Usuários encontrados
 */
export const searchUsersByPhone = async (phone) => {
  try {
    const normalized = String(phone || "").replace(/\D/g, "");
    if (!normalized) return [];
    const usersRef = collection(firestore, "users");
    const q = query(usersRef, where("phone", "==", normalized), limit(5));
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      source: "global",
    }));
  } catch (error) {
    console.error("Erro ao buscar usuários por telefone:", error);
    throw error;
  }
};

/**
 * Busca usuários globais por documento (CPF/CNPJ)
 * @param {string} document Documento a ser buscado (CPF ou CNPJ)
 * @returns {Promise<Array>} Usuários encontrados
 */
export const searchUsersByDocument = async (document) => {
  try {
    if (!document) return [];

    // Normaliza o documento (apenas números)
    const normalizedDoc = String(document).replace(/\D/g, "");
    if (normalizedDoc.length < 3) return [];

    const documentResults = [];
    const usersRef = collection(firestore, "users");

    // Busca exata pelo campo document
    const q = query(usersRef, where("document", "==", normalizedDoc), limit(5));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        fullName: data.fullName || data.nome || data.name || "Usuário",
        email: data.email || "",
        company: data.empresa || data.company || "",
        document: data.document || data.cpfCnpj || "",
        phone: data.telefone || data.phone || "",
        source: "global",
      };
    });
  } catch (error) {
    console.error("Erro ao buscar usuários por documento:", error);
    return [];
  }
};
const firestoreService = {
  // Usuários
  getUser,
  updateUser,
  createUser,

  // Contatos
  getAllContacts,
  subscribeToContacts,
  addContact,
  updateContact,
  deleteContact,

  // Conversas
  getAllConversations,
  subscribeToConversations,
  getOrCreateConversation,
  updateConversation,
  markConversationAsRead,

  // Mensagens
  getMessages,
  subscribeToMessages,
  sendMessage,
  deleteMessage,

  // Marketplace
  getMarketplaceProducts,
  getMarketplaceProduct,
  addMarketplaceProduct,
  updateMarketplaceProduct,
  deleteMarketplaceProduct,

  // Busca
  searchContacts,
  searchMessages,
  searchMarketplaceProducts,
  searchUsersByPhone,
  searchUsersByDocument,
};

export default firestoreService;
