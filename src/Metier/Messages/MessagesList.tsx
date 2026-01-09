import { MessageItem } from './MessageItems';

type Message = {
  id: number;
  content?: string;
  image?: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  typeMessage: '1' | '2' | '3';
};

type MessagesListProps = {
  messages: Message[];
  currentUserId: number;
  theme?: 'light' | 'dark';
};

export const MessagesList = ({
  messages,
  currentUserId,
  theme = 'light',
}: MessagesListProps) => {
  if (messages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center p-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Aucun message. Commencez la conversation !</p>
      </div>
    );
  }

  return (
    <div className={`flex-1 overflow-y-auto p-4 ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          theme={theme}
        />
      ))}
    </div>
  );
};

