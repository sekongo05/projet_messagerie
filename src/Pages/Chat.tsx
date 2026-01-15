import { useState, useEffect, useMemo } from 'react';
import { ConversationList } from '../Metier/Conversation/ConversationList';
import { MessagesList } from '../Metier/Messages/MessagesList';
import MessageInput from '../Metier/Messages/MessageInput';
import { useTheme } from '../mode';
import { FiLoader, FiUsers } from "react-icons/fi";
import { CgProfile, CgExport, CgLogOut, CgAdd, CgComment, CgUserList } from "react-icons/cg";
import { getConversations, type Conversation } from '../Api/Conversation.api';
import { getMessagesByConversation, getLastMessageFromMessages, sendMessage, type Message } from '../Api/Message.api';
import { getParticipantsByConversationId } from '../Api/ParticipantConversation.api';
import { createConversation } from '../Api/ConversationCreate.api';
import Prive from './Prive';
import Groupes from './Groupes';
import UserPage from './user';
import InfoGroupe from './InfoGroupe';
import CreateGroupe from './CreateGroupe';


type ChatProps = {
  onNavigateToProfile?: () => void;
};

const Chat = ({ onNavigateToProfile }: ChatProps = {}) => {
  const { theme } = useTheme();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'prive' | 'contacts' | 'groupe'>('prive');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCreateGroupe, setShowCreateGroupe] = useState(false);

  // Récupérer l'ID de l'utilisateur connecté depuis localStorage
  const getCurrentUserId = (): number | null => {
    try {
      const userData = localStorage.getItem('userData');
      if (userData) {
        const parsed = JSON.parse(userData);
        if (parsed.id) return parsed.id;
      }
      
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        const parsed = JSON.parse(currentUser);
        if (parsed.id) return parsed.id;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
      return null;
    }
  };

  // Mémoriser l'ID utilisateur pour éviter de le recalculer à chaque render
  const currentUserId = useMemo(() => getCurrentUserId() || 1, []); // Fallback à 1 si non trouvé

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

  // Filtrer les conversations pour ne garder que celles où l'utilisateur est participant
  const filterConversationsByParticipant = async (
    conversations: Conversation[],
    userId: number
  ): Promise<Conversation[]> => {
    if (!userId) {
      console.warn('Aucun ID utilisateur fourni, aucune conversation ne sera affichée');
      return [];
    }

    const filteredConversations: Conversation[] = [];

    // Vérifier chaque conversation pour voir si l'utilisateur est participant
    for (const conversation of conversations) {
      try {
        const participantsResponse: any = await getParticipantsByConversationId(conversation.id);
        
        // Extraire la liste des participants
        let participantsList: any[] = [];
        if (Array.isArray(participantsResponse)) {
          participantsList = participantsResponse;
        } else if (participantsResponse?.items) {
          participantsList = participantsResponse.items;
        } else if (participantsResponse?.data?.items) {
          participantsList = participantsResponse.data.items;
        } else if (participantsResponse?.data && Array.isArray(participantsResponse.data)) {
          participantsList = participantsResponse.data;
        }

        // Vérifier si l'utilisateur est dans les participants
        const isParticipant = participantsList.some(
          (participant: any) => participant.userId === userId
        );

        if (isParticipant) {
          filteredConversations.push(conversation);
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification des participants pour la conversation ${conversation.id}:`, error);
        // En cas d'erreur, on peut choisir d'inclure ou d'exclure la conversation
        // Pour l'instant, on l'exclut par sécurité
      }
    }

    return filteredConversations;
  };

  const loadConversations = async () => {
    setLoading(true);
    try {
      const userId = getCurrentUserId();
      
      if (!userId) {
        console.warn('Aucun utilisateur connecté trouvé');
        setConversations([]);
        return;
      }

      // Charger toutes les conversations
      const response: any = await getConversations();
      const allConversations: Conversation[] = response?.items || [];
      console.log("Conversations chargées:", allConversations.length);

      // Filtrer pour ne garder que celles où l'utilisateur est participant
      const filteredConversations = await filterConversationsByParticipant(allConversations, userId);
      console.log("Conversations filtrées (où l'utilisateur est participant):", filteredConversations.length);
      
      setConversations(filteredConversations);
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
      const messages = await getMessagesByConversation(conversationId, currentUserId);
      setMessages(messages);

      // Mettre à jour le lastMessageTime de la conversation avec le timestamp du dernier message
      const lastMessage = getLastMessageFromMessages(messages);
      if (lastMessage) {
        setConversations(prevConversations =>
          prevConversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                lastMessage: lastMessage.content || conv.lastMessage,
                lastMessageTime: lastMessage.createdAt,
              };
            }
            return conv;
          })
        );
      }
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

  // Gérer la sélection d'un contact : vérifier si une conversation existe, sinon la créer
  const handleContactSelect = async (contactId: number) => {
    console.log('=== handleContactSelect appelé ===', { contactId, currentUserId });
    
    try {
      // Éviter de créer une conversation avec soi-même
      if (contactId === currentUserId) {
        console.warn('Impossible de créer une conversation avec soi-même');
        alert('Impossible de créer une conversation avec soi-même');
        return;
      }

      console.log(`Recherche d'une conversation entre l'utilisateur connecté (${currentUserId}) et le contact (${contactId})`);
      console.log('Conversations actuelles:', conversations.length);

      // Chercher si une conversation privée existe déjà entre l'utilisateur connecté et le contact
      let existingConversation: Conversation | undefined = undefined;

      // Première vérification : chercher dans les conversations chargées
      for (const conv of conversations) {
        const convAny = conv as any;
        // Vérifier si c'est une conversation privée
        const isPrivate = convAny.typeConversationCode === 'PRIVEE' || 
                         convAny.typeConversation === 'PRIVEE' ||
                         convAny.typeConversationCode === 'PRIVATE' ||
                         convAny.typeConversation === 'PRIVATE';
        
        if (!isPrivate) continue;

        // Vérifier si le contact est l'interlocuteur (méthode directe)
        // Dans ce cas, l'utilisateur connecté est le créateur et le contact est l'interlocuteur
        if (convAny.interlocuteurId === contactId) {
          existingConversation = conv;
          console.log(`Conversation trouvée via interlocuteurId: ${conv.id}`);
          break;
        }

        // Vérifier via les participants de la conversation
        // Une conversation privée doit avoir exactement 2 participants : l'utilisateur connecté et le contact
        try {
          const participantsResponse: any = await getParticipantsByConversationId(conv.id);
          let participantsList: any[] = [];
          
          if (Array.isArray(participantsResponse)) {
            participantsList = participantsResponse;
          } else if (participantsResponse?.items) {
            participantsList = participantsResponse.items;
          } else if (participantsResponse?.data?.items) {
            participantsList = participantsResponse.data.items;
          } else if (participantsResponse?.data && Array.isArray(participantsResponse.data)) {
            participantsList = participantsResponse.data;
          }

          // Vérifier si les deux participants sont bien l'utilisateur connecté et le contact
          const hasCurrentUser = participantsList.some((p: any) => p.userId === currentUserId);
          const hasContact = participantsList.some((p: any) => p.userId === contactId);
          
          // Une conversation privée doit avoir exactement 2 participants : l'utilisateur connecté et le contact
          if (hasCurrentUser && hasContact && participantsList.length === 2) {
            existingConversation = conv;
            console.log(`Conversation trouvée via participants: ${conv.id} (${currentUserId} et ${contactId})`);
            break;
          }
        } catch (error) {
          // Ignorer les erreurs de récupération des participants pour cette conversation
          console.warn(`Erreur lors de la vérification des participants pour la conversation ${conv.id}:`, error);
        }
      }

      if (existingConversation) {
        // Si la conversation existe, l'ouvrir directement
        console.log('Conversation existante trouvée:', existingConversation.id);
        setActiveConversationId(existingConversation.id);
        // Basculer vers l'onglet privé pour voir la conversation
        setActiveTab('prive');
      } else {
        // Si la conversation n'existe pas, la créer entre l'utilisateur connecté et le contact
        console.log(`Création d'une nouvelle conversation privée entre l'utilisateur connecté (${currentUserId}) et le contact (${contactId})`);
        setLoading(true);
        
        try {
          // Créer la conversation avec l'utilisateur connecté comme créateur et le contact comme interlocuteur
          // Le backend requiert au moins un message (messageContent ou messageImgUrl) pour les conversations privées
          // On envoie un message par défaut pour satisfaire cette exigence
          const response: any = await createConversation(
            currentUserId, // L'utilisateur connecté qui crée la conversation
            "PRIVEE",
            {
              interlocuteurId: contactId, // Le contact sur lequel on a cliqué
              messageContent: " " // Message avec un espace pour satisfaire l'exigence du backend (message non vide)
            }
          );

          console.log('Réponse de createConversation:', response);

          // Extraire l'ID de la conversation créée
          const newConversationId = response?.items?.[0]?.id || 
                                   response?.data?.items?.[0]?.id ||
                                   response?.items?.[0]?.conversationId ||
                                   response?.id ||
                                   response?.conversationId;

          console.log('ID de conversation extrait:', newConversationId);

          if (newConversationId) {
            console.log('Conversation créée avec succès:', newConversationId);
            
            // Recharger les conversations pour inclure la nouvelle
            await loadConversations();
            
            // Attendre un peu pour que la nouvelle conversation soit disponible
            setTimeout(() => {
              console.log('Ouverture de la conversation:', newConversationId);
              setActiveConversationId(newConversationId);
              // Basculer vers l'onglet privé pour voir la conversation
              setActiveTab('prive');
            }, 500);
          } else {
            console.error('Impossible de récupérer l\'ID de la conversation créée. Réponse complète:', response);
            alert('Erreur: Impossible de récupérer l\'ID de la conversation créée');
          }
        } catch (error: any) {
          console.error('Erreur lors de la création de la conversation:', error);
          console.error('Détails de l\'erreur:', error.response?.data || error.message);
          alert(`Erreur lors de la création de la conversation: ${error.response?.data?.status?.message || error.message || 'Erreur inconnue'}`);
        } finally {
          setLoading(false);
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la sélection du contact:', error);
      alert(`Erreur: ${error.message || 'Une erreur est survenue'}`);
    }
  };

  // Gérer la déconnexion
  const handleLogout = () => {
    // Nettoyer localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userData');
    localStorage.removeItem('currentUser');
    
    // Recharger la page pour revenir au login
    window.location.reload();
  };

  // Gérer la fermeture d'une conversation
  const handleCloseConversation = () => {
    setActiveConversationId(null);
    setMessages([]);
  };


  // Gérer l'envoi d'un message
  const handleSendMessage = async (formData: FormData) => {
    if (!activeConversationId) return;

    const content = formData.get("content");

    if (!content || typeof content !== "string") {
      console.error("Message vide");
      return;
    }

    try {
      const created = await sendMessage(
        {
          conversationId: activeConversationId,
          content: content,
        },
        currentUserId
      );

      // Mettre à jour immédiatement la conversation dans la liste avec le nouveau message
      setConversations(prevConversations => 
        prevConversations.map(conv => {
          if (conv.id === activeConversationId) {
            return {
              ...conv,
              lastMessage: content,
              // on prend le createdAt renvoyé par l'API (déjà normalisé ISO dans Message.api.ts)
              lastMessageTime: created.createdAt,
            };
          }
          return conv;
        })
      );

      // Recharger les messages après envoi
      await loadMessages(activeConversationId);
      
      // Note: On ne recharge plus toutes les conversations car loadMessages 
      // met déjà à jour le lastMessageTime de la conversation active
    } catch (error) {
      console.error("Erreur lors de l'envoi du message :", error);
    }
  };

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';

  return (
    <div className={`h-screen flex  ${bgColor}`}>
      {/* Sidebar - Liste des conversations */}
      <div className={`w-120 border-r ${borderColor} flex flex-col ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
        {/* En-tête avec titre et actions */}
        <div className={`px-4 py-3 border-b ${borderColor} ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
          <div className='flex items-center justify-between mb-3'>
            <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Discussions
            </h2>
            <div className="flex items-center gap-2 relative">
              {/* Bouton Add avec menu déroulant */}
              <div className="relative">
                <button 
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className={`p-2 rounded-lg transition-all ${
                    showAddMenu
                      ? theme === 'dark'
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-100 text-gray-900'
                      : theme === 'dark' 
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-white' 
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  title="Nouveau"
                >
                  <CgAdd className='w-5 h-5' />
                </button>
                
                {/* Menu déroulant stylisé */}
                {showAddMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowAddMenu(false)}
                    />
                    <div 
                      className={`absolute right-0 mt-2 w-56 rounded-xl shadow-2xl z-50 overflow-hidden animate-slide-down ${
                        theme === 'dark' 
                          ? 'bg-gray-800 border border-gray-700' 
                          : 'bg-white border border-gray-200 shadow-gray-200'
                      }`}
                      style={{
                        animation: 'slideDown 0.2s ease-out'
                      }}
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            setActiveTab('contacts');
                            setShowAddMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-all flex items-center gap-3 group ${
                            theme === 'dark'
                              ? 'text-gray-200 hover:bg-gray-700 hover:text-white'
                              : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg transition-colors ${
                            theme === 'dark'
                              ? 'bg-gray-700/50 group-hover:bg-orange-500/20'
                              : 'bg-gray-100 group-hover:bg-orange-100'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <span>Nouvelle discussion</span>
                        </button>
                        <div className={`h-px my-1 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`} />
                        <button
                          onClick={() => {
                            setShowCreateGroupe(true);
                            setShowAddMenu(false);
                          }}
                          className={`w-full text-left px-4 py-3 text-sm font-medium transition-all flex items-center gap-3 group ${
                            theme === 'dark'
                              ? 'text-gray-200 hover:bg-gray-700 hover:text-white'
                              : 'text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                          }`}
                        >
                          <div className={`p-1.5 rounded-lg transition-colors ${
                            theme === 'dark'
                              ? 'bg-gray-700/50 group-hover:bg-orange-500/20'
                              : 'bg-gray-100 group-hover:bg-orange-100'
                          }`}>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span>Nouveau groupe</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
              
              <button 
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title="Exporter"
              >
                <CgExport className='w-5 h-5' />
              </button>
              {onNavigateToProfile && (
                <button 
                  onClick={onNavigateToProfile} 
                  className={`group relative p-2 rounded-xl transition-all duration-300 ${
                    theme === 'dark' 
                      ? 'text-gray-400 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/20 hover:text-orange-400 hover:shadow-lg hover:shadow-orange-500/20' 
                      : 'text-gray-600 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-50 hover:text-orange-500 hover:shadow-lg hover:shadow-orange-200/50'
                  }`}
                  title="Voir mon profil"
                >
                  <div className={`absolute inset-0 rounded-xl ${
                    theme === 'dark' 
                      ? 'bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10' 
                      : 'bg-gradient-to-br from-orange-200/0 to-orange-100/0 group-hover:from-orange-200/30 group-hover:to-orange-100/30'
                  } transition-all duration-300`} />
                  <CgProfile className='w-5 h-5 relative z-10 transform group-hover:scale-110 transition-transform duration-300' />
                </button>
              )}
              <button 
                onClick={handleLogout} 
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark' 
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
                title="Déconnexion"
              >
                <CgLogOut className='w-5 h-5' />
              </button>
            </div>
          </div>
          
          {/* Onglets style WhatsApp */}
          <div className='flex items-center gap-1'>
            <div 
              className={`px-4 py-2 rounded-lg cursor-pointer transition-all text-sm font-medium flex items-center gap-2 ${
                activeTab === 'prive' 
                  ? theme === 'dark' 
                    ? 'bg-gray-700 text-orange-400' 
                    : 'bg-gray-100 text-orange-500'
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('prive')}
            >
              <CgComment className="w-4 h-4" />
              <span>Privé</span>
            </div>
            <div 
              className={`px-4 py-2 rounded-lg cursor-pointer transition-all text-sm font-medium flex items-center gap-2 ${
                activeTab === 'groupe' 
                  ? theme === 'dark' 
                    ? 'bg-gray-700 text-orange-400' 
                    : 'bg-gray-100 text-orange-500'
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('groupe')}
            >
              <FiUsers className="w-4 h-4" />
              <span>Groupe</span>
            </div>
            <div 
              className={`px-4 py-2 rounded-lg cursor-pointer transition-all text-sm font-medium ml-auto flex items-center gap-2 group relative ${
                activeTab === 'contacts' 
                  ? theme === 'dark' 
                    ? 'bg-gray-700 text-orange-400' 
                    : 'bg-gray-100 text-orange-500'
                  : theme === 'dark' 
                    ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-700/50' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('contacts')}
            >
              <div className={`relative ${
                activeTab === 'contacts'
                  ? theme === 'dark'
                    ? 'text-orange-400'
                    : 'text-orange-500'
                  : theme === 'dark'
                    ? 'text-gray-400 group-hover:text-gray-300'
                    : 'text-gray-600 group-hover:text-orange-500'
              } transition-all duration-300`}>
                <div className={`absolute inset-0 rounded-full ${
                  activeTab === 'contacts'
                    ? theme === 'dark'
                      ? 'bg-orange-500/20 blur-sm'
                      : 'bg-orange-400/20 blur-sm'
                    : theme === 'dark'
                      ? 'bg-gray-500/0 group-hover:bg-gray-500/10 blur-sm'
                      : 'bg-orange-200/0 group-hover:bg-orange-200/30 blur-sm'
                } transition-all duration-300`} />
                <CgUserList className="w-4 h-4 relative transform group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span>Contacts</span>
            </div>
          </div>
        </div>
          
        
        {loading && conversations.length === 0 && (activeTab === 'all' || activeTab === 'prive' || activeTab === 'groupe') ? (
          <div className="flex-1  flex items-center justify-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}><FiLoader /></p>
          </div>
        ) : activeTab === 'contacts' ? (
          // Toujours afficher les contacts, même s'il n'y a pas de conversations
          <UserPage 
            onUserSelect={handleContactSelect}
            selectedUserId={undefined}
          />
        ) : !loading && conversations.length === 0 ? (
          // Afficher le bouton add quand il n'y a pas de conversations (pour les onglets prive, groupe, all)
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              <p className="text-lg mb-4">Aucune conversation</p>
              <p className="text-sm mb-6">Commencez une nouvelle conversation</p>
            </div>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-orange-400 hover:bg-orange-500 text-white'
              } shadow-lg hover:shadow-xl transform hover:scale-105 transition-all`}
            >
              <CgAdd className="w-5 h-5" />
              <span>Nouvelle conversation</span>
            </button>
          </div>
        ) : (
          <>
            {activeTab === 'prive' && (
              <Prive
                conversations={conversations}
                onConversationSelect={handleConversationSelect}
                activeConversationId={activeConversationId || undefined}
                theme={theme}
              />
            )}
            {activeTab === 'groupe' && (
              <Groupes
                conversations={conversations}
                onConversationSelect={handleConversationSelect}
                activeConversationId={activeConversationId || undefined}
                theme={theme}
              />
            )}
            {activeTab === 'all' && (
              <ConversationList
                conversations={conversations}
                activeConversationId={activeConversationId || undefined}
                onConversationSelect={handleConversationSelect}
                theme={theme}
              />
            )}
          </>
        )}
      </div>

      {/* Zone principale - Messages */}
      <div className="flex-1 flex  flex-col">
        {activeConversationId ? (
          <>
            {/* En-tête de la conversation */}
            <div className={`p-4 border-b ${borderColor} ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} flex  items-center justify-between relative`}>
              {(() => {
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
                
                return (
                  <>
                    <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      {interlocutorName || 'Conversation'}
                    </h3>
                    <div className="flex  items-center gap-2">
                      {/* Icône info pour les conversations de groupe */}
                      {isGroupConversation && conversation && (
                        <InfoGroupe 
                          conversation={conversation}
                          theme={theme}
                        />
                      )}
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
        )}
      </div>

      {/* Modal de création de groupe */}
      {showCreateGroupe && (
        <CreateGroupe
          currentUserId={currentUserId}
          onClose={() => setShowCreateGroupe(false)}
          onSuccess={async (conversationId) => {
            // Recharger les conversations
            await loadConversations();
            // Ouvrir la nouvelle conversation de groupe
            setActiveConversationId(conversationId);
            setActiveTab('groupe');
          }}
          theme={theme}
        />
      )}
    </div>
  );
};

export default Chat;