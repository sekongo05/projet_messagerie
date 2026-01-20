import { ConversationList } from '../Metier/Conversation/ConversationList';
import type { Conversation } from '../Api/Conversation.api';

type PriveProps = {
  conversations: Conversation[];
  onConversationSelect?: (conversationId: number) => void;
  onConversationDeleted?: () => void;
  activeConversationId?: number;
  theme?: 'light' | 'dark';
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onWarning?: (message: string) => void;
};

const Prive = ({ 
  conversations,
  onConversationSelect,
  onConversationDeleted,
  activeConversationId,
  theme = 'light',
  onError,
  onSuccess,
  onWarning,
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
      onConversationDeleted={onConversationDeleted}
      theme={theme}
      onError={onError}
      onSuccess={onSuccess}
      onWarning={onWarning}
    />
  );
};

export default Prive;
