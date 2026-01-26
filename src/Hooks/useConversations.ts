import { useState, useCallback, useEffect } from 'react';
import { getConversations, type Conversation } from '../Api/Conversation.api';
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import { createConversation } from '../Api/ConversationCreate.api';
import { uploadImageMessage } from '../Api/uploadImage.api';
import { getUsers, type User } from '../Api/User.api';
import { shouldDisplayConversation, normalizeParticipant } from '../utils/participantState.utils';

type UseConversationsProps = {
  currentUserId: number;
  onActiveTabChange?: (tab: 'all' | 'prive' | 'contacts' | 'groupe') => void;
  onConversationSelect?: (conversationId: number) => void;
  /** Appelé quand on clique sur un contact sans conversation existante : ouvre le brouillon au lieu de créer. */
  onOpenDraftWithContact?: (contactId: number) => void;
  onError?: (message: string) => void;
  onWarning?: (message: string) => void;
};

export const useConversations = ({ 
  currentUserId, 
  onActiveTabChange,
  onConversationSelect,
  onOpenDraftWithContact,
  onError,
  onWarning
}: UseConversationsProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);

  // Filtrer les conversations pour ne garder que celles où l'utilisateur est participant
  const filterConversationsByParticipant = useCallback(async (
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
        const userParticipant = participantsList.find(
          (participant: any) => participant.userId === userId
        );

        // Si l'utilisateur est participant, vérifier si la conversation doit être affichée
        // Utilise shouldDisplayConversation qui vérifie hasCleaned
        if (userParticipant) {
          // Normaliser le participant pour avoir les valeurs booléennes correctes
          const normalizedParticipant = normalizeParticipant(userParticipant);
          
          // Exclure les conversations où l'utilisateur a nettoyé la conversation
          if (shouldDisplayConversation(normalizedParticipant)) {
            filteredConversations.push(conversation);
          }
        }
      } catch (error) {
        console.error(`Erreur lors de la vérification des participants pour la conversation ${conversation.id}:`, error);
        // En cas d'erreur, on peut choisir d'inclure ou d'exclure la conversation
        // Pour l'instant, on l'exclut par sécurité
      }
    }

    return filteredConversations;
  }, []);

  // Enrichir les conversations privées avec le nom de l'interlocuteur
  const enrichPrivateConversationsWithInterlocutorNames = useCallback(async (
    conversations: Conversation[],
    currentUserId: number
  ): Promise<Conversation[]> => {
    if (!currentUserId || conversations.length === 0) {
      return conversations;
    }

    try {
      // 1. Récupérer tous les utilisateurs et créer un Map pour recherche rapide
      const usersResponse: any = await getUsers(currentUserId);
      let usersList: User[] = [];
      
      if (Array.isArray(usersResponse)) {
        usersList = usersResponse;
      } else if (usersResponse?.items) {
        usersList = usersResponse.items;
      } else if (usersResponse?.data?.items) {
        usersList = usersResponse.data.items;
      } else if (usersResponse?.data && Array.isArray(usersResponse.data)) {
        usersList = usersResponse.data;
      }

      // Créer un Map pour recherche rapide par ID
      const usersMap = new Map<number, User>();
      usersList.forEach((user) => {
        if (user.id) {
          usersMap.set(user.id, user);
        }
      });

      console.log(`Cache d'utilisateurs créé: ${usersMap.size} utilisateurs`);

      // 2. Enrichir chaque conversation privée
      const enrichedConversations = await Promise.all(
        conversations.map(async (conversation) => {
          const convAny = conversation as any;
          
          // Vérifier si c'est une conversation privée
          const isPrivate = convAny.typeConversationCode === 'PRIVEE' || 
                           convAny.typeConversation === 'PRIVEE' ||
                           convAny.typeConversationCode === 'PRIVATE' ||
                           convAny.typeConversation === 'PRIVATE';

          // Si ce n'est pas une conversation privée, retourner sans modification
          if (!isPrivate) {
            return conversation;
          }

          try {
            // Récupérer les participants de la conversation
            const participantsResponse: any = await getParticipantsByConversationId(conversation.id);
            
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

            // Identifier l'interlocuteur (celui qui n'est pas currentUserId)
            const interlocutorParticipant = participantsList.find(
              (participant: any) => participant.userId !== currentUserId
            );

            if (!interlocutorParticipant || !interlocutorParticipant.userId) {
              console.warn(`Aucun interlocuteur trouvé pour la conversation ${conversation.id}`);
              return conversation;
            }

            const interlocutorId = interlocutorParticipant.userId;
            const interlocutor = usersMap.get(interlocutorId);

            if (!interlocutor) {
              console.warn(`Utilisateur ${interlocutorId} non trouvé dans le cache`);
              return {
                ...conversation,
                titre: `Utilisateur ${interlocutorId}`,
              };
            }

            // Construire le nom de l'interlocuteur
            let interlocutorName = '';
            if (interlocutor.prenoms && interlocutor.nom) {
              interlocutorName = `${interlocutor.prenoms} ${interlocutor.nom}`;
            } else if (interlocutor.prenoms) {
              interlocutorName = interlocutor.prenoms;
            } else if (interlocutor.nom) {
              interlocutorName = interlocutor.nom;
            } else {
              interlocutorName = `Utilisateur ${interlocutorId}`;
            }

            // Retourner la conversation avec le titre mis à jour
            return {
              ...conversation,
              titre: interlocutorName,
            };
          } catch (error) {
            console.error(`Erreur lors de l'enrichissement de la conversation ${conversation.id}:`, error);
            // En cas d'erreur, retourner la conversation sans modification
            return conversation;
          }
        })
      );

      return enrichedConversations;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      // En cas d'erreur, retourner les conversations sans modification
      return conversations;
    }
  }, []);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    try {
      if (!currentUserId) {
        console.warn('Aucun utilisateur connecté trouvé, impossible de charger les conversations');
        if (onError) {
          onError('Vous devez être connecté pour voir vos conversations');
        }
        setConversations([]);
        return;
      }

      // Charger toutes les conversations
      const response: any = await getConversations(currentUserId);
      const allConversations: Conversation[] = response?.items || [];
      console.log("Conversations chargées:", allConversations.length);

      // Filtrer pour ne garder que celles où l'utilisateur est participant
      const filteredConversations = await filterConversationsByParticipant(allConversations, currentUserId);
      console.log("Conversations filtrées (où l'utilisateur est participant):", filteredConversations.length);
      
      // Enrichir les conversations privées avec le nom de l'interlocuteur
      const enrichedConversations = await enrichPrivateConversationsWithInterlocutorNames(filteredConversations, currentUserId);
      console.log("Conversations enrichies avec les noms des interlocuteurs:", enrichedConversations.length);
      
      setConversations(enrichedConversations);
    } catch (error: any) {
      console.error('Erreur lors du chargement des conversations:', error);
      const errorMessage = error.response?.data?.status?.message || error.message || 'Erreur lors du chargement des conversations';
      if (onError) {
        onError(errorMessage);
      }
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, filterConversationsByParticipant, enrichPrivateConversationsWithInterlocutorNames, onError]);

  // Charger les conversations au montage
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Gérer la sélection d'un contact : vérifier si une conversation existe, sinon la créer
  const handleContactSelect = useCallback(async (contactId: number) => {
    console.log('=== handleContactSelect appelé ===', { contactId, currentUserId });
    
    try {
      // Éviter de créer une conversation avec soi-même
      if (contactId === currentUserId) {
        console.warn('Impossible de créer une conversation avec soi-même');
        if (onWarning) {
          onWarning('Impossible de créer une conversation avec soi-même');
        } else {
          alert('Impossible de créer une conversation avec soi-même');
        }
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
        if (onConversationSelect) {
          onConversationSelect(existingConversation.id);
        }
        // Basculer vers l'onglet privé pour voir la conversation
        if (onActiveTabChange) {
          onActiveTabChange('prive');
        }
      } else {
        // Si la conversation n'existe pas : ouvrir un brouillon (la conversation ne sera créée qu'à l'envoi du premier message)
        console.log(`Ouverture d'un brouillon avec le contact ${contactId} (conversation créée à l'envoi du premier message)`);
        if (onOpenDraftWithContact) {
          onOpenDraftWithContact(contactId);
        }
        if (onActiveTabChange) {
          onActiveTabChange('prive');
        }
      }
    } catch (error: any) {
      console.error('Erreur lors de la sélection du contact:', error);
      const errorMessage = `Erreur: ${error.message || 'Une erreur est survenue'}`;
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    }
  }, [currentUserId, conversations, onConversationSelect, onOpenDraftWithContact, onActiveTabChange, onError, onWarning]);

  // Fonction pour mettre à jour une conversation dans la liste
  const updateConversation = useCallback((conversationId: number, updates: Partial<Conversation>) => {
    setConversations(prevConversations =>
      prevConversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, ...updates };
        }
        return conv;
      })
    );
  }, []);

  /** Crée une conversation privée avec le premier message (texte et/ou image) ; la conversation apparaît dans la liste. Retourne l'id ou null. */
  const createPrivateWithFirstMessage = useCallback(async (contactId: number, formData: FormData): Promise<number | null> => {
    const content = (formData.get('content') as string)?.trim?.() ?? '';
    const file = formData.get('file') as File | null;
    const hasFile = file && file instanceof File;

    if (!content && !hasFile) {
      if (onWarning) onWarning('Veuillez entrer un message ou envoyer une image pour démarrer la conversation.');
      else alert('Veuillez entrer un message ou envoyer une image pour démarrer la conversation.');
      return null;
    }

    setLoading(true);
    try {
      let newId: number | null = null;

      if (hasFile) {
        const response: any = await createConversation(currentUserId, 'PRIVEE', {
          interlocuteurId: contactId,
          messageContent: ' ',
        });
        newId =
          response?.items?.[0]?.id ??
          response?.data?.items?.[0]?.id ??
          response?.items?.[0]?.conversationId ??
          response?.id ??
          response?.conversationId ??
          null;
        if (!newId) {
          if (onError) onError('Impossible de récupérer l\'ID de la conversation créée.');
          else alert('Impossible de récupérer l\'ID de la conversation créée.');
          return null;
        }
        await uploadImageMessage(
          { conversationId: newId, file, content: content || undefined },
          currentUserId
        );
      } else {
        const response: any = await createConversation(currentUserId, 'PRIVEE', {
          interlocuteurId: contactId,
          messageContent: content,
        });
        newId =
          response?.items?.[0]?.id ??
          response?.data?.items?.[0]?.id ??
          response?.items?.[0]?.conversationId ??
          response?.id ??
          response?.conversationId ??
          null;
        if (!newId) {
          if (onError) onError('Impossible de récupérer l\'ID de la conversation créée.');
          else alert('Impossible de récupérer l\'ID de la conversation créée.');
          return null;
        }
      }

      await loadConversations();
      return newId;
    } catch (err: any) {
      const msg = err?.response?.data?.status?.message || err?.message || 'Erreur lors de la création.';
      if (onError) onError(msg);
      else alert(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, [currentUserId, loadConversations, onError, onWarning]);

  return {
    conversations,
    loading,
    loadConversations,
    handleContactSelect,
    updateConversation,
    createPrivateWithFirstMessage,
  };
};
