import axios from "./axios";
import { uploadImageMessage as uploadImageMessageAPI, type UploadImageData } from './uploadImage.api';
import { getCurrentUserId } from '../utils/user.utils';
import { normalizeMessages, normalizeMessage, getLastMessageFromMessages as getLastMessageUtil } from '../Metier/Messages/message.utils';

/* =========================
   TYPES
   ========================= */

export type Message = {
  id: number;
  content: string;
  conversationId: number;
  createdAt: string; // ISO normalisé
  createdBy: number;
  isDeleted: boolean;
  typeMessage?: number;
  typeMessageCode?: string;
  typeMessageLibelle?: string;
  // champs vus dans ton JSON (create)
  senderName?: string;
  recipientName?: string;
  messageImgUrl?: string | null;
};

type MessageRequest = {
  user: number;
  isSimpleLoading: boolean;
  data: {
    conversationId?: number;
  };
};

type MessageResponse = {
  hasError: boolean;
  status?: {
    code?: string;
    message?: string;
  };
  count: number;
  items: Message[];
};

type SendMessageData = {
  conversationId: number;
  content: string;
};

// Export du type UploadImageData depuis uploadImage.api.ts pour utilisation externe
export type { UploadImageData };

type SendMessageResponse = {
  hasError: boolean;
  status?: {
    code?: string;
    message?: string;
  };
  items: Message[];
};

/* =========================
   API CALLS
   ========================= */

/**
 * Récupère les messages d'une conversation
 */
export const getMessagesByConversation = async (
  conversationId: number,
  userId?: number
): Promise<Message[]> => {
  const resolvedUserId = userId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  const payload: MessageRequest = {
    user: resolvedUserId,
    isSimpleLoading: false,
    data: {
      conversationId,
    },
  };

  const response = await axios.post<MessageResponse>("/api/message/getByCriteria", payload);

  if (response.data.hasError) {
    throw new Error(response.data.status?.message || "Erreur lors du chargement des messages");
  }

  // Normaliser les messages avec la logique métier
  return normalizeMessages(response.data.items || []);
};

/**
 * Envoie un message texte
 */
export const sendTextMessage = async (
  messageData: SendMessageData,
  userId?: number
): Promise<Message> => {
  const resolvedUserId = userId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  const response = await axios.post<SendMessageResponse>(
    "/api/message/create",
    {
      user: resolvedUserId,
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

  if (response.data.hasError) {
    throw new Error(response.data.status?.message || "Erreur lors de l'envoi du message");
  }

  const created = response.data.items?.[0];
  if (!created) {
    // fallback "safe"
    return {
      id: Date.now(),
      content: messageData.content,
      conversationId: messageData.conversationId,
      createdAt: new Date().toISOString(),
      createdBy: resolvedUserId,
      isDeleted: false,
      typeMessage: 1,
    };
  }

  // Normaliser le message avec la logique métier
  return normalizeMessage(created);
};

/**
 * Upload un message avec image
 */
export const uploadImageMessage = async (
  imageData: UploadImageData,
  userId?: number
): Promise<Message> => {
  const resolvedUserId = userId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  try {
    const response = await uploadImageMessageAPI(imageData, resolvedUserId);

    if (response.hasError) {
      throw new Error(response.status?.message || "Erreur lors de l'upload de l'image");
    }

    const created = response.items?.[0];
    if (!created) {
      throw new Error("Aucun message créé après l'upload");
    }

    // Debug: logger la réponse complète
    console.log('Réponse uploadImageMessage complète:', { response, created });

    // Normaliser le message avec la logique métier
    const normalized = normalizeMessage(created);
    
    if (normalized.messageImgUrl) {
      console.log('Message image créé avec URL:', { 
        id: normalized.id, 
        messageImgUrl: normalized.messageImgUrl, 
        originalUrl: created.messageImgUrl,
        normalized: normalized.messageImgUrl !== created.messageImgUrl
      });
    } else {
      console.warn('Aucune URL d\'image trouvée dans le message créé:', created);
    }
    
    return normalized;
  } catch (error: any) {
    console.error("Erreur lors de l'upload de l'image :", error);
    throw error;
  }
};

// Export de la fonction utilitaire pour compatibilité
export { getLastMessageUtil as getLastMessageFromMessages };
