import { useState, useMemo } from 'react';
import { ConversationList } from '../Metier/Conversation/ConversationList';
import { useTheme } from '../mode';
import { FiLoader } from "react-icons/fi";
import Prive from './Prive';
import Groupes from './Groupes';
import UserPage from './user';
import CreateGroupe from './CreateGroupe';
import SearchConversations from './SearchConversations';
import ChatHeader from './ChatHeader';
import ChatTabs from './ChatTabs';
import ConversationView from './ConversationView';
import ConversationEmptyState from './ConversationEmptyState';
import { useConversations } from '../Hooks/useConversations';
import { useMessages } from '../Hooks/useMessages';
import { useConversationFilter } from '../Hooks/useConversationFilter';
import { ToastContainer, useToast } from '../components/Toast';
import NouveauContact from './NouveauContact';

type ChatProps = {
  onNavigateToProfile?: () => void;
};

const Chat = ({ onNavigateToProfile }: ChatProps = {}) => {
  const { theme, toggleTheme } = useTheme();
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'prive' | 'contacts' | 'groupe'>('prive');
  const [showCreateGroupe, setShowCreateGroupe] = useState(false);
  const [showNouveauContact, setShowNouveauContact] = useState(false);
  const [contactsRefreshTrigger, setContactsRefreshTrigger] = useState(0);
  const { toasts, removeToast, error: showError, success: showSuccess, warning: showWarning } = useToast();

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
  const currentUserIdValue = useMemo(() => getCurrentUserId(), []);
  const currentUserId = (currentUserIdValue ?? 1) as number; // Fallback temporaire pour éviter les erreurs de type

  // Gérer la sélection d'une conversation
  const handleConversationSelect = (conversationId: number) => {
    setActiveConversationId(conversationId);
  };

  // Gérer la fermeture d'une conversation
  const handleCloseConversation = () => {
    setActiveConversationId(null);
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

  // Hook pour gérer les conversations
  const {
    conversations,
    loading: conversationsLoading,
    loadConversations,
    handleContactSelect,
    updateConversation,
  } = useConversations({
    currentUserId,
    onActiveTabChange: setActiveTab,
    onConversationSelect: handleConversationSelect,
    onError: showError,
    onWarning: showWarning,
  });

  // Hook pour filtrer les conversations
  const { filteredConversations, searchTerm, setSearchTerm } = useConversationFilter(conversations);

  // Hook pour gérer les messages
  const {
    messages,
    loading: messagesLoading,
    handleSendMessage,
    loadMessages,
  } = useMessages({
    activeConversationId,
    currentUserId,
    onConversationUpdate: updateConversation,
    onError: showError,
    onWarning: showWarning,
  });

  const loading = conversationsLoading || messagesLoading;
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-gray-100';
  const borderColor = theme === 'dark' ? 'border-gray-900' : 'border-gray-300';

  return (
    <div className={`h-screen flex ${bgColor}`}>
      {/* Sidebar - Liste des conversations */}
      <div className={`w-120 border-r ${borderColor} flex flex-col ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
        {/* En-tête avec titre et actions */}
        <ChatHeader
          theme={theme}
          onNavigateToProfile={onNavigateToProfile}
          onLogout={handleLogout}
          onAddNewDiscussion={() => setActiveTab('contacts')}
          onAddNewGroup={() => setShowCreateGroupe(true)}
          onError={showError}
        />

        {/* Onglets style WhatsApp */}
        <ChatTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          theme={theme}
        />

        {/* Barre de recherche */}
        {(activeTab === 'all' || activeTab === 'prive' || activeTab === 'groupe') && (
          <SearchConversations
            onSearchChange={setSearchTerm}
            theme={theme}
            placeholder="Rechercher une conversation..."
          />
        )}
          
        {/* Contenu de la sidebar */}
        {loading && conversations.length === 0 && (activeTab === 'all' || activeTab === 'prive' || activeTab === 'groupe') ? (
          <div className="flex-1 flex items-center justify-center">
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}><FiLoader /></p>
          </div>
        ) : activeTab === 'contacts' ? (
          // Toujours afficher les contacts, même s'il n'y a pas de conversations
          <div className="flex-1 flex flex-col">
            <div className={`p-4 border-b ${borderColor} ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
              <button
                onClick={() => setShowNouveauContact(true)}
                className={`w-full px-4 py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  theme === 'dark'
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouveau contact
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <UserPage 
                onUserSelect={handleContactSelect}
                selectedUserId={undefined}
                refreshTrigger={contactsRefreshTrigger}
              />
            </div>
          </div>
        ) : !loading && filteredConversations.length === 0 && searchTerm.trim() ? (
          // Aucune conversation trouvée pour la recherche
          <ConversationEmptyState
            theme={theme}
            isSearchResult={true}
          />
        ) : !loading && conversations.length === 0 ? (
          // Afficher le bouton add quand il n'y a pas de conversations
          <ConversationEmptyState
            theme={theme}
            isSearchResult={false}
            onNewConversationClick={() => setActiveTab('contacts')}
          />
        ) : (
          <>
            {activeTab === 'prive' && (
              <Prive
                conversations={filteredConversations}
                onConversationSelect={handleConversationSelect}
                activeConversationId={activeConversationId || undefined}
                onConversationDeleted={loadConversations}
                theme={theme}
                onError={showError}
                onSuccess={showSuccess}
                onWarning={showWarning}
              />
            )}
            {activeTab === 'groupe' && (
              <Groupes
                conversations={filteredConversations}
                onConversationSelect={handleConversationSelect}
                activeConversationId={activeConversationId || undefined}
                onConversationDeleted={loadConversations}
                theme={theme}
                onError={showError}
                onSuccess={showSuccess}
                onWarning={showWarning}
              />
            )}
            {activeTab === 'all' && (
              <ConversationList
                conversations={filteredConversations}
                activeConversationId={activeConversationId || undefined}
                onConversationSelect={handleConversationSelect}
                onConversationDeleted={loadConversations}
                theme={theme}
                onError={showError}
                onSuccess={showSuccess}
                onWarning={showWarning}
              />
            )}
          </>
        )}
      </div>

      {/* Zone principale - Messages */}
      <div className="flex-1 flex flex-col">
        <ConversationView
          activeConversationId={activeConversationId}
          conversations={conversations}
          messages={messages}
          currentUserId={currentUserId}
          theme={theme}
          onCloseConversation={handleCloseConversation}
          onSendMessage={handleSendMessage}
          onMessageDeleted={activeConversationId ? () => loadMessages(activeConversationId) : undefined}
          onError={showError}
          onWarning={showWarning}
        />
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

      {/* Modal de création de contact */}
      {showNouveauContact && (
        <NouveauContact
          onClose={() => setShowNouveauContact(false)}
          onSuccess={() => {
            // Recharger immédiatement la liste des contacts
            setContactsRefreshTrigger(prev => prev + 1);
            // Recharger aussi les conversations pour voir le nouveau contact
            loadConversations();
          }}
          theme={theme}
          onError={showError}
          onSuccessToast={showSuccess}
        />
      )}

      {/* Container des toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} theme={theme} />
    </div>
  );
};

export default Chat;
