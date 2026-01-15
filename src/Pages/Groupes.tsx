import { ConversationList } from '../Metier/Conversation/ConversationList';
import type { Conversation } from '../Api/Conversation.api';

type GroupesProps = {
  conversations: Conversation[];
  onConversationSelect?: (conversationId: number) => void;
  activeConversationId?: number;
  theme?: 'light' | 'dark';
};

const Groupes = ({ 
  conversations,
  onConversationSelect, 
  activeConversationId,
  theme = 'light' 
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
      theme={theme}
    />
  );
};

export default Groupes;
