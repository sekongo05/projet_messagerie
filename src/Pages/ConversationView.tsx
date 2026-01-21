import { MessagesList } from '../Metier/Messages/MessagesList';
import MessageInput from '../Metier/Messages/MessageInput';
import InfoGroupe from './InfoGroupe';
import type { Conversation } from '../Api/Conversation.api';
import type { Message } from '../Api/Message.api';

type ConversationViewProps = {
  activeConversationId: number | null;
  conversations: Conversation[];
  messages: Message[];
  currentUserId: number;
  theme?: 'light' | 'dark';
  onCloseConversation: () => void;
  onSendMessage: (formData: FormData, conversationId: number) => Promise<void>;
  onMessageDeleted?: () => void;
  onError?: (message: string) => void;
  onWarning?: (message: string) => void;
};

const ConversationView = ({
  activeConversationId,
  conversations,
  messages,
  currentUserId,
  theme = 'light',
  onCloseConversation,
  onSendMessage,
  onMessageDeleted,
  onError,
  onWarning,
}: ConversationViewProps) => {
  const borderColor = theme === 'dark' ? 'border-gray-900' : 'border-gray-300';

  if (!activeConversationId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <svg 
            className={`w-24 h-24 ${theme === 'dark' ? 'text-gray-600' : 'text-gray-300'} animate-pulse-fade`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={1.5} 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
            />
          </svg>
        </div>
        <p className={`text-lg font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'} animate-pulse-fade`}>
          Sélectionnez une conversation pour commencer
        </p>
      </div>
    );
  }

  const conversation = conversations.find(c => c.id === activeConversationId);
  
  // Récupérer le nom de l'interlocuteur (pas celui de l'utilisateur connecté)
  // Pour les conversations privées, on doit déterminer qui est l'interlocuteur
  let interlocutorName = '';
  let isGroupConversation = false;
  
  if (conversation) {
    const conv = conversation as any;
    
    // Vérifier si c'est une conversation de groupe
    isGroupConversation = conv.typeConversationCode === 'GROUP' || conv.typeConversation === 'GROUP';
    
    // Si on a recipientFullName et senderFullName, déterminer lequel est l'interlocuteur
    // Pour l'instant, on utilise le titre qui contient généralement le nom de l'interlocuteur
    // ou recipientFullName/senderFullName selon le contexte
    if (conv.recipientFullName && conv.senderFullName) {
      // Le titre contient généralement le nom de l'interlocuteur
      interlocutorName = conv.titre || conv.recipientFullName || conv.senderFullName;
    } else {
      // Sinon, utiliser les autres sources disponibles
      interlocutorName = conv.interlocuteurName 
        || conv.recipientFullName 
        || conv.senderFullName
        || conv.name
        || conv.titre
        || 'Conversation';
    }
  }

  const handleSend = async (formData: FormData) => {
    if (activeConversationId) {
      await onSendMessage(formData, activeConversationId);
    }
  };

  return (
    <>
      {/* En-tête de la conversation */}
      <div className={`p-4 border-b ${borderColor} ${theme === 'dark' ? 'bg-black' : 'bg-white'} flex items-center justify-between relative`}>
        <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {interlocutorName || 'Conversation'}
        </h3>
        <div className="flex items-center gap-2">
          {/* Icône info pour les conversations de groupe */}
          {isGroupConversation && conversation && (
            <InfoGroupe 
              conversation={conversation}
              theme={theme}
              onWarning={onWarning}
              onError={onError}
            />
          )}
          <button
            onClick={onCloseConversation}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:bg-gray-900 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Fermer la conversation"
            aria-label="Fermer la conversation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Liste des messages */}
      <MessagesList
        messages={messages}
        currentUserId={currentUserId}
        conversationId={activeConversationId}
        theme={theme}
        isGroupConversation={isGroupConversation}
        onMessageDeleted={onMessageDeleted}
      />

      {/* Input pour envoyer un message */}
      <MessageInput
        conversationId={activeConversationId}
        userId={currentUserId}
        onSend={handleSend}
        theme={theme}
        onError={onError}
        onWarning={onWarning}
      />
    </>
  );
};

export default ConversationView;
