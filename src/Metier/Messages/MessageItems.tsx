type Message = {
  id: number;
  content?: string;
  image?: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  typeMessage: '1' | '2' | '3'; // 1: TEXTE, 2: IMAGE, 3: MIXED
};

type MessageItemProps = {
  message: Message;
  currentUserId: number;
  theme?: 'light' | 'dark';
};

export const MessageItem = ({
  message,
  currentUserId,
  theme = 'light',
}: MessageItemProps) => {
  const isOwnMessage = message.senderId === currentUserId;
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      className={`flex mb-4 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`flex flex-col max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Nom de l'expéditeur (uniquement pour les messages des autres) */}
        {!isOwnMessage && (
          <span className={`text-xs mb-1 px-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {message.senderName}
          </span>
        )}

        {/* Bulle de message */}
        <div
          className={`rounded-lg px-4 py-2 ${
            isOwnMessage
              ? theme === 'dark'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-500 text-white'
              : theme === 'dark'
              ? 'bg-gray-700 text-gray-100'
              : 'bg-gray-200 text-gray-900'
          }`}
        >
          {/* Contenu texte */}
          {message.content && (
            <p className="mb-2 wrap-break-words">{message.content}</p>
          )}

          {/* Image */}
          {message.image && (
            <div className="mb-2">
              <img
                src={message.image}
                alt="Message"
                className="max-w-full h-auto rounded-lg"
              />
            </div>
          )}

          {/* Timestamp */}
          <span
            className={`text-xs ${
              isOwnMessage
                ? 'text-blue-100'
                : theme === 'dark'
                ? 'text-gray-400'
                : 'text-gray-500'
            }`}
          >
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
};

