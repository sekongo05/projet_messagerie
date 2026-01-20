import { useState } from 'react';
import { ConversationItem } from './ConversationItems';
import type { Conversation } from '../../Api/Conversation.api';
import { exportConversations } from '../../Api/exportConversation.api';
import { useDeleteConversation } from '../../Pages/DeleteConversationHandler';
import { ConfirmDialog } from '../../components/ConfirmDialog';

type ConversationListProps = {
  conversations: Conversation[];
  activeConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
  onConversationDeleted?: () => void;
  theme?: 'light' | 'dark';
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onWarning?: (message: string) => void;
};

export const ConversationList = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  onConversationDeleted,
  theme = 'light',
  onError,
  onSuccess,
  onWarning,
}: ConversationListProps) => {
  // Utiliser le hook personnalisé pour gérer la suppression des conversations
  const { handleDeleteConversation } = useDeleteConversation();
  
  // État pour la confirmation de suppression
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    conversationId: number | null;
  }>({
    isOpen: false,
    conversationId: null,
  });

  // Fonction pour parser et convertir une date en timestamp
  const parseDate = (dateString?: string): number => {
    if (!dateString) return 0;
    
    try {
      const raw = dateString.trim();
      
      // Format DD/MM/YYYY HH:mm:ss
      if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(raw)) {
        const [datePart, timePart] = raw.split(/\s+/);
        const [day, month, year] = datePart.split('/');
        const iso = `${year}-${month}-${day}T${timePart}`;
        return new Date(iso).getTime();
      }
      
      // Format DD/MM/YYYY
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [day, month, year] = raw.split('/');
        const iso = `${year}-${month}-${day}T00:00:00`;
        return new Date(iso).getTime();
      }
      
      // Format ISO ou autre
      const date = new Date(raw);
      return isNaN(date.getTime()) ? 0 : date.getTime();
    } catch {
      return 0;
    }
  };

  // Trier les conversations du plus récent au moins récent
  const sortedConversations = [...conversations].sort((a, b) => {
    const timeA = parseDate((a as any).lastMessageTime || (a as any).createdAt);
    const timeB = parseDate((b as any).lastMessageTime || (b as any).createdAt);
    return timeB - timeA; // Décroissant : plus récent en premier
  });

  if (sortedConversations.length === 0) {
    return (
      <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Aucune conversation</p>
      </div>
    );
  }

  // Fonction pour exporter une conversation
  const handleExportConversation = async (conversationId: number) => {
    try {
      await exportConversations(conversationId);
    } catch (error: any) {
      console.error('Erreur lors de l\'export de la conversation:', error);
      alert('Erreur lors de l\'export de la conversation. Veuillez réessayer.');
    }
  };

  // Fonction pour ouvrir le dialogue de confirmation
  const handleDeleteClick = (conversationId: number) => {
    // Vérifier si c'est une conversation de groupe
    const conversation = conversations.find(c => c.id === conversationId);
    const conv = conversation as any;
    const isGroup = conv?.typeConversationCode === 'GROUP' || conv?.typeConversation === 'GROUP';
    
    // Pour les groupes, afficher un message d'avertissement au lieu de demander confirmation
    if (isGroup) {
      if (onWarning) {
        onWarning('Vous devez quitter le groupe avant de le supprimer');
      } else if (onError) {
        onError('Vous devez quitter le groupe avant de le supprimer');
      } else {
        alert('Vous devez quitter le groupe avant de le supprimer');
      }
      return;
    }
    
    // Pour les conversations privées, ouvrir le dialogue de confirmation
    setConfirmationDialog({
      isOpen: true,
      conversationId,
    });
  };

  // Fonction pour confirmer et exécuter la suppression
  const handleConfirmDelete = async () => {
    if (!confirmationDialog.conversationId) return;

    const conversationId = confirmationDialog.conversationId;
    setConfirmationDialog({ isOpen: false, conversationId: null });

    try {
      // Le hook gère la suppression et appelle onSuccess pour rafraîchir la liste
      await handleDeleteConversation(conversationId, () => {
        // Afficher un toast de succès
        if (onSuccess) {
          onSuccess('Conversation supprimée avec succès');
        }
        // Rafraîchir la liste
        if (onConversationDeleted) {
          onConversationDeleted();
        }
      });
    } catch (error: any) {
      console.error('Erreur lors de la suppression de la conversation:', error);
      const errorMessage = error.message || 'Erreur lors de la suppression de la conversation. Veuillez réessayer.';
      
      // Afficher un toast d'erreur au lieu d'une alerte
      if (onError) {
        onError(errorMessage);
      } else {
        // Fallback vers alert si pas de callback
        alert(errorMessage);
      }
    }
  };

  return (
    <>
      <div className={`h-full overflow-y-auto ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        {sortedConversations.map((conversation) => {
          const conv = conversation as any;
          const isGroup = conv?.typeConversationCode === 'GROUP' || conv?.typeConversation === 'GROUP';
          
          return (
            <ConversationItem
              key={conversation.id}
              id={conversation.id}
              name={(conversation as any).name || conversation.titre}
              lastMessage={conversation.lastMessage}
              lastMessageTime={(conversation as any).lastMessageTime || (conversation as any).createdAt}
              unreadCount={(conversation as any).unreadCount}
              avatar={conversation.avatar}
              isActive={conversation.id === activeConversationId}
              onClick={() => onConversationSelect(conversation.id)}
              onExport={handleExportConversation}
              onDelete={handleDeleteClick}
              isGroup={isGroup}
              theme={theme}
            />
          );
        })}
      </div>

      {/* Dialogue de confirmation personnalisé */}
      <ConfirmDialog
        isOpen={confirmationDialog.isOpen}
        title="Supprimer la conversation"
        message="Êtes-vous sûr de vouloir supprimer cette conversation ?"
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmationDialog({ isOpen: false, conversationId: null })}
        theme={theme}
      />
    </>
  );
};

