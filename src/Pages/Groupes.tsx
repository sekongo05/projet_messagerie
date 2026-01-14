import { useState, useEffect } from 'react';
import { ConversationList } from '../Metier/Conversation/ConversationList';
import { getConversations, type Conversation } from '../Api/Conversation.api';

type GroupesProps = {
  onConversationSelect?: (conversationId: number) => void;
  activeConversationId?: number;
  theme?: 'light' | 'dark';
};

const Groupes = ({ 
  onConversationSelect, 
  activeConversationId,
  theme = 'light' 
}: GroupesProps = {}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadGroupConversations();
  }, []);

  const loadGroupConversations = async () => {
    setLoading(true);
    try {
      const response: any = await getConversations();
      const allConversations: Conversation[] = response?.items || [];
      
      // Filtrer uniquement les conversations de groupe
      const groupConversations = allConversations.filter(
        (conv: any) => conv.typeConversationCode === 'GROUP' || conv.typeConversation === 'GROUP'
      );
      
      setConversations(groupConversations);
      console.log("Conversations de groupe chargées:", groupConversations.length);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations de groupe:', error);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleConversationSelect = (conversationId: number) => {
    if (onConversationSelect) {
      onConversationSelect(conversationId);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Chargement des groupes...</p>
      </div>
    );
  }

  return (
    <ConversationList
      conversations={conversations}
      activeConversationId={activeConversationId}
      onConversationSelect={handleConversationSelect}
      theme={theme}
    />
  );
};

export default Groupes;
