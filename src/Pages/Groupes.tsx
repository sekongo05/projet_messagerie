import { ConversationList } from '../Metier/Conversation/ConversationList';
import type { Conversation } from '../Api/Conversation.api';

type GroupesProps = {
  conversations: Conversation[];
  onConversationSelect?: (conversationId: number) => void;
  onConversationDeleted?: () => void;
  activeConversationId?: number;
  theme?: 'light' | 'dark';
  currentUserId?: number;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onWarning?: (message: string) => void;
};

const Groupes = ({ 
  conversations,
  onConversationSelect,
  onConversationDeleted,
  activeConversationId,
  theme = 'light',
  currentUserId,
  onError,
  onSuccess,
  onWarning,
}: GroupesProps) => {
  // Filtrer uniquement les conversations de groupe
  const groupConversations = conversations.filter(
    (conv: any) => conv.typeConversationCode === 'GROUP' || conv.typeConversation === 'GROUP'
  );

  const handleConversationSelect = (conversationId: number) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  return (
    <ConversationList
      conversations={groupConversations}
      activeConversationId={activeConversationId}
      onConversationSelect={handleConversationSelect}
      onConversationDeleted={onConversationDeleted}
      theme={theme}
      currentUserId={currentUserId}
      onError={onError}
      onSuccess={onSuccess}
      onWarning={onWarning}
    />
  );
};

export default Groupes;
