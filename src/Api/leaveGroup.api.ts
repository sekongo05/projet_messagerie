import axios from 'axios';

const API_URL = 'http://localhost:8080';

/**
 * Quitte un groupe (premier ou deuxième départ)
 * @param conversationId - ID de la conversation (groupe)
 * @param userId - ID de l'utilisateur qui quitte (peut être différent si c'est un admin qui retire)
 * @param requestingUserId - ID de l'utilisateur qui fait la requête (optionnel, par défaut = userId)
 * @returns Promise avec la réponse de l'API
 */
export const leaveGroup = async (
  conversationId: number,
  userId: number,
  requestingUserId?: number
): Promise<any> => {
  try {
    // Si requestingUserId n'est pas fourni, utiliser userId (cas où l'utilisateur se retire lui-même)
    const resolvedRequestingUserId = requestingUserId ?? userId;
    
    const response = await axios.post(
      `${API_URL}/participantConversation/leaveGroup`,
      {
        user: resolvedRequestingUserId,
        datas: [
          {
            conversationId: conversationId,
            userId: userId
          }
        ]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'lang': 'fr'
        }
      }
    );

    console.log("Participant a quitté le groupe :", response.data);
    return response.data;
  } catch (error: any) {
    console.error('Erreur lors de la sortie du groupe', error);
    if (error.response?.data) {
      console.error('Détails de l\'erreur :', error.response.data);
    }
    throw error;
  }
};

// Exemple d'utilisation :
// - L'utilisateur se retire lui-même :
//   await leaveGroup(123, 1); // conversationId=123, userId=1
//
// - Un admin retire un participant :
//   await leaveGroup(123, 5, 1); // conversationId=123, userId=5 (retiré), requestingUserId=1 (admin)
