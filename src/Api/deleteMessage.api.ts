import axios from "./axios";

type DeleteMessageResponse = {
  hasError: boolean;
  status?: {
    code?: string;
    message?: string;
  };
  items?: any[];
};

export const deleteMessage = async (
  id: number,
  userId: number,
  conversationId: number
): Promise<DeleteMessageResponse> => {
  try {
    const payload = {
      user: userId,
      datas: [{ id, conversationId }],
    };
    
    console.log('deleteMessage API appelée avec:', {
      url: '/api/message/delete',
      payload
    });
    
    const response = await axios.post<DeleteMessageResponse>("/api/message/delete", payload, {
      headers: { "Content-Type": "application/json" }
    });
    
    console.log('deleteMessage API réponse:', response.data);
    
    // Vérifier si la réponse indique une erreur
    if (response.data.hasError) {
      const errorMessage = response.data.status?.message || 'Erreur lors de la suppression du message';
      console.error('Erreur dans la réponse API:', errorMessage);
      throw new Error(errorMessage);
    }
    
    return response.data;
  } catch (error: any) {
    console.error("Erreur lors de la suppression du message:", error);
    console.error("Détails de l'erreur API:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      url: error.config?.url
    });
    throw error;
  }
};