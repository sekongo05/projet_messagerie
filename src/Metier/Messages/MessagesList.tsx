import { useEffect, useRef } from 'react';
import { MessageItem } from './MessageItems';
import type { MessageOrSystemEvent } from '../../Hooks/useMessagesWithLeaveEvents';
import { isSystemLeaveEvent, isSystemJoinEvent } from '../../utils/systemLeaveEvent.utils';

type MessagesListProps = {
  messages: MessageOrSystemEvent[];
  currentUserId: number;
  conversationId: number | null;
  theme?: 'light' | 'dark';
  isGroupConversation?: boolean;
  onMessageDeleted?: () => void;
};

// Séparateurs de jour style WhatsApp : "Aujourd'hui" | "Hier" | "15 janvier" | "15 janvier 2024"
const formatDayLabel = (isoDate: string): string => {
  const d = new Date(isoDate);
  if (isNaN(d.getTime())) return '';

  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  if (sameDay) return "Aujourd'hui";

  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';

  if (d.getFullYear() === today.getFullYear()) {
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  }
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
};

export const MessagesList = ({
  messages,
  currentUserId,
  conversationId,
  theme = 'light',
  isGroupConversation = false,
  onMessageDeleted,
}: MessagesListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trier messages + événements "X a quitté" du plus ancien au plus récent (affichage WhatsApp)
  const sortedItems = [...messages].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateA - dateB;
  });

  // Scroll automatique vers le bas quand de nouveaux messages arrivent
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (sortedItems.length === 0) {
    return (
      <div className={`flex-1 flex items-center justify-center p-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Aucun message. Commencez la conversation !</p>
      </div>
    );
  }

  return (
    <div 
      className={`flex-1 overflow-y-auto px-4 pt-3 pb-6 ${theme === 'dark' ? 'bg-black' : 'bg-gray-100'}`}
    >
      {/* Contenu des messages + événements "X a quitté le groupe" */}
      <div className="relative min-h-full flex flex-col justify-end gap-2">
        {sortedItems.map((item, idx) => {
          const prev = sortedItems[idx - 1];
          const showDaySeparator =
            idx === 0 ||
            (prev?.createdAt && item.createdAt && formatDayLabel(prev.createdAt) !== formatDayLabel(item.createdAt));
          const key = (isSystemLeaveEvent(item) || isSystemJoinEvent(item)) ? item.id : `msg-${item.id}`;

          return (
            <div key={key} className="flex flex-col gap-2">
              {showDaySeparator && (
                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      theme === 'dark'
                        ? 'bg-gray-900 text-gray-300 border border-gray-800'
                        : 'bg-white/80 text-gray-600 border border-gray-200'
                    }`}
                  >
                    {formatDayLabel(item.createdAt)}
                  </span>
                </div>
              )}
              {isSystemLeaveEvent(item) ? (
                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs max-w-[85%] text-center ${
                      theme === 'dark'
                        ? 'bg-gray-800/60 text-gray-400 border border-gray-700/50'
                        : 'bg-gray-200/80 text-gray-600 border border-gray-300/60'
                    }`}
                  >
                    {item.content}
                  </span>
                </div>
              ) : isSystemJoinEvent(item) ? (
                <div className="flex justify-center">
                  <span
                    className={`px-3 py-1.5 rounded-lg text-xs max-w-[85%] text-center ${
                      theme === 'dark'
                        ? 'bg-gray-800/50 text-green-400/90 border border-gray-700/50'
                        : 'bg-green-50/90 text-green-700 border border-green-200/80'
                    }`}
                  >
                    {item.content}
                  </span>
                </div>
              ) : (
                <MessageItem
                  message={item}
                  currentUserId={currentUserId}
                  conversationId={conversationId}
                  theme={theme}
                  isGroupConversation={isGroupConversation}
                  onMessageDeleted={onMessageDeleted}
                />
              )}
            </div>
          );
        })}
      </div>
      {/* Élément invisible pour le scroll automatique */}
      <div ref={messagesEndRef} className="relative" />
    </div>
  );
};

