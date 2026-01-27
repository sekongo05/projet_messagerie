import axios from "./axios";
import { getCurrentUserId } from '../utils/user.utils';

const API_URL = 'http://localhost:8080';

/**
 * Exporte toutes les conversations de l'utilisateur connecté avec tous leurs messages
 * Les messages dans HistoriqueSuppressionMessage sont automatiquement exclus
 */
export const exportAllConversations = async () => {
  try {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      throw new Error('Utilisateur non connecté');
    }
    
    const requestData = {
      user: currentUserId,
      // Les autres champs sont optionnels pour cet endpoint
      isSimpleLoading: false,
      data: {},
      datas: []
    };
    
    const response = await axios.post(
      `${API_URL}/conversation/export`,
      requestData,
      {
        responseType: 'blob',
      }
    );
    
    // Vérifier que la réponse contient bien un fichier
    if (!response.data || response.data.size === 0) {
      throw new Error('Le fichier exporté est vide');
    }
    
    // Créer un lien de téléchargement
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    
    // Nom du fichier avec timestamp pour éviter les écrasements
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.setAttribute('download', `conversations_export_${timestamp}.xlsx`);
    
    document.body.appendChild(link);
    link.click();
    link.remove();
    
    // Nettoyer l'URL
    window.URL.revokeObjectURL(url);
    
    console.log('Export réussi !');
  } catch (error: any) {
    console.error('Erreur lors de l\'export', error);
    
    // Gestion des erreurs spécifiques
    if (error.response) {
      // Erreur de réponse du serveur
      if (error.response.status === 400) {
        throw new Error('Requête invalide. Vérifiez que vous êtes bien connecté.');
      } else if (error.response.status === 401) {
        throw new Error('Vous n\'êtes pas autorisé à effectuer cette action.');
      } else if (error.response.status === 500) {
        throw new Error('Erreur serveur lors de l\'export. Veuillez réessayer plus tard.');
      } else {
        throw new Error(`Erreur serveur: ${error.response.status}`);
      }
    } else if (error.request) {
      // Pas de réponse du serveur
      throw new Error('Impossible de contacter le serveur. Vérifiez votre connexion internet.');
    } else {
      // Erreur lors de la configuration de la requête
      throw error;
    }
  }
};