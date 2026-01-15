// src/api/conversation.api.ts
import axios from 'axios';

const API_URL = 'http://localhost:8080';

export interface ParticipantConversation {
  id: number;
  conversationId: number;
  userId: number;
  [key: string]: any;
}

export const getParticipantsByConversationId = async (
  conversationId: number
) => {
  try {
    const response = await axios.post(
      `${API_URL}/participantConversation/getByCriteria`,
      {
        user: 1,
        isSimpleLoading: false,
        data: {
          conversationId: conversationId
        }
      }
    );

    console.log("Participants de la conversation :", response.data);
    return response.data;

  } catch (error) {
    console.error(
      'Erreur récupération participants de la conversation',
      error
    );
    throw error;
  }
};