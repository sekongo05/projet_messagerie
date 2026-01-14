import axios from "axios";

type SendMessageData = {
  conversationId: number;
  content: string;
};


export const sendMessage = async (
  messageData: SendMessageData,
  userId: number = 1
): Promise<any> => {
  try {
    const response = await axios.post(
      "/api/message/create",
      {
        user: userId,
        datas: [
          {
            conversationId: messageData.conversationId,
            content: messageData.content,
          },
        ],
      },
      {
        headers: { "Content-Type": "application/json" }
      }
    );

    console.log("Message envoyé :", response.data);
    return response.data;
  } catch (error) {
    console.error("Erreur lors de l'envoi du message :", error);
    throw error;
  }
};
