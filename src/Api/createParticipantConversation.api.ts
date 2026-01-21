import axios from 'axios';
import { getCurrentUserId } from '../utils/user.utils';

const API_URL = 'http://localhost:8080';

export type ParticipantToAdd = {
  conversationId: number;
  userId: number;
  isAdmin?: boolean;
};

export type ParticipantState = {
  hasLeft?: boolean;
  hasDefinitivelyLeft?: boolean;
  hasCleaned?: boolean;
  recreatedAt?: string;
  recreatedBy?: number;
  leftAt?: string;
  leftBy?: number;
  definitivelyLeftAt?: string;
  definitivelyLeftBy?: number;
  [key: string]: any;
};

export const createParticipant = async (
  participants: ParticipantToAdd[],
  requestingUserId?: number
) => {
  // Déterminer l'ID de l'utilisateur qui fait la requête
  const resolvedRequestingUserId = requestingUserId ?? getCurrentUserId() ?? 1;
  
  if (!resolvedRequestingUserId) {
    throw new Error('ID utilisateur requis. Veuillez vous connecter.');
  }

  if (!participants || participants.length === 0) {
    throw new Error('Au moins un participant est requis.');
  }

  try {
    const response = await axios.post(
      `${API_URL}/participantConversation/create`,
      {
        user: resolvedRequestingUserId,
        datas: participants
      }
    );

    // Logger la réponse complète du backend
    console.log('Réponse complète du backend lors de l\'ajout de participants:', response.data);
   

    // Vérifier si la réponse contient une erreur fonctionnelle
    if (response.data.hasError) {
      const errorMessage = response.data.status?.message 
        || 'Erreur lors de l\'ajout des participants';
      console.error('Erreur fonctionnelle dans la réponse:', {
        hasError: response.data.hasError,
        status: response.data.status,
        message: errorMessage,
        fullResponse: response.data
      });
      throw new Error(errorMessage);
    }

    console.log('Participants ajoutés avec succès. Réponse:', response.data);
    return response.data;

  } catch (error: any) {
    // Si c'est déjà une erreur Error, la relancer
    if (error instanceof Error && error.message) {
      throw error;
    }
    
    // Gérer les erreurs axios
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.status?.message 
        || error.response?.data?.message 
        || error.message 
        || 'Erreur lors de l\'ajout des participants';
      
      console.error('Erreur API lors de l\'ajout des participants:', errorMessage);
      throw new Error(errorMessage);
    }
    
    console.error('Erreur lors de l\'ajout des participants', error);
    throw error;
  }
};
