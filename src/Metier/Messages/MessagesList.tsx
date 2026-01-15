import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItems';
import type { Message } from '../../Api/Message.api';

type MessagesListProps = {
  messages: Message[];
  currentUserId: number;
  theme?: 'light' | 'dark';
};

const formatDayLabel = (isoDate: string) => {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';

  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return "Aujourd'hui";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameYesterday = d.toDateString() === yesterday.toDateString();
  if (sameYesterday) return 'Hier';

  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const MessagesList = ({
  messages,
  currentUserId,
  theme = 'light',
}: MessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trier les messages du plus ancien au plus récent (pour affichage WhatsApp)
  const sortedMessages = [...messages].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB; // Du plus ancien au plus récent
  });

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (sortedMessages.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center p-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Aucun message. Commencez la conversation !</p>
      </div>
    );
  }

  return (
    <div 
      className={`flex-1 overflow-y-auto px-4 pt-3 pb-6 ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}
      style={{
        backgroundImage: theme === 'light' 
          ? 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%239C92AC\' fill-opacity=\'0.03\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
          : undefined
      }}
    >
      {/* WhatsApp-like: messages "collés" en bas + séparateurs de date */}
      <div className="min-h-full flex flex-col justify-end gap-2">
        {sortedMessages.map((message, idx) => {
          const prev = sortedMessages[idx - 1];
          const showDaySeparator =
            idx === 0 ||
            (prev?.createdAt && message.createdAt && formatDayLabel(prev.createdAt) !== formatDayLabel(message.createdAt));

          return (
            <div key={message.id} className="flex flex-col gap-2">
              {showDaySeparator && (
                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      theme === 'dark'
                        ? 'bg-gray-900 text-gray-300 border border-gray-800'
                        : 'bg-white/80 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {formatDayLabel(message.createdAt)}
                  </span>
                </div>
              )}
              <MessageItem message={message} currentUserId={currentUserId} theme={theme} />
            </div>
          );
        })}
      </div>
      {/* Élément invisible pour le scroll automatique */}
      <div ref={messagesEndRef} />
    </div>
  );
};

