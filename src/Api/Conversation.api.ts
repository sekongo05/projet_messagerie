// src/api/conversation.api.ts
import axios from 'axios';
import { getCurrentUserId } from '../utils/user.utils';

const API_URL = 'http://localhost:8080';

export interface Conversation {
  id: number;
  titre: string;
  lastMessage?: string;
  interlocuteurName?: string;
  typeConversationCode?: string;
  [key: string]: any;
}

export const getConversations = async (userId?: number) => {
  // Si userId n'est pas fourni, essayer de le récupérer depuis localStorage
  const resolvedUserId = userId ?? getCurrentUserId();
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  try {
    const response = await axios.post(`${API_URL}/conversation/getByCriteria`, {
      user: resolvedUserId,
      isSimpleLoading: false,
      data:{}
    });
    console.log("data de conversation", response.data);

    return response.data;
  } catch (error) {
    console.error('Erreur récupération conversations', error);
    throw error;
  }
};