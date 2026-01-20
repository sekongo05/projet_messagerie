import { useState } from 'react';
import { deleteConversation } from '../Api/deleteConversation.api';
import { getCurrentUserId } from '../utils/user.utils';

type DeleteConversationHookReturn = {
  isDeleting: boolean;
  handleDeleteConversation: (conversationId: number, onSuccess?: () => void) => Promise<void>;
};

/**
 * Hook personnalisé pour gérer la suppression des conversations
 * Simplifié : ne gère pas d'état local car le backend filtre automatiquement
 * les conversations avec hasCleaned = true lors de getByCriteria
 */
export const useDeleteConversation = (): DeleteConversationHookReturn => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  /**
   * Fonction pour supprimer une conversation
   * @param conversationId - ID de la conversation à supprimer
   * @param onSuccess - Callback appelé après succès (utilisé pour rafraîchir la liste)
   */
  const handleDeleteConversation = async (
    conversationId: number,
    onSuccess?: () => void
  ): Promise<void> => {
    if (isDeleting) {
      return; // Éviter les suppressions multiples simultanées
    }

    try {
      setIsDeleting(true);
      const currentUserId = getCurrentUserId() ?? 1;
      
      // Appeler l'API de suppression
      const response = await deleteConversation(conversationId, currentUserId);
      
      // Vérifier que la suppression a réussi
      // La réponse peut avoir différentes structures, on vérifie plusieurs possibilités
      let hasError = false;
      let errorMessage = '';
      
      if (response) {
        // Vérifier response.hasError
        if (response.hasError === true || response.hasError === 1 || response.hasError === 'true') {
          hasError = true;
          errorMessage = response.status?.message || response.message || 'Erreur lors de la suppression';
        }
        // Vérifier response.data.hasError
        else if (response.data && (response.data.hasError === true || response.data.hasError === 1)) {
          hasError = true;
          errorMessage = response.data.status?.message || response.data.message || 'Erreur lors de la suppression';
        }
      }
      
      if (hasError) {
        throw new Error(errorMessage);
      }
      
      // Si pas d'erreur, la suppression a réussi
      // Appeler le callback de succès si fourni
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      const errorMessage = error.response?.data?.status?.message 
        || error.response?.data?.message
        || error.message 
        || 'Erreur lors de la suppression de la conversation. Veuillez réessayer.';
      throw new Error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    isDeleting,
    handleDeleteConversation,
  };
};

// Le hook useDeleteConversation est utilisé directement dans les composants
// Exemple d'utilisation dans ConversationList.tsx:
//
// const { handleDeleteConversation } = useDeleteConversation();
// await handleDeleteConversation(conversationId, onSuccess);
