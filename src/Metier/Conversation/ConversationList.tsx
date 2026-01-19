import { ConversationItem } from './ConversationItems';
import type { Conversation } from '../../Api/Conversation.api';
import { exportConversations } from '../../Api/exportConversation.api';

type ConversationListProps = {
  conversations: Conversation[];
  activeConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
  theme?: 'light' | 'dark';
};

export const ConversationList = ({
  conversations,
  activeConversationId,
  onConversationSelect,
  theme = 'light',
}: ConversationListProps) => {
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

  return (
    <div className={`h-full overflow-y-auto ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      {sortedConversations.map((conversation) => (
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
          theme={theme}
        />
      ))}
    </div>
  );
};

