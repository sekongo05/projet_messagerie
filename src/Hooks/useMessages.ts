import { useState, useEffect, useCallback } from 'react';
import { getMessagesByConversation, getLastMessageFromMessages, sendTextMessage, uploadImageMessage, type Message } from '../Api/Message.api';
import { getUsers, type User } from '../Api/User.api';
import type { Conversation } from '../Api/Conversation.api';

type UseMessagesProps = {
  activeConversationId: number | null;
  currentUserId: number;
  onConversationUpdate?: (conversationId: number, updates: Partial<Conversation>) => void;
  onError?: (message: string) => void;
  onWarning?: (message: string) => void;
};

export const useMessages = ({ activeConversationId, currentUserId, onConversationUpdate, onError, onWarning }: UseMessagesProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // Enrichir les messages avec les noms des créateurs
  const enrichMessagesWithCreatorNames = async (
    messages: Message[],
    currentUserId: number
  ): Promise<Message[]> => {
    if (!messages || messages.length === 0) {
      return messages;
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

      console.log(`Cache d'utilisateurs créé pour enrichissement des messages: ${usersMap.size} utilisateurs`);

      // 2. Enrichir chaque message avec le nom du créateur
      const enrichedMessages = messages.map((message) => {
        if (!message.createdBy) {
          return message;
        }

        const creator = usersMap.get(message.createdBy);

        if (!creator) {
          console.warn(`Utilisateur ${message.createdBy} non trouvé dans le cache pour le message ${message.id}`);
          // Si senderName existe déjà, le garder, sinon utiliser un fallback
          if (!message.senderName) {
            return {
              ...message,
              senderName: `Utilisateur ${message.createdBy}`,
            };
          }
          return message;
        }

        // Construire le nom du créateur
        let creatorName = '';
        if (creator.prenoms && creator.nom) {
          creatorName = `${creator.prenoms} ${creator.nom}`;
        } else if (creator.prenoms) {
          creatorName = creator.prenoms;
        } else if (creator.nom) {
          creatorName = creator.nom;
        } else {
          creatorName = `Utilisateur ${message.createdBy}`;
        }

        // Retourner le message avec le senderName mis à jour
        return {
          ...message,
          senderName: creatorName,
        };
      });

      return enrichedMessages;
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs pour enrichissement des messages:', error);
      // En cas d'erreur, retourner les messages sans modification
      return messages;
    }
  };

  const loadMessages = useCallback(async (conversationId: number) => {
    setLoading(true);

    try {
      const messages = await getMessagesByConversation(conversationId, currentUserId);
      
      // Debug: vérifier les messages avec images
      const messagesWithImages = messages.filter(m => m.messageImgUrl);
      if (messagesWithImages.length > 0) {
        console.log('Messages avec images chargés:', messagesWithImages);
      }
      
      // Enrichir les messages avec les noms des créateurs
      const enrichedMessages = await enrichMessagesWithCreatorNames(messages, currentUserId);
      console.log('Messages enrichis avec les noms des créateurs:', enrichedMessages.length);
      
      setMessages(enrichedMessages);

      // Mettre à jour le lastMessageTime de la conversation avec le timestamp du dernier message
      // Utiliser enrichedMessages pour avoir le message final avec toutes les données normalisées
      const lastMessage = getLastMessageFromMessages(enrichedMessages);
      if (lastMessage && onConversationUpdate) {
        // Si le message a une image, afficher "📷 Image", sinon utiliser le contenu
        let lastMessageText = lastMessage.content?.trim() || '';
        if (lastMessage.messageImgUrl) {
          // Message avec image
          lastMessageText = lastMessageText 
            ? `${lastMessageText} 📷` 
            : '📷 Image';
        }
        
        // S'assurer que lastMessageText n'est pas vide (pour les messages texte uniquement)
        if (!lastMessageText && !lastMessage.messageImgUrl) {
          // Si pas de contenu ni d'image, ne pas mettre à jour (cas inhabituel)
          console.warn('Message sans contenu ni image:', lastMessage);
          return;
        }
        
        onConversationUpdate(conversationId, {
          lastMessage: lastMessageText,
          lastMessageTime: lastMessage.createdAt,
        } as Partial<Conversation>);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des messages:", error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, onConversationUpdate]);

  // Charger les messages quand une conversation est sélectionnée
  useEffect(() => {
    if (activeConversationId) {
      loadMessages(activeConversationId);
    } else {
      setMessages([]);
    }
  }, [activeConversationId, loadMessages]);

  const handleSendMessage = useCallback(async (formData: FormData, conversationId: number) => {
    if (!conversationId) return;

    const content = formData.get("content") as string | null;
    const file = formData.get("file") as File | null;

    // Vérifier qu'il y a au moins du contenu texte ou une image
    if (!content?.trim() && !file) {
      console.error("Message vide : aucun contenu texte ni image");
      if (onWarning) {
        onWarning("Le message ne peut pas être vide. Ajoutez du texte ou une image.");
      } else {
        alert("Le message ne peut pas être vide. Ajoutez du texte ou une image.");
      }
      return;
    }

    try {
      let created: Message;

      // Si une image est présente, utiliser uploadImageMessage
      if (file && file instanceof File) {
        created = await uploadImageMessage(
          {
            conversationId: conversationId,
            file: file,
            content: content?.trim() || undefined, // Contenu optionnel pour messages mixtes
          },
          currentUserId
        );
      } else {
        // Sinon, utiliser sendTextMessage pour texte seul
        if (!content?.trim()) {
          console.error("Message texte vide");
          return;
        }
        created = await sendTextMessage(
          {
            conversationId: conversationId,
            content: content.trim(),
          },
          currentUserId
        );
      }

      // Mettre à jour immédiatement la conversation dans la liste avec le nouveau message
      let lastMessageText = content?.trim() || '';
      if (file && created.messageImgUrl) {
        // Message avec image
        lastMessageText = lastMessageText 
          ? `${lastMessageText} 📷` 
          : '📷 Image';
      }
      
      if (onConversationUpdate && (lastMessageText || file)) {
        onConversationUpdate(conversationId, {
          lastMessage: lastMessageText || (file ? "📷 Image" : ""),
          lastMessageTime: created.createdAt,
        } as Partial<Conversation>);
      }

      // Recharger les messages après envoi pour synchroniser avec le backend
      // Cela va aussi mettre à jour le lastMessage avec les données complètes du backend
      await loadMessages(conversationId);
      
      // Note: On ne recharge plus toutes les conversations car loadMessages 
      // met déjà à jour le lastMessageTime de la conversation active
    } catch (error: any) {
      console.error("Erreur lors de l'envoi du message :", error);
      const errorMessage = error.response?.data?.status?.message || error.message || "Erreur lors de l'envoi du message";
      if (onError) {
        onError(`Erreur : ${errorMessage}`);
      } else {
        alert(`Erreur : ${errorMessage}`);
      }
    }
  }, [currentUserId, loadMessages, onConversationUpdate]);

  return {
    messages,
    loading,
    loadMessages,
    handleSendMessage,
  };
};
