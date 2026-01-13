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

type GroupesProps = {
  conversations: Conversation[];
  activeConversationId?: number;
  onConversationSelect: (conversationId: number) => void;
};

const Groupes = ({
  conversations,
  activeConversationId,
  onConversationSelect,
}: GroupesProps) => {
  const { theme } = useTheme();
  
  // Filtrer uniquement les conversations de type groupe
  const groupeConversations = conversations.filter(
    (conv) => conv.type === 'groupe' || conv.type === 'group' || !conv.type
  );

  return (
    <div>
      <div className={`p-3 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-300'} ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
        <h3 className={`text-sm font-semibold ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
          Groupes ({groupeConversations.length})
        </h3>
      </div>
      <ConversationList
        conversations={groupeConversations}
        activeConversationId={activeConversationId}
        onConversationSelect={onConversationSelect}
        theme={theme}
      />
    </div>
  );
};

export default Groupes;
