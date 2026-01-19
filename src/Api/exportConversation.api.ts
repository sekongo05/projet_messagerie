import axios from "./axios";

const API_URL = 'http://localhost:8080';

export const exportConversations = async (conversationId?: number) => {
  try {
    const requestData: any = {
      user: 1,
      isSimpleLoading: false,
      data: {},
      datas: []
    };
    
    // Si un ID est fourni, filtrer uniquement cette conversation
    if (conversationId) {
      requestData.data.id = conversationId;
    }
    
    const response = await axios.post(
      `${API_URL}/conversation/export`,
      requestData,
      {
        responseType: 'blob',
      }
    );
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const fileName = conversationId 
      ? `conversation_${conversationId}_export.xlsx`
      : 'conversations_export.xlsx';
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Erreur lors de l\'export', error);
    throw error;
  }
};

// Utilisation :
// exportConversations()           // Exporte toutes les conversations
// exportConversations(123)        // Exporte uniquement la conversation avec l'ID 123