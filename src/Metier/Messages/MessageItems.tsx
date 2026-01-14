import type { Message } from '../../Api/Message.api';

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
  // Règle UI demandée:
  // - message REÇU (createdBy !== currentUserId) → affiché à GAUCHE
  // - message ENVOYÉ (createdBy === currentUserId) → affiché à DROITE
  const isOwnMessage = message.createdBy === currentUserId;
  
  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const time = formatTime(message.createdAt);

  return (
    <div
      className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1`}
    >
      <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
        {/* Nom de l'expéditeur (uniquement pour les messages des autres) */}
        {!isOwnMessage && message.senderName && (
          <span className={`text-xs mb-1 px-3 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {message.senderName}
          </span>
        )}

        {/* Bulle de message style WhatsApp */}
        <div
          className={`relative rounded-2xl px-3 py-1.5 ${
            isOwnMessage
              ? theme === 'dark'
                ? 'bg-orange-500 text-white rounded-br-sm'
                : 'bg-orange-400 text-white rounded-br-sm'
              : theme === 'dark'
              ? 'bg-gray-700 text-gray-100 rounded-bl-sm'
              : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
          }`}
        >
          {/* Contenu texte */}
          {message.content && (
            <div className="flex items-end gap-2">
              <p className="break-words text-sm leading-relaxed flex-1">{message.content}</p>
              {/* Timestamp à côté du texte */}
              {time && (
                <span
                  className={`text-[11px] leading-none shrink-0 ${
                    isOwnMessage
                      ? 'text-orange-50 opacity-90'
                      : theme === 'dark'
                      ? 'text-gray-400'
                      : 'text-gray-500'
                  }`}
                >
                  {time}
                </span>
              )}
            </div>
          )}

          {/* Image */}
          {message.messageImgUrl && message.messageImgUrl !== 'null' && (
            <div className="mb-1 max-w-full">
              <img
                src={message.messageImgUrl || undefined}
                alt="Message"
                className="max-w-full h-auto rounded-lg"
              />
              {/* Timestamp pour les images */}
              {time && !message.content && (
                <div className="flex justify-end items-end mt-1">
                  <span
                    className={`text-[11px] leading-none ${
                      isOwnMessage
                        ? 'text-orange-50 opacity-90'
                        : theme === 'dark'
                        ? 'text-gray-400'
                        : 'text-gray-500'
                    }`}
                  >
                    {time}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

