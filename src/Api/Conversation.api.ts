// src/api/conversation.api.ts
import axios from 'axios';

const API_URL = 'http://localhost:8080';

export interface Conversation {
  id: number;
  titre: string;
  lastMessage?: string;
  interlocuteurName?: string;
  typeConversationCode?: string;
  [key: string]: any;
}

export const getConversations = async () => {
  try {
    const response = await axios.post(`${API_URL}/conversation/getByCriteria`, {
      user: 1,
      isSimpleLoading: false,
      data: {}
    });
        console.log("data de conversation "+ response.data)

    return response.data;
  } catch (error) {
    console.error('Erreur récupération conversations', error);
    throw error;
  }
};