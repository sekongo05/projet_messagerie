import axios from 'axios';
import { getCurrentUserId } from '../utils/user.utils';

const API_URL = 'http://localhost:8080';


export const deleteParticipant = async (
  options: { participantId?: number; conversationId?: number; userId?: number },
  requestingUserId?: number
) => {
  // Déterminer l'ID de l'utilisateur qui fait la requête
  const resolvedRequestingUserId = requestingUserId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedRequestingUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  // Préparer le payload selon le format utilisé
  let payloadData: any;

  if (options.participantId !== undefined) {
    // Format 1 : Utilisation de participantId (ID de la relation)
    payloadData = { id: options.participantId };
  } else if (options.conversationId !== undefined && options.userId !== undefined) {
    // Format 2 : Utilisation de conversationId + userId
    payloadData = {
      conversationId: options.conversationId,
      userId: options.userId
    };
  } else {
    throw new Error('Format invalide : fournissez soit participantId, soit conversationId + userId');
  }

  try {
    const response = await axios.post(
      `${API_URL}/participantConversation/delete`,
      {
        user: resolvedRequestingUserId,
        datas: [payloadData]
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
