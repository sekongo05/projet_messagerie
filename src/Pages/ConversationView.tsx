import { useState, useEffect } from 'react';
import { MessagesList } from '../Metier/Messages/MessagesList';
import MessageInput from '../Metier/Messages/MessageInput';
import InfoGroupe from './InfoGroupe';
import type { Conversation } from '../Api/Conversation.api';
import type { Message } from '../Api/Message.api';
import { getUsers } from '../Api/User.api';
import { useCurrentUserLeftGroup } from '../Hooks/useCurrentUserLeftGroup';
import { useMessagesWithLeaveEvents } from '../Hooks/useMessagesWithLeaveEvents';

type ConversationViewProps = {
  activeConversationId: number | null;
  /** Contact avec qui on rédige un premier message ; la conversation n'existe pas encore. */
  draftContactId?: number | null;
  conversations: Conversation[];
  messages: Message[];
  currentUserId: number;
  theme?: 'light' | 'dark';
  onCloseConversation: () => void;
  onSendMessage: (formData: FormData, conversationId: number) => Promise<void>;
  onSendFirstMessage?: (formData: FormData, contactId: number) => Promise<void>;
  onMessageDeleted?: () => void;
  onError?: (message: string) => void;
  onWarning?: (message: string) => void;
};

const ConversationView = ({
  activeConversationId,
  draftContactId = null,
  conversations,
  messages,
  currentUserId,
  theme = 'light',
  onCloseConversation,
  onSendMessage,
  onSendFirstMessage,
  onMessageDeleted,
  onError,
  onWarning,
}: ConversationViewProps) => {
  const [draftContactName, setDraftContactName] = useState<string>('');

  useEffect(() => {
    if (!draftContactId) {
      setDraftContactName('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r: any = await getUsers(currentUserId);
        const list = r?.items ?? r?.data?.items ?? (Array.isArray(r) ? r : []);
        const u = list.find((x: any) => x.id === draftContactId);
        if (!cancelled && u) {
          const n = [u.prenoms, u.nom].filter(Boolean).join(' ').trim() || `Utilisateur ${draftContactId}`;
          setDraftContactName(n);
        } else if (!cancelled) {
          setDraftContactName(`Utilisateur ${draftContactId}`);
        }
      } catch {
        if (!cancelled) setDraftContactName(`Utilisateur ${draftContactId}`);
      }
    })();
    return () => { cancelled = true; };
  }, [draftContactId, currentUserId]);

  // Calculs et hooks appelés à chaque rendu (Rules of Hooks) avant tout return
  const conversation = activeConversationId ? conversations.find(c => c.id === activeConversationId) : undefined;
  const isGroupConversation = conversation
    ? ((conversation as any).typeConversationCode === 'GROUP' || (conversation as any).typeConversation === 'GROUP')
    : false;

  let interlocutorName = '';
  if (conversation) {
    const conv = conversation as any;
    if (conv.recipientFullName && conv.senderFullName) {
      interlocutorName = conv.titre || conv.recipientFullName || conv.senderFullName;
    } else {
      interlocutorName = conv.interlocuteurName || conv.recipientFullName || conv.senderFullName || conv.name || conv.titre || 'Conversation';
    }
  }

  const { currentUserHasLeft } = useCurrentUserLeftGroup(
    activeConversationId,
    currentUserId,
    isGroupConversation
  );

  const messagesWithLeaveEvents = useMessagesWithLeaveEvents(
    activeConversationId,
    isGroupConversation,
    messages,
    currentUserId
  );

  const borderColor = theme === 'dark' ? 'border-gray-900' : 'border-gray-300';

  if (!activeConversationId && !draftContactId) {
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

  if (draftContactId && !activeConversationId) {
    return (
      <>
        <div className={`p-4 border-b ${borderColor} ${theme === 'dark' ? 'bg-black' : 'bg-white'} flex items-center justify-between`}>
          <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {draftContactName || 'Nouvelle conversation'}
          </h3>
          <button
            onClick={onCloseConversation}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:bg-gray-900 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            title="Fermer"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <MessagesList
          messages={[]}
          currentUserId={currentUserId}
          conversationId={null}
          theme={theme}
          isGroupConversation={false}
        />
        {onSendFirstMessage && (
          <MessageInput
            conversationId={0}
            userId={currentUserId}
            onSend={(formData) => onSendFirstMessage(formData, draftContactId)}
            theme={theme}
            onError={onError}
            onWarning={onWarning}
          />
        )}
      </>
    );
  }

  const handleSend = async (formData: FormData) => {
    if (activeConversationId) {
      await onSendMessage(formData, activeConversationId);
    }
  };

  const showInput = !currentUserHasLeft;
  const borderColorInput = theme === 'dark' ? 'border-gray-900' : 'border-gray-300';
  const bgColorInput = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

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

      {/* Liste des messages + événements "X a quitté le groupe" */}
      <MessagesList
        messages={messagesWithLeaveEvents}
        currentUserId={currentUserId}
        conversationId={activeConversationId}
        theme={theme}
        isGroupConversation={isGroupConversation}
        onMessageDeleted={onMessageDeleted}
      />

      {/* Input pour envoyer un message ou barre "Vous avez quitté ce groupe" (type WhatsApp) */}
      {showInput ? (
        <MessageInput
          conversationId={activeConversationId}
          userId={currentUserId}
          onSend={handleSend}
          theme={theme}
          onError={onError}
          onWarning={onWarning}
        />
      ) : (
        <div
          className={`flex items-center justify-center p-3 border-t ${borderColorInput} ${bgColorInput}`}
        >
          <p className={`text-sm ${textSecondary}`}>
            Vous avez quitté ce groupe
          </p>
        </div>
      )}
    </>
  );
};

export default ConversationView;
