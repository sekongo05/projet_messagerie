// src/api/conversation.api.ts
import axios from 'axios';
import { getCurrentUserId } from '../utils/user.utils';

const API_URL = 'http://localhost:8080';

export interface ParticipantConversation {
  id: number;
  conversationId: number;
  userId: number;
  [key: string]: any;
}

export const getParticipantsByConversationId = async (
  conversationId: number,
  userId?: number
) => {
  // Si userId n'est pas fourni, essayer de le récupérer depuis localStorage
  const resolvedUserId = userId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  try {
    const response = await axios.post(
      `${API_URL}/participantConversation/getByCriteria`,
      {
        user: resolvedUserId,
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

export const deleteParticipant = async (
  participantId: number,
  userId?: number
) => {
  // Si userId n'est pas fourni, essayer de le récupérer depuis localStorage
  const resolvedUserId = userId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  try {
    const response = await axios.post(
      `${API_URL}/participantConversation/delete`,
      {
        user: resolvedUserId,
        datas: [{ id: participantId }]
      }
    );

    console.log("Participant supprimé :", response.data);
    return response.data;

  } catch (error) {
    console.error(
      'Erreur lors de la suppression du participant',
      error
    );
    throw error;
  }
};