import axios from "axios";

const API_URL = 'http://localhost:8080';


export const deleteParticipant = async (conversationId: number, userId: number) => {
  try {
    const response = await axios.post(`${API_URL}/participantConversation/delete`, {
      user: 1,
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