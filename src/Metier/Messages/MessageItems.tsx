import { useState } from 'react';
import type { Message } from '../../Api/Message.api';
import MessageActions from '../../Pages/MessageActions';

type MessageItemProps = {
  message: Message;
  currentUserId: number;
  theme?: 'light' | 'dark';
  isGroupConversation?: boolean;
};

export const MessageItem = ({
  message,
  currentUserId,
  theme = 'light',
  isGroupConversation = false,
}: MessageItemProps) => {
  const [isHovered, setIsHovered] = useState(false);
  // Règle UI demandée:
  // - message REÇU (createdBy !== currentUserId) → affiché à GAUCHE
  // - message ENVOYÉ (createdBy === currentUserId) → affiché à DROITE
  const isOwnMessage = message.createdBy === currentUserId;

  // Palette de couleurs harmonieuse conforme au design (oranges/verts/bleus/violets)
  const getColorForParticipant = (name: string | undefined, userId: number): { text: string; bg: string } => {
    // Utiliser le nom ou l'ID pour générer une couleur stable
    const identifier = name || userId.toString();
    
    // Palette de couleurs harmonieuses
    const colorPalette = [
      // Oranges/Coraux (cohérent avec le thème)
      { text: theme === 'dark' ? 'text-orange-300' : 'text-orange-700', bg: theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100' },
      // Verts
      { text: theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700', bg: theme === 'dark' ? 'bg-emerald-500/20' : 'bg-emerald-100' },
      // Bleus
      { text: theme === 'dark' ? 'text-blue-300' : 'text-blue-700', bg: theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100' },
      // Violets
      { text: theme === 'dark' ? 'text-purple-300' : 'text-purple-700', bg: theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100' },
      // Roses
      { text: theme === 'dark' ? 'text-pink-300' : 'text-pink-700', bg: theme === 'dark' ? 'bg-pink-500/20' : 'bg-pink-100' },
      // Indigos
      { text: theme === 'dark' ? 'text-indigo-300' : 'text-indigo-700', bg: theme === 'dark' ? 'bg-indigo-500/20' : 'bg-indigo-100' },
      // Cyans
      { text: theme === 'dark' ? 'text-cyan-300' : 'text-cyan-700', bg: theme === 'dark' ? 'bg-cyan-500/20' : 'bg-cyan-100' },
      // Ambers
      { text: theme === 'dark' ? 'text-amber-300' : 'text-amber-700', bg: theme === 'dark' ? 'bg-amber-500/20' : 'bg-amber-100' },
    ];

    // Hash simple pour mapper un nom/ID à une couleur stable
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      const char = identifier.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Utiliser la valeur absolue du hash pour sélectionner une couleur
    const index = Math.abs(hash) % colorPalette.length;
    return colorPalette[index];
  };

  const participantColor = isGroupConversation && !isOwnMessage && message.senderName 
    ? getColorForParticipant(message.senderName, message.createdBy)
    : null;
  
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
    // TODO: Implémenter la suppression pour moi
  };

  const handleDeleteForAll = () => {
    console.log('Supprimer pour tous:', message.id);
    // TODO: Implémenter la suppression pour tous
  };

  const handleDelete = () => {
    console.log('Supprimer:', message.id);
    // TODO: Implémenter la suppression
  };

  return (
    <div
      className={`flex w-full ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-1 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <div className={`flex flex-col max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'} relative`}>
        {/* Nom de l'expéditeur (uniquement pour les conversations de groupe et uniquement pour les autres utilisateurs) */}
        {isGroupConversation && !isOwnMessage && message.senderName && participantColor && (
          <div className={`mb-0.5 px-2 pl-1`}>
            <span className={`inline-block text-xs font-semibold tracking-wide px-2.5 py-0.5 rounded-md ${participantColor.text} ${participantColor.bg} shadow-sm border ${
              theme === 'dark' 
                ? 'border-transparent' 
                : 'border-opacity-20'
            }`}>
              {message.senderName}
            </span>
          </div>
        )}

        {/* Bulle de message style WhatsApp */}
        <div
          className={`relative rounded-2xl ${
            message.messageImgUrl && message.messageImgUrl !== 'null' && message.messageImgUrl !== '' && message.messageImgUrl !== null && !message.content
              ? 'p-0' // Pas de padding pour les images seules
              : message.messageImgUrl && message.messageImgUrl !== 'null' && message.messageImgUrl !== '' && message.messageImgUrl !== null && message.content
              ? 'p-0' // Pas de padding pour les messages mixtes, on gère le padding dans les éléments
              : 'px-3 py-1.5' // Padding normal pour texte seul
          } ${
            isOwnMessage
              ? theme === 'dark'
                ? 'bg-orange-500 text-white rounded-br-sm'
                : 'bg-orange-400 text-white rounded-br-sm'
              : theme === 'dark'
              ? 'bg-gray-900 text-gray-100 rounded-bl-sm'
              : 'bg-white text-gray-900 rounded-bl-sm shadow-sm'
          }`}
        >
          {/* Actions du message (bouton trois points et menu) */}
          <MessageActions
            isOwnMessage={isOwnMessage}
            theme={theme}
            isHovered={isHovered}
            onDeleteForMe={handleDeleteForMe}
            onDeleteForAll={handleDeleteForAll}
            onDelete={handleDelete}
          />
          {/* Image - Format moyen style WhatsApp */}
          {message.messageImgUrl && message.messageImgUrl !== 'null' && message.messageImgUrl !== '' && message.messageImgUrl !== null && (
            <div className={`relative group/image overflow-hidden ${
              message.content ? 'rounded-t-lg' : 'rounded-lg'
            } ${
              isOwnMessage
                ? theme === 'dark'
                  ? 'border border-orange-600/30'
                  : 'border border-orange-300/40'
                : theme === 'dark'
                ? 'border border-gray-700/40'
                : 'border border-gray-300/40'
            }`}
            style={{ overflow: 'hidden' }}>
              <img
                src={message.messageImgUrl}
                alt="Message"
                loading="lazy"
                onError={(e) => {
                  const img = e.target as HTMLImageElement;
                  console.error('Erreur de chargement de l\'image:', {
                    url: message.messageImgUrl,
                    currentSrc: img?.currentSrc,
                    src: img?.src,
                    messageId: message.id
                  });
                  // Afficher un placeholder au lieu de cacher complètement
                  if (img && !img.src.includes('data:image/svg')) {
                    img.style.display = 'block';
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect fill="%23ddd" width="200" height="200"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage non disponible%3C/text%3E%3C/svg%3E';
                  }
                }}
                onLoad={() => {
                  console.log('Image chargée avec succès:', {
                    url: message.messageImgUrl,
                    messageId: message.id
                  });
                }}
                className="max-w-[250px] max-h-[300px] w-full h-auto object-cover cursor-pointer hover:opacity-95 transition-opacity"
                style={{ 
                  display: 'block',
                  margin: 0,
                  padding: 0,
                  width: '100%',
                  height: 'auto',
                  maxWidth: '250px',
                  maxHeight: '300px',
                  minWidth: '150px',
                  minHeight: '150px'
                }}
              />
              {/* Timestamp pour les images seules (affiché en overlay en bas à droite) */}
              {time && !message.content && (
                <div 
                  className={`absolute bottom-1 right-1 px-1.5 py-0.5 rounded ${
                    isOwnMessage
                      ? 'bg-black/40 text-white'
                      : 'bg-black/40 text-white'
                  } text-[11px] leading-none backdrop-blur-sm`}
                >
                  {time}
                </div>
              )}
            </div>
          )}

          {/* Contenu texte - Affiché après l'image si elle existe */}
          {message.content && (
            <div className={`flex items-end gap-2 ${
              message.messageImgUrl && message.messageImgUrl !== 'null' && message.messageImgUrl !== '' && message.messageImgUrl !== null
                ? 'px-3 pt-2 pb-1' // Padding pour messages mixtes
                : '' // Pas de padding supplémentaire pour texte seul (déjà dans la bulle)
            }`}>
              <p className="break-words text-sm leading-relaxed flex-1">{message.content}</p>
              {/* Timestamp à côté du texte (affiché seulement si pas d'image, sinon affiché en bas) */}
              {time && (!message.messageImgUrl || message.messageImgUrl === 'null' || message.messageImgUrl === '' || message.messageImgUrl === null) && (
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
          
          {/* Timestamp global en bas pour messages avec image + texte */}
          {message.messageImgUrl && message.messageImgUrl !== 'null' && message.messageImgUrl !== '' && message.messageImgUrl !== null && message.content && time && (
            <div className="flex items-end justify-end gap-1 px-3 pb-1.5">
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
      </div>
    </div>
  );
};

