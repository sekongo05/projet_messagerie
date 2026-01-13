import axios from './axios';

// Types
export type Message = {
  id: number;
  content?: string;
  image?: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  typeMessage: '1' | '2' | '3';
  conversationId: number;
};

type SendMessageData = {
  conversationId: number;
  content: string;
};

/**
 * Fonction pour valider et normaliser un timestamp
 */
const normalizeTimestamp = (value: any): string => {
  if (!value) return new Date().toISOString();
  
  // Si c'est déjà une string valide, vérifier qu'elle peut être parsée
  if (typeof value === 'string') {
    // Ignorer les valeurs invalides explicites
    if (value.toLowerCase().includes('invalid')) {
      return new Date().toISOString();
    }
    
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  
  // Fallback : timestamp actuel
  return new Date().toISOString();
};

/**
 * Fonction pour valider un timestamp
 */
const isValidTimestamp = (timestamp: string): boolean => {
  if (!timestamp) return false;
  const date = new Date(timestamp);
  return !isNaN(date.getTime());
};

/**
 * Récupère tous les messages d'une conversation
 */
export const getMessagesByConversation = async (
  conversationId: number,
  userId: number = 1
): Promise<Message[]> => {
  try {
    const response = await axios.post(
      "/api/message/getByCriteria",
      {
        user: userId,
        data: { conversationId },
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Réponse API brute des messages:", response.data);

    // Les données sont probablement dans response.data.items aussi
    const data = Array.isArray(response.data)
      ? response.data
      : response.data.items || response.data.data || response.data.content || [];

    // Mapping correct pour les messages
    const messages: Message[] = data
      .filter((item: any) => item && (item.id || item.messageId))
      .map((item: any) => {
        // Récupérer le timestamp avec plusieurs variantes possibles
        const rawTimestamp = item.timestamp 
          || item.createdAt 
          || item.date 
          || item.dateCreation
          || item.dateEnvoi
          || item.time
          || item.heure;
        
        // Normaliser le timestamp pour s'assurer qu'il est valide
        const timestamp = normalizeTimestamp(rawTimestamp);
        
        console.log("Message item timestamp brut:", {
          timestamp: item.timestamp,
          createdAt: item.createdAt,
          date: item.date,
          dateCreation: item.dateCreation,
          rawTimestamp: rawTimestamp,
          timestampFinal: timestamp
        });
        
        return {
          id: item.id || item.messageId,
          content: item.content || item.contenu || item.message || "",
          image: item.image || item.fichier || item.file,
          senderId: item.senderId || item.sender?.id || item.userId || item.user?.id || item.expediteurId || item.expediteur?.id || 0,
          senderName: item.senderName || item.sender?.name || item.sender?.nom || item.user?.name || item.user?.nom || item.expediteur || item.expediteur?.nom || "Unknown",
          conversationId: item.conversationId || item.conversation?.id || conversationId,
          timestamp: timestamp,
          typeMessage: (item.typeMessage || item.type || (item.image ? '2' : '1')) as '1' | '2' | '3',
        };
      });

    console.log("Messages mappés:", messages);
    return messages;
  } catch (error) {
    console.error("Erreur lors du chargement des messages:", error);
    throw error;
  }
};

/**
 * Récupère le dernier message d'une conversation (avec son timestamp valide)
 */
export const getLastMessageFromMessages = (messages: Message[]): Message | null => {
  if (messages.length === 0) return null;

  // Filtrer d'abord les messages avec des timestamps valides
  const validMessages = messages.filter(msg => isValidTimestamp(msg.timestamp));
  
  if (validMessages.length === 0) return null;

  // Trier les messages par timestamp (plus récent en premier)
  const sortedMessages = [...validMessages].sort((a, b) => {
    const dateA = new Date(a.timestamp).getTime();
    const dateB = new Date(b.timestamp).getTime();
    return dateB - dateA; // Tri décroissant (plus récent en premier)
  });
  
  return sortedMessages[0];
};

/**
 * Envoie un nouveau message
 */
export const sendMessage = async (
  messageData: SendMessageData,
  userId: number = 1
): Promise<any> => {
  try {
    const response = await axios.post(
      "/api/message/create",
      {
        user: userId,
        datas: [
          {
            conversationId: messageData.conversationId,
            content: messageData.content,
          },
        ],
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log("Message envoyé :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message :", error);
    throw error;
  }
};
