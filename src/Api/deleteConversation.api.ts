import axios from "axios";

const API_URL = "http://localhost:8080";

export const deleteConversation = async (
  conversationId: number,
  userId: number
) => {
  try {
    const response = await axios.post(
      `${API_URL}/conversation/delete`,
      {
        user: userId,
        datas: [
          {
            id: conversationId,
          },
        ],
      },
      {
        headers: {
          "Content-Type": "application/json",
          lang: "fr",
        },
      }
    );

    console.log("Suppression / clean conversation :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur suppression/clean conversation :", error);
    throw error;
  }
};
