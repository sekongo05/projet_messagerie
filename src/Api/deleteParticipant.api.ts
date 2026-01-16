import axios from "axios";

const API_URL = 'http://localhost:8080';


export const deleteParticipant = async (conversationId: number, userId: number, currentUserId?: number) => {
  try {
    // Si currentUserId n'est pas fourni, utiliser userId (cas où l'utilisateur se supprime lui-même)
    const requestingUserId = currentUserId !== undefined ? currentUserId : userId;
    
    const response = await axios.post(`${API_URL}/participantConversation/delete`, {
      user: requestingUserId,
      datas: [
        {
          conversationId: conversationId,
          userId: userId
        }
      ]
    });
    console.log("data de suppression participant " + response.data);

    return response.data;
  } catch (error) {
    console.error('Erreur suppression participant', error);
    throw error;
  }
};