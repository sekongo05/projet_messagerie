import { ConversationList } from '../Metier/Conversation/ConversationList';
import { useTheme } from '../mode';

type Conversation = {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  type?: string;
};

type PriveProps = {
  conversations: Conversation[];
  activeConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
};

const Prive = ({
  conversations,
  activeConversationId,
  onConversationSelect,
}: PriveProps) => {
  const { theme } = useTheme();
  
  // Filtrer uniquement les conversations privées
  const priveConversations = conversations.filter(
    (conv) => conv.type === 'prive' || conv.type === 'private' || conv.type === '1'
  );

  return (
    <div>
      <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Privé ({priveConversations.length})
        </h3>
      </div>
      <ConversationList
        conversations={priveConversations}
        activeConversationId={activeConversationId}
        onConversationSelect={onConversationSelect}
        theme={theme}
      />
    </div>
  );
};

export default Prive;
