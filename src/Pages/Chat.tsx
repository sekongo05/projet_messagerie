import { useState, useEffect } from 'react';
import { ConversationList } from '../Metier/Conversation/ConversationList';
import { MessagesList } from '../Metier/Messages/MessagesList';
import MessageInput from '../Metier/Messages/MessageInput';
import { useTheme } from '../mode';
import { FiLoader } from "react-icons/fi";
import { CgProfile } from "react-icons/cg";
import { CgExport } from "react-icons/cg";
import axios from 'axios';


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

  // Debug: Logger l'état des conversations
  useEffect(() => {
    console.log('État des conversations (dans le state):', conversations);
    console.log('Nombre de conversations:', conversations.length);
  }, [conversations]);

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    }
  }, [activeConversationId]);

  const loadConversations = async () => {
    setLoading(true);
    try {
    const response = await axios.post(
      "/api/conversation/getByCriteria",
      {
        user: 1,
        data: {}, 
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Réponse API brute des conversations:", response.data);

    // Les données sont dans response.data.items selon la structure de votre API
    const data = Array.isArray(response.data)
      ? response.data
      : response.data.items || response.data.data || response.data.content || [];

    console.log("Données extraites (avant mapping):", data);
    console.log("Type de données:", Array.isArray(data) ? 'tableau' : typeof data);
    console.log("Nombre d'éléments (avant mapping):", Array.isArray(data) ? data.length : 0);

    // Log pour voir la structure d'un élément
    if (data.length > 0) {
      console.log("Structure d'un élément de conversation:", data[0]);
      console.log("Propriétés disponibles:", Object.keys(data[0]));
    }

    // Mapping des conversations
    const mockConversations: Conversation[] = data
      .filter((item: any) => {
        const hasId = item && (item.id || item.conversationId);
        if (!hasId) {
          console.log("Élément filtré (pas d'id):", item);
        }
        return hasId;
      })
      .map((item: any) => {
        const mapped = {
          id: item.id || item.conversationId,
          name: item.name || item.nom || item.titre || "Conversation",
          lastMessage: item.lastMessage || item.dernierMessage || item.message || item.lastMessageContent || item.content,
          lastMessageTime: item.lastMessageTime || item.date || item.timestamp || item.createdAt,
          unreadCount: item.unreadCount || item.nonLu || 0,
          avatar: item.avatar || item.image,
        };
        console.log("Élément mappé:", mapped);
        return mapped;
      });
    
    console.log("Conversations mappées (après mapping):", mockConversations);
    console.log("Nombre de conversations mappées:", mockConversations.length);
    setConversations(mockConversations);
    console.log("setConversations appelé avec", mockConversations.length, "conversations");
     
    } catch (error) {
      console.error('Erreur lors du chargement des conversations:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: number) => {
  setLoading(true);

  try {
    const response = await axios.post(
      "/api/message/getByCriteria",
      {
        user: 1,
        data: { conversationId }, // passer la conversation cible
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log("Réponse API brute des messages:", response.data);

    // Les données sont probablement dans response.data.items aussi
    const data = Array.isArray(response.data)
      ? response.data
      : response.data.items || response.data.data || response.data.content || [];

    // Mapping correct pour les messages
    const messages: Message[] = data
      .filter((item: any) => item && (item.id || item.messageId)) // Filtrer les éléments invalides
      .map((item: any) => ({
        id: item.id || item.messageId,
        content: item.content || item.contenu || item.message || "",
        image: item.image || item.fichier || item.file,
        senderId: item.senderId || item.sender?.id || item.userId || item.user?.id || item.expediteurId || item.expediteur?.id || 0,
        senderName: item.senderName || item.sender?.name || item.sender?.nom || item.user?.name || item.user?.nom || item.expediteur || item.expediteur?.nom || "Unknown",
        conversationId: item.conversationId || item.conversation?.id || conversationId,
        timestamp: item.timestamp || item.createdAt || item.date || new Date().toISOString(),
        typeMessage: (item.typeMessage || item.type || (item.image ? '2' : '1')) as '1' | '2' | '3',
      }));

    console.log("Messages mappés:", messages);
    setMessages(messages);

  } catch (error) {
    console.error("Erreur lors du chargement des messages:", error);
    setMessages([]);
  } finally {
    setLoading(false);
  }
};
    

  // Gérer la sélection d'une conversation
  const handleConversationSelect = (conversationId: number) => {
    setActiveConversationId(conversationId);
  };

  // Gérer la fermeture d'une conversation
  const handleCloseConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
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
    <div className={`h-screen flex  ${bgColor}`}>
      {/* Sidebar - Liste des conversations */}
      <div className={`w-120 border-r ${borderColor} flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        <div className={`p-3 border-4 ${borderColor}  flex flex-col gap-2 items-center justify-between`}>
          <div className='border-2 w-full justify-between flex border-red-900'>
            <h2 className={`text-[40px] border-2 font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Discussions
            </h2>
            <div>
                <button  className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-gray-400 hover:bg-gray-700 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>  <CgExport className='w-8 h-10' />
                </button>
                {onNavigateToProfile && (
                <button onClick={onNavigateToProfile} className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' ? 'text-gray-400 hover:bg-gray-700 hover:text-white'   : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}
                  title="Voir mon profil"> <CgProfile className='w-8 h-10' />
                </button> )}
            </div>
          </div>
          <div className='h-10 border-2 w-full flex items-center text-xl  font-bold justify-center gap-8 ' >
            <div className='cursor-pointer'>Privé</div>
            <div className='cursor-pointer'>Contacts</div>
            <div className='cursor-pointer'>Groupe</div>
            
          </div>

        </div>
          
        
        {loading && conversations.length === 0 ? (
          <div className="flex-1 border-2 flex items-center justify-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}><FiLoader /></p>
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
      <div className="flex-1 flex  flex-col">
        {activeConversationId ? (
          <>
            {/* En-tête de la conversation */}
            <div className={`p-4 border-b ${borderColor} ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} flex  items-center justify-between`}>
              {(() => {
                const conversation = conversations.find(c => c.id === activeConversationId);
                return (
                  <>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {conversation?.name || 'Conversation'}
                    </h3>
                    <div className="flex  items-center gap-2">
                      
                      <button
                        onClick={handleCloseConversation}
                        className={`p-2 rounded-lg transition-colors ${
                          theme === 'dark'
                            ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
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