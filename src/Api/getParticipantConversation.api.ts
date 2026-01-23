import axios from 'axios';
import { getCurrentUserId } from '../utils/user.utils';

const API_URL = 'http://localhost:8080';

export interface ParticipantConversation {
  id: number;
  conversationId: number;
  userId: number;
  [key: string]: any;
}


export type GetParticipantsOptions = {
  /** Inclure les anciens membres (hasLeft / hasDefinitivelyLeft) pour que tous voient "X a quitté le groupe" */
  includeLeft?: boolean;
};

export const getParticipantsByConversationId = async (
  conversationId: number,
  userId?: number,
  options?: GetParticipantsOptions
) => {
  // Si userId n'est pas fourni, essayer de le récupérer depuis localStorage
  const resolvedUserId = userId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  const data: { conversationId: number; includeLeft?: boolean } = {
    conversationId,
  };
  if (options?.includeLeft === true) {
    data.includeLeft = true;
  }

  try {
    const response = await axios.post(
      `${API_URL}/participantConversation/getByCriteria`,
      {
        user: resolvedUserId,
        isSimpleLoading: false,
        data,
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
