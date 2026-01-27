import axios from "./axios";
import { getCurrentUserId } from '../utils/user.utils';

const API_URL = 'http://localhost:8080';

/**
 * Exporte une conversation détaillée vers un fichier Excel
 * @param conversationId - ID de la conversation à exporter (obligatoire)
 */
export const exportConversations = async (conversationId: number) => {
  try {
    // Vérifier que l'ID de la conversation est fourni
    if (!conversationId) {
      throw new Error('L\'ID de la conversation est obligatoire pour l\'export');
    }
    
    // Récupérer l'ID de l'utilisateur connecté
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Utilisateur non connecté');
    }
    
    // Structure de la requête attendue par l'endpoint
    const requestData = {
      user: currentUserId,
      datas: [
        {
          id: conversationId
        }
      ]
    };
    
    const response = await axios.post(
      `${API_URL}/conversation/export-conversation`,
      requestData,
      {
        responseType: 'blob',
      }
    );
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    const fileName = `conversation_${conversationId}_export.xlsx`;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    console.log(`Export réussi pour la conversation ${conversationId}`);
  } catch (error: any) {
    console.error('Erreur lors de l\'export', error);
    
    // Gestion des erreurs spécifiques
    if (error.response) {
      // Erreur de réponse du serveur
      if (error.response.status === 400) {
        throw new Error('Requête invalide. Vérifiez que l\'ID de la conversation est correct.');
      } else if (error.response.status === 403) {
        throw new Error('Vous n\'êtes pas autorisé à exporter cette conversation.');
      } else if (error.response.status === 404) {
        throw new Error('Conversation introuvable.');
      } else {
        throw new Error(`Erreur serveur: ${error.response.status}`);
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } else {
      // Erreur lors de la configuration de la requête
      throw error;
    }
  }
};

// Utilisation :
// exportConversation(123)  // Exporte la conversation avec l'ID 123