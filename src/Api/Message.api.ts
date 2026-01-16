import axios from "./axios";
import { uploadImageMessage as uploadImageMessageAPI, type UploadImageData } from './uploadImage.api';

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
      UTILS
      ========================= */

const normalizeDate = (value: string): string => {
  if (!value) return new Date().toISOString();

  // format : DD/MM/YYYY HH:mm:ss
  if (/^\d{2}\/\d{2}\/\d{4}/.test(value)) {
    const [date, time = "00:00:00"] = value.split(" ");
    const [day, month, year] = date.split("/");
    return new Date(`${year}-${month}-${day}T${time}`).toISOString();
  }

  const date = new Date(value);
  return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
};

export const getLastMessageFromMessages = (messages: Message[]): Message | null => {
  const valid = messages.filter((m) => !!m.createdAt && !isNaN(new Date(m.createdAt).getTime()));
  if (valid.length === 0) return null;
  return [...valid].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
};

    /* =========================
      API CALL
      ========================= */

export const getMessagesByConversation = async (
  conversationId: number,
  userId: number = 1
): Promise<Message[]> => {
  const payload: MessageRequest = {
    user: userId,
    isSimpleLoading: false,
    data: {
      conversationId,
    },
  };

  const response = await axios.post<MessageResponse>("/api/message/getByCriteria", payload);

  if (response.data.hasError) {
    throw new Error(response.data.status?.message || "Erreur lors du chargement des messages");
  }

  return (response.data.items || []).map((item) => {
    // Normaliser l'URL de l'image si elle existe
    // Vérifier plusieurs champs possibles pour l'URL de l'image
    let imageUrl = item.messageImgUrl || (item as any).imgUrl || (item as any).imageUrl || (item as any).fileUrl || (item as any).messageImg || null;
    
    // Si l'URL est une chaîne vide ou "null", la mettre à null
    if (imageUrl === '' || imageUrl === 'null' || imageUrl === null || imageUrl === undefined) {
      imageUrl = null;
    } else if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      const trimmedUrl = imageUrl.trim();
      
      // Si l'URL commence par http:// ou https://, la garder telle quelle
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        imageUrl = trimmedUrl;
      }
      // Si l'URL commence par /files, elle est déjà correcte (sera proxy par Vite)
      else if (trimmedUrl.startsWith('/files')) {
        imageUrl = trimmedUrl;
      }
      // Si l'URL contient "images/" ou se termine par une extension d'image
      else if (trimmedUrl.includes('images/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(trimmedUrl)) {
        // Si elle ne commence pas par /, ajouter /files/
        if (!trimmedUrl.startsWith('/')) {
          imageUrl = `/files/${trimmedUrl}`;
        } else if (!trimmedUrl.startsWith('/files')) {
          // Si elle commence par / mais pas /files, ajouter /files
          imageUrl = `/files${trimmedUrl}`;
        } else {
          imageUrl = trimmedUrl;
        }
      }
      // Autres cas : ajouter / si nécessaire
      else if (!trimmedUrl.startsWith('/')) {
        imageUrl = `/${trimmedUrl}`;
      } else {
        imageUrl = trimmedUrl;
      }
    } else {
      imageUrl = null;
    }
    
    // Debug: logger les messages avec images
    if (imageUrl) {
      console.log('Message avec image trouvé:', { 
        id: item.id, 
        messageImgUrl: imageUrl, 
        originalUrl: item.messageImgUrl,
        normalized: imageUrl !== item.messageImgUrl
      });
    }
    
    return {
      ...item,
      createdAt: normalizeDate(item.createdAt),
      messageImgUrl: imageUrl,
    };
  });
};

export const sendMessage = async (
  messageData: SendMessageData,
  userId: number = 1
): Promise<Message> => {
  const response = await axios.post<SendMessageResponse>("/api/message/create", {
    user: userId,
    isSimpleLoading: false,
    datas: [
      {
        conversationId: messageData.conversationId,
        content: messageData.content,
      },
    ],
  });

  if (response.data.hasError) {
    throw new Error(response.data.status?.message || "Erreur lors de l'envoi du message");
  }

  const created = response.data.items?.[0];
  if (!created) {
    // fallback “safe”
    return {
      id: Date.now(),
      content: messageData.content,
      conversationId: messageData.conversationId,
      createdAt: new Date().toISOString(),
      createdBy: userId,
      isDeleted: false,
      typeMessage: 1,
    };
  }

  return {
    ...created,
    createdAt: normalizeDate(created.createdAt),
  };
};

// Fonction pour envoyer un message TEXTE uniquement (JSON)
export const sendTextMessage = async (
  messageData: SendMessageData,
  userId: number = 1
): Promise<Message> => {
  const response = await axios.post<SendMessageResponse>("/api/message/create", {
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
  });

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
      createdBy: userId,
      isDeleted: false,
      typeMessage: 1,
    };
  }

  return {
    ...created,
    createdAt: normalizeDate(created.createdAt),
  };
};

// Fonction pour uploader un fichier image (multipart/form-data)
// Utilise l'API centralisée dans uploadImage.api.ts
export const uploadImageMessage = async (
  imageData: UploadImageData,
  userId: number = 1
): Promise<Message> => {
  try {
    const response = await uploadImageMessageAPI(imageData, userId);

    if (response.hasError) {
      throw new Error(response.status?.message || "Erreur lors de l'upload de l'image");
    }

    const created = response.items?.[0];
    if (!created) {
      throw new Error("Aucun message créé après l'upload");
    }

    // Debug: logger la réponse complète pour voir la structure
    console.log('Réponse uploadImageMessage complète:', { response, created });

    // Normaliser l'URL de l'image si elle existe - vérifier plusieurs champs possibles
    let imageUrl = created.messageImgUrl || (created as any).imgUrl || (created as any).imageUrl || (created as any).fileUrl || (created as any).messageImg || null;
    
    // Si l'URL est une chaîne vide ou "null", la mettre à null
    if (imageUrl === '' || imageUrl === 'null' || imageUrl === null || imageUrl === undefined) {
      imageUrl = null;
    } else if (typeof imageUrl === 'string' && imageUrl.trim() !== '') {
      const trimmedUrl = imageUrl.trim();
      
      // Si l'URL commence par http:// ou https://, la garder telle quelle
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        imageUrl = trimmedUrl;
      }
      // Si l'URL commence par /files, elle est déjà correcte
      else if (trimmedUrl.startsWith('/files')) {
        imageUrl = trimmedUrl;
      }
      // Si l'URL contient "images/" ou se termine par une extension d'image
      else if (trimmedUrl.includes('images/') || /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(trimmedUrl)) {
        // Si elle ne commence pas par /, ajouter /files/
        if (!trimmedUrl.startsWith('/')) {
          imageUrl = `/files/${trimmedUrl}`;
        } else if (!trimmedUrl.startsWith('/files')) {
          // Si elle commence par / mais pas /files, ajouter /files
          imageUrl = `/files${trimmedUrl}`;
        } else {
          imageUrl = trimmedUrl;
        }
      }
      // Autres cas : ajouter / si nécessaire
      else if (!trimmedUrl.startsWith('/')) {
        imageUrl = `/${trimmedUrl}`;
      } else {
        imageUrl = trimmedUrl;
      }
    } else {
      imageUrl = null;
    }
    
    // Debug: logger le message créé avec image
    if (imageUrl) {
      console.log('Message image créé avec URL:', { 
        id: created.id, 
        messageImgUrl: imageUrl, 
        originalUrl: created.messageImgUrl,
        normalized: imageUrl !== created.messageImgUrl,
        originalCreated: created 
      });
    } else {
      console.warn('Aucune URL d\'image trouvée dans le message créé:', created);
    }
    
    return {
      ...created,
      createdAt: normalizeDate(created.createdAt),
      messageImgUrl: imageUrl,
    };
  } catch (error: any) {
    console.error("Erreur lors de l'upload de l'image :", error);
    throw error;
  }
};