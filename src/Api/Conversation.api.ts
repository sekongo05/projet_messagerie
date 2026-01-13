import axios from './axios';

// Types
export type Conversation = {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
};

/**
 * Récupère toutes les conversations de l'utilisateur
 */
export const getConversations = async (userId: number = 1): Promise<Conversation[]> => {
  try {
    const response = await axios.post(
      "/api/conversation/getByCriteria",
      {
        user: userId,
        data: {},
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Réponse API brute des conversations:", response.data);

    // Les données sont dans response.data.items selon la structure de votre API
    const data = Array.isArray(response.data)
      ? response.data
      : response.data.items || response.data.data || response.data.content || [];

    console.log("Données extraites (avant mapping):", data);
    console.log("Type de données:", Array.isArray(data) ? 'tableau' : typeof data);
    console.log("Nombre d'éléments (avant mapping):", Array.isArray(data) ? data.length : 0);

    // Log pour voir la structure d'un élément
    if (data.length > 0) {
      console.log("Structure d'un élément de conversation:", data[0]);
      console.log("Propriétés disponibles:", Object.keys(data[0]));
    }

    // Mapping des conversations
    const conversations: Conversation[] = data
      .filter((item: any) => {
        const hasId = item && (item.id || item.conversationId);
        if (!hasId) {
          console.log("Élément filtré (pas d'id):", item);
        }
        return hasId;
      })
      .map((item: any) => {
        // Récupérer le contenu du dernier message (peut être un objet ou une string)
        const lastMessageObj = item.lastMessage || item.dernierMessage || item.latestMessage;
        const lastMessageContent = typeof lastMessageObj === 'string' 
          ? lastMessageObj 
          : lastMessageObj?.content 
            || lastMessageObj?.message 
            || item.message 
            || item.lastMessageContent 
            || item.content;
        
        // Récupérer le timestamp du dernier message depuis plusieurs sources possibles
        // 1. Directement sur l'item de conversation
        // 2. Dans l'objet lastMessage imbriqué
        // 3. Dans l'objet dernierMessage imbriqué
        const lastMessageTime = item.lastMessageTime 
          || item.lastMessageDate
          || item.dateDernierMessage
          || item.dernierMessageTime
          || item.timestamp
          || item.createdAt
          || item.updatedAt
          || (lastMessageObj && typeof lastMessageObj === 'object' ? (
            lastMessageObj.timestamp 
            || lastMessageObj.createdAt 
            || lastMessageObj.date 
            || lastMessageObj.dateCreation
            || lastMessageObj.dateEnvoi
            || lastMessageObj.time
          ) : null);
        
        const mapped: Conversation = {
          id: item.id || item.conversationId,
          name: item.name || item.nom || item.titre || "Conversation",
          lastMessage: lastMessageContent,
          lastMessageTime: lastMessageTime,
          unreadCount: item.unreadCount || item.nonLu || 0,
          avatar: item.avatar || item.image,
        };
        
        console.log("🔍 Élément brut de conversation:", item);
        console.log("📦 Objet lastMessage trouvé:", lastMessageObj);
        console.log("⏰ lastMessageTime trouvé:", lastMessageTime);
        console.log("✅ Élément mappé conversation:", mapped);
        console.log("📋 Toutes les propriétés disponibles:", Object.keys(item));
        
        return mapped;
      });
    
    console.log("Conversations mappées (après mapping):", conversations);
    console.log("Nombre de conversations mappées:", conversations.length);
    
    return conversations;
  } catch (error) {
    console.error('Erreur lors du chargement des conversations:', error);
    throw error;
  }
};
