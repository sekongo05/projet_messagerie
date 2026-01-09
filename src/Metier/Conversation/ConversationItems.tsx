import type { ReactNode } from 'react';

type ConversationItemProps = {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  isActive?: boolean;
  onClick: () => void;
  children?: ReactNode;
  theme?: 'light' | 'dark';
};

export const ConversationItem = ({
  name,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  avatar,
  isActive = false,
  onClick,
  theme = 'light',
}: ConversationItemProps) => {
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const activeBg = theme === 'dark' 
    ? (isActive ? 'bg-blue-900/20 border-l-4 border-orange-500' : '')
    : (isActive ? 'bg-blue-50 border-l-4 border-orange-500' : '');
  
  const nameColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const timeColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const messageColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 p-4 cursor-pointer ${hoverBg} transition-colors ${activeBg}`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-linear-to-br from-orange-100 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className={`font-semibold ${nameColor} truncate`}>
            {name}
          </h3>
          {lastMessageTime && (
            <span className={`text-xs ${timeColor} shrink-0 ml-2`}>
              {lastMessageTime}
            </span>
          )}
        </div>
        {lastMessage && (
          <div className="flex items-center justify-between">
            <p className={`text-sm ${messageColor} truncate`}>
              {lastMessage}
            </p>
            {unreadCount > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs font-semibold rounded-full px-2 py-1 shrink-0 min-w-5 text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

