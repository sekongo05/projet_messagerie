import { ConversationItem } from './ConversationItems';

type Conversation = {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
};

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
  if (conversations.length === 0) {
    return (
      <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Aucune conversation</p>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          id={conversation.id}
          name={conversation.name}
          lastMessage={conversation.lastMessage}
          lastMessageTime={conversation.lastMessageTime}
          unreadCount={conversation.unreadCount}
          avatar={conversation.avatar}
          isActive={conversation.id === activeConversationId}
          onClick={() => onConversationSelect(conversation.id)}
          theme={theme}
        />
      ))}
    </div>
  );
};

