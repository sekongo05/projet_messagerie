import { useState, useEffect } from 'react';
import { ConversationList } from '../Metier/Conversation/ConversationList';
import { getConversations, type Conversation } from '../Api/Conversation.api';

type PriveProps = {
  onConversationSelect?: (conversationId: number) => void;
  activeConversationId?: number;
  theme?: 'light' | 'dark';
};

const Prive = ({ 
  onConversationSelect, 
  activeConversationId,
  theme = 'light' 
}: PriveProps = {}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPrivateConversations();
  }, []);

  const loadPrivateConversations = async () => {
    setLoading(true);
    try {
      const response: any = await getConversations();
      const allConversations: Conversation[] = response?.items || [];
      
      // Filtrer uniquement les conversations privées
      const privateConversations = allConversations.filter(
        (conv: any) => conv.typeConversationCode === 'PRIVEE' || conv.typeConversation === 'PRIVEE'
      );
      
      setConversations(privateConversations);
      console.log("Conversations privées chargées:", privateConversations.length);
    } catch (error) {
      console.error('Erreur lors du chargement des conversations privées:', error);
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
        <p>Chargement des conversations privées...</p>
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

export default Prive;
