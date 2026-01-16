import axios from "axios";

const API_URL = 'http://localhost:8080';


export const promoteAdmin = async (conversationId: number, userId: number, isAdmin: boolean, currentUserId: number) => {
  try {
    const response = await axios.post(`${API_URL}/participantConversation/promoteAdmin`, {
      user: currentUserId,
      datas: [
        {
          conversationId: conversationId,
          userId: userId,
          isAdmin: isAdmin
        }
      ]
    });
    console.log("data de promotion admin " + response.data);

    return response.data;
  } catch (error) {
    console.error('Erreur promotion admin', error);
    throw error;
  }
};