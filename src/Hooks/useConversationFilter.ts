import { useMemo, useState } from 'react';
import type { Conversation } from '../Api/Conversation.api';

export const useConversationFilter = (conversations: Conversation[]) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrer les conversations en fonction du terme de recherche
  const filteredConversations = useMemo(() => {
    if (!searchTerm.trim()) {
      return conversations;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return conversations.filter((conversation) => {
      const convAny = conversation as any;
      // Rechercher dans le titre (qui contient le nom de l'interlocuteur pour les privées ou le titre pour les groupes)
      const titre = (conversation.titre || convAny.name || '').toLowerCase();
      
      return titre.includes(searchLower);
    });
  }, [conversations, searchTerm]);

  return {
    filteredConversations,
    searchTerm,
    setSearchTerm,
  };
};
