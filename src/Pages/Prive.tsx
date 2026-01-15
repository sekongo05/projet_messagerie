import { ConversationList } from '../Metier/Conversation/ConversationList';
import type { Conversation } from '../Api/Conversation.api';

type PriveProps = {
  conversations: Conversation[];
  onConversationSelect?: (conversationId: number) => void;
  activeConversationId?: number;
  theme?: 'light' | 'dark';
};

const Prive = ({ 
  conversations,
  onConversationSelect, 
  activeConversationId,
  theme = 'light' 
}: PriveProps) => {
  // Filtrer uniquement les conversations privées
  const privateConversations = conversations.filter(
    (conv: any) => conv.typeConversationCode === 'PRIVEE' || conv.typeConversation === 'PRIVEE'
  );

  const handleConversationSelect = (conversationId: number) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  return (
    <ConversationList
      conversations={privateConversations}
      activeConversationId={activeConversationId}
      onConversationSelect={handleConversationSelect}
      theme={theme}
    />
  );
};

export default Prive;
