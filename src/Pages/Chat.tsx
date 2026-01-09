import { useState, useEffect } from 'react';
import { ConversationList } from '../Metier/Conversation/ConversationList';
import { MessagesList } from '../Metier/Messages/MessagesList';
import MessageInput from '../Metier/Messages/MessageInput';
import { useTheme } from '../mode';

// Types
type Conversation = {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
};

type Message = {
  id: number;
  content?: string;
  image?: string;
  senderId: number;
  senderName: string;
  timestamp: string;
  typeMessage: '1' | '2' | '3';
  conversationId: number;
};

type ChatProps = {
  onNavigateToProfile?: () => void;
};

const Chat = ({ onNavigateToProfile }: ChatProps = {}) => {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [currentUserId] = useState<number>(1); // À remplacer par l'ID de l'utilisateur connecté
  const [loading, setLoading] = useState(false);

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();
  }, []);

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  // Simuler le chargement des conversations (à remplacer par l'appel API réel)
  const loadConversations = async () => {
    setLoading(true);
    try {
      // TODO: Remplacer par l'appel API réel
      // const response = await Conversation.api.getAll();
      // setConversations(response.data);

      // Données de démonstration
      const mockConversations: Conversation[] = [
        {
          id: 1,
          name: 'John Doe',
          lastMessage: 'Salut, ça va ?',
          lastMessageTime: '14:30',
          unreadCount: 1,
        },
        {
          id: 2,
          name: 'Jane Smith',
          lastMessage: 'Merci pour ton aide !',
          lastMessageTime: '13:15',
          unreadCount: 0,
        },
        {
          id: 3,
          name: 'Alice Johnson',
          lastMessage: 'À demain !',
          lastMessageTime: '12:00',
          unreadCount: 5,
        },
      ];
      setConversations(mockConversations);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Simuler le chargement des messages (à remplacer par l'appel API réel)
  const loadMessages = async (conversationId: number) => {
    setLoading(true);
    try {
      // TODO: Remplacer par l'appel API réel
      // const response = await Message.api.getByConversation(conversationId);
      // setMessages(response.data);

      // Données de démonstration
      const mockMessages: Message[] = [
        {
          id: 1,
          content: 'Salut ! Comment ça va ?',
          senderId: 2,
          senderName: 'John Doe',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          typeMessage: '1',
          conversationId: 1,
        },
        {
          id: 2,
          content: 'Ça va bien, merci ! Et toi ?',
          senderId: 1,
          senderName: 'Moi',
          timestamp: new Date(Date.now() - 3300000).toISOString(),
          typeMessage: '1',
          conversationId: 1,
        },
        {
          id: 3,
          content: 'Très bien aussi, merci !',
          senderId: 2,
          senderName: 'John Doe',
          timestamp: new Date(Date.now() - 3000000).toISOString(),
          typeMessage: '1',
          conversationId: 1,
        },
      ];
      setMessages(mockMessages.filter(m => m.conversationId === conversationId));
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la sélection d'une conversation
  const handleConversationSelect = (conversationId: number) => {
    setActiveConversationId(conversationId);
  };

  // Gérer l'envoi d'un message
  const handleSendMessage = async (formData: FormData) => {
    if (!activeConversationId) return;

    try {
      // TODO: Remplacer par l'appel API réel
      // await Message.api.send(formData);
      
      // Simulation : utiliser formData pour éviter l'avertissement
      console.log('Envoi du message:', formData);
      
      // Recharger les messages après envoi
      await loadMessages(activeConversationId);
      
      // Recharger les conversations pour mettre à jour le dernier message
      await loadConversations();
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error);
      throw error;
    }
  };

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`h-screen flex ${bgColor}`}>
      {/* Sidebar - Liste des conversations */}
      <div className={`w-80 border-r ${borderColor} flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
          <h2 className={`text-[40px] font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Discussions
          </h2>
          {onNavigateToProfile && (
            <button
              onClick={onNavigateToProfile}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="Voir mon profil"
            >
              👤
            </button>
          )}
        </div>
        {loading && conversations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>Chargement...</p>
          </div>
        ) : (
          <ConversationList
            conversations={conversations}
            activeConversationId={activeConversationId || undefined}
            onConversationSelect={handleConversationSelect}
            theme={theme}
          />
        )}
      </div>

      {/* Zone principale - Messages */}
      <div className="flex-1 flex flex-col">
        {activeConversationId ? (
          <>
            {/* En-tête de la conversation */}
            <div className={`p-4 border-b ${borderColor} ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} flex items-center justify-between`}>
              {(() => {
                const conversation = conversations.find(c => c.id === activeConversationId);
                return (
                  <>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {conversation?.name || 'Conversation'}
                    </h3>
                  </>
                );
              })()}
            </div>

            {/* Liste des messages */}
            <MessagesList
              messages={messages}
              currentUserId={currentUserId}
              theme={theme}
            />

            {/* Input pour envoyer un message */}
            <MessageInput
              conversationId={activeConversationId}
              userId={currentUserId}
              onSend={handleSendMessage}
              theme={theme}
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}>
              Sélectionnez une conversation pour commencer
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;

