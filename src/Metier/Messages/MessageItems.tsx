import { useState, useRef, useEffect } from 'react';
import type { Message } from '../../Api/Message.api';
import { FiMoreVertical } from 'react-icons/fi';

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
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
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

  const handleDeleteForMe = () => {
    console.log('Supprimer pour moi:', message.id);
    setShowMenu(false);
  };

  const handleDeleteForAll = () => {
    console.log('Supprimer pour tous:', message.id);
    setShowMenu(false);
  };

  const handleDelete = () => {
    console.log('Supprimer:', message.id);
    setShowMenu(false);
  };

  return (
    <div
      className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        // Fermer seulement si le menu n'est pas ouvert
        if (!showMenu) {
          setIsHovered(false);
        }
      }}
    >
      <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} relative`}>
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
              ? 'bg-gray-900 text-gray-100 rounded-bl-sm'
              : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
          }`}
        >
          {/* Bouton trois points - visible au survol */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`absolute transition-opacity duration-200 z-30 top-1 right-1 ${
              isHovered || showMenu ? 'opacity-100' : 'opacity-0'
            } ${
              isOwnMessage
                ? theme === 'dark'
                  ? 'text-orange-100 hover:text-white'
                  : 'text-orange-50 hover:text-white'
                : theme === 'dark'
                ? 'text-gray-300 hover:text-white'
                : 'text-gray-600 hover:text-gray-900'
            } p-1.5 rounded-full hover:bg-black/30 backdrop-blur-sm`}
            title="Options"
          >
            <FiMoreVertical className="w-4 h-4" />
          </button>

          {/* Menu déroulant */}
          {showMenu && (
            <>
              {/* Overlay pour fermer le menu en cliquant en dehors - transparent pour ne pas bloquer la vue */}
              <div 
                className="fixed inset-0 z-[15]" 
                onClick={() => setShowMenu(false)}
                style={{ backgroundColor: 'transparent' }}
              />
              <div
                ref={menuRef}
                onMouseEnter={() => setIsHovered(true)}
                className={`absolute z-[35] min-w-[180px] rounded-lg shadow-xl overflow-visible animate-slide-down ${
                  theme === 'dark'
                    ? 'bg-gray-900'
                    : 'bg-white shadow-lg'
                }`}
                style={{
                  animation: 'slideDown 0.2s ease-out',
                  ...(isOwnMessage 
                    ? { 
                        right: '0',
                        bottom: '100%',
                        marginBottom: '0.25rem'
                      } // Messages envoyés : collé au-dessus, aligné à droite
                    : { 
                        left: '100%',
                        top: '0',
                        marginLeft: '0.25rem'
                      }) // Messages reçus : collé à droite des trois points
                }}
              >
                <div className="py-1">
                  {isOwnMessage ? (
                    // Options pour messages envoyés
                    <>
                      <button
                        onClick={handleDeleteForMe}
                        className={`w-full text-left px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-2 group rounded-md ${
                          theme === 'dark'
                            ? 'text-gray-200 hover:bg-gray-800/80 hover:text-white'
                            : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Supprimer pour moi</span>
                      </button>
                      <div className={`h-px mx-2 my-0.5 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-200'}`} />
                      <button
                        onClick={handleDeleteForAll}
                        className={`w-full text-left px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-2 group rounded-md ${
                          theme === 'dark'
                            ? 'text-red-400 hover:bg-gray-800/80 hover:text-red-300'
                            : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Supprimer pour tous</span>
                      </button>
                    </>
                  ) : (
                    // Option pour messages reçus
                    <button
                      onClick={handleDelete}
                      className={`w-full text-left px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-2 group rounded-md ${
                        theme === 'dark'
                          ? 'text-gray-200 hover:bg-gray-700/80 hover:text-white'
                          : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                      }`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      <span>Supprimer</span>
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
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

