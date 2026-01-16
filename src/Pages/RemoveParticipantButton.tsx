import { useState } from 'react';
import { useTheme } from '../mode';
import { FiTrash2 } from 'react-icons/fi';
import RemoveParticipantModal from './RemoveParticipantModal';
import { getParticipantsByConversationId } from '../Api/ParticipantConversation.api';

type RemoveParticipantButtonProps = {
  conversationId: number;
  conversationTitle?: string;
  currentUserId?: number;
  theme?: 'light' | 'dark';
  onSuccess?: () => void;
};

const RemoveParticipantButton = ({ 
  conversationId, 
  conversationTitle = '',
  currentUserId,
  theme: themeProp, 
  onSuccess 
}: RemoveParticipantButtonProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');

  // Récupérer l'ID de l'utilisateur connecté depuis localStorage si non fourni
  const getCurrentUserId = (): number => {
    if (currentUserId) return currentUserId;
    
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
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    }
    
    return 1; // Fallback
  };

  // Vérifier si l'utilisateur connecté est admin du groupe
  const checkAdminStatus = async (): Promise<boolean> => {
    try {
      const userId = getCurrentUserId();
      const participantsResponse: any = await getParticipantsByConversationId(conversationId);
      
      // Essayer différents formats de réponse
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

      // Trouver le participant correspondant à l'utilisateur connecté
      const currentUserParticipant = participantsList.find(
        (p: any) => p.userId === userId
      );

      if (!currentUserParticipant) {
        return false;
      }

      // Vérifier si l'utilisateur est admin
      const isAdmin = currentUserParticipant.isAdmin === true || 
                     currentUserParticipant.isAdmin === 1 || 
                     currentUserParticipant.isAdmin === 'true';
      
      return isAdmin;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut admin:', error);
      return false;
    }
  };

  const handleRemove = async () => {
    setError('');
    
    // Vérifier si l'utilisateur est admin
    const isAdmin = await checkAdminStatus();
    
    if (!isAdmin) {
      setError("Seul l'admin peut supprimer des participants");
      // Fermer le message d'erreur après 5 secondes
      setTimeout(() => {
        setError('');
      }, 5000);
      return;
    }

    setShowModal(true);
  };

  const handleClose = () => {
    setShowModal(false);
  };

  const handleSuccess = () => {
    if (onSuccess) {
      onSuccess();
    }
    setShowModal(false);
  };

  const borderColor = theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50';
  const cardBg = theme === 'dark' ? 'bg-gray-900/30 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm';
  const buttonBg = theme === 'dark' 
    ? 'bg-gradient-to-r from-red-600 via-red-600 to-red-700 hover:from-red-500 hover:via-red-500 hover:to-red-600 active:from-red-700 active:to-red-800 shadow-lg shadow-red-500/30 hover:shadow-red-500/40' 
    : 'bg-gradient-to-r from-red-500 via-red-500 to-red-600 hover:from-red-400 hover:via-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 shadow-lg shadow-red-400/30 hover:shadow-red-500/40';
  const iconBg = theme === 'dark' ? 'bg-white/25' : 'bg-white/40';

  return (
    <>
      <div className={`${cardBg} rounded-2xl p-3 border ${borderColor} transition-all hover:shadow-lg hover:border-red-500/30`}>
        {error && (
          <div className={`mb-3 p-3 rounded-lg ${
            theme === 'dark' 
              ? 'bg-red-900/30 border-red-700 text-red-300' 
              : 'bg-red-50 border-red-200 text-red-700'
          } border`}>
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        <button
          onClick={handleRemove}
          className={`mx-auto ${buttonBg} text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 transform hover:scale-105 active:scale-95 relative overflow-hidden group`}
        >
          {/* Effet de brillance animé */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          
          <div className={`p-1.5 rounded-lg ${iconBg} backdrop-blur-sm relative z-10 group-hover:scale-110 transition-transform duration-300`}>
            <FiTrash2 className="w-4 h-4 relative z-10" />
          </div>
          <span className="text-sm relative z-10 tracking-wide">Supprimer un participant</span>
        </button>
      </div>

      {/* Modal pour supprimer des participants */}
      {showModal && (
        <RemoveParticipantModal
          conversationId={conversationId}
          conversationTitle={conversationTitle}
          currentUserId={getCurrentUserId()}
          onClose={handleClose}
          onSuccess={handleSuccess}
          theme={theme}
        />
      )}
    </>
  );
};

export default RemoveParticipantButton;
