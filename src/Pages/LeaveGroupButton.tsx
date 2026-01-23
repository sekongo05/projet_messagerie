import { useState, useEffect } from 'react';
import { useTheme } from '../mode';
import { FiLogOut } from 'react-icons/fi';
import { deleteParticipant } from '../Api/deleteParticipantConversation.api';
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import {
  normalizeParticipant,
  getParticipantState,
  canLeaveGroup
} from '../utils/participantState.utils';
import { validateDeleteResponse, logValidation } from '../utils/participantStateValidation.utils';
import { dispatchParticipantLeft } from '../Hooks/useCurrentUserLeftGroup';

type LeaveGroupButtonProps = {
  conversationId: number;
  theme?: 'light' | 'dark';
  onLeave?: () => void; // Callback optionnel appelé après succès
  onError?: (errorMessage: string) => void; // Callback optionnel pour gérer les erreurs
};

const LeaveGroupButton = ({ conversationId, theme: themeProp, onLeave, onError }: LeaveGroupButtonProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [loading, setLoading] = useState(false);
  const [participantState, setParticipantState] = useState<{ canLeave: boolean; status: string; isRejoined: boolean } | null>(null);
  const [loadingState, setLoadingState] = useState(true);

  // Récupérer l'ID de l'utilisateur connecté
  const getCurrentUserId = (): number => {
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

  // Charger l'état du participant au montage
  useEffect(() => {
    const loadParticipantState = async () => {
      try {
        const currentUserId = getCurrentUserId();
        const participantsResponse: any = await getParticipantsByConversationId(conversationId);
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

        const currentParticipant = participantsList.find((p: any) => p.userId === currentUserId);
        if (currentParticipant) {
          const normalized = normalizeParticipant(currentParticipant);
          const state = getParticipantState(normalized);
          const canLeave = canLeaveGroup(normalized);
          
          setParticipantState({
            canLeave,
            status: state.status,
            isRejoined: state.status === 'rejoined'
          });
        } else {
          setParticipantState({ canLeave: false, status: 'not_found', isRejoined: false });
        }
      } catch (err) {
        console.error('Erreur lors du chargement de l\'état du participant:', err);
        setParticipantState({ canLeave: true, status: 'unknown', isRejoined: false }); // Par défaut, permettre de quitter
      } finally {
        setLoadingState(false);
      }
    };

    loadParticipantState();
  }, [conversationId]);

  const handleLeave = async () => {
    if (loading) return;
    
    // Vérifier si l'utilisateur peut quitter
    if (participantState && !participantState.canLeave) {
      const errorMsg = '⚠️ Vous ne pouvez pas quitter ce groupe car vous avez déjà quitté définitivement.';
      if (onError) {
        onError(errorMsg);
      } else {
        alert(errorMsg);
      }
      return;
    }
    
    // Message de confirmation adapté selon l'état
    let confirmMessage = 'Êtes-vous sûr de vouloir quitter ce groupe ?';
    if (participantState?.isRejoined) {
      confirmMessage = '⚠️ Attention : Ce sera votre 2ème départ. Vous ne pourrez plus revenir dans ce groupe. Êtes-vous sûr de vouloir quitter définitivement ?';
    }
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    setLoading(true);
    
    try {
      const currentUserId = getCurrentUserId();
      
      // Charger l'état avant pour la validation
      let participantBefore: any = null;
      try {
        const participantsResponse: any = await getParticipantsByConversationId(conversationId);
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
        
        participantBefore = participantsList.find((p: any) => p.userId === currentUserId);
      } catch (err) {
        console.warn('Impossible de charger l\'état avant pour la validation:', err);
      }
      
      const response = await deleteParticipant(
        {
          conversationId: conversationId,
          userId: currentUserId
        },
        currentUserId
      );
      
      if (response.hasError) {
        // Gérer les erreurs de l'API avec des messages personnalisés
        const apiMessage = response.status?.message || '';
        let errorMessage = '';
        
        // Personnaliser le message selon le type d'erreur
        const lowerMessage = apiMessage.toLowerCase();
        
        if (lowerMessage.includes('admin') || lowerMessage.includes('administrateur') || lowerMessage.includes('administrator')) {
          errorMessage = '⚠️ Action impossible : En tant qu\'administrateur, vous ne pouvez pas quitter le groupe directement.\n\n💡 Solution : Transférez d\'abord les droits d\'administration à un autre membre du groupe avant de le quitter.';
        } else if (lowerMessage.includes('dernier') || lowerMessage.includes('last') || lowerMessage.includes('seul')) {
          errorMessage = '⚠️ Action impossible : Vous êtes le dernier membre de ce groupe.\n\n💡 Solution : Pour supprimer définitivement le groupe, contactez un administrateur système ou utilisez l\'option de suppression du groupe si elle est disponible.';
        } else if (lowerMessage.includes('introuvable') || lowerMessage.includes('not found') || lowerMessage.includes('n\'existe pas')) {
          errorMessage = 'ℹ️ Information : Il semble que vous ayez déjà quitté ce groupe ou que celui-ci n\'existe plus.\n\n🔄 La liste des conversations sera mise à jour automatiquement.';
        } else if (lowerMessage.includes('permission') || lowerMessage.includes('autorisé') || lowerMessage.includes('authorized') || lowerMessage.includes('accès')) {
          errorMessage = '🚫 Permission refusée : Vous n\'avez pas les autorisations nécessaires pour quitter ce groupe.\n\n💡 Veuillez contacter un administrateur du groupe pour obtenir de l\'aide.';
        } else if (lowerMessage.includes('réseau') || lowerMessage.includes('network') || lowerMessage.includes('timeout') || lowerMessage.includes('connexion')) {
          errorMessage = '🌐 Problème de connexion : Impossible de contacter le serveur.\n\n🔄 Vérifiez votre connexion internet et réessayez dans quelques instants.';
        } else if (apiMessage && apiMessage.trim() !== '') {
          // Utiliser le message de l'API mais le formater de manière plus conviviale
          errorMessage = `❌ Erreur : ${apiMessage}\n\n💡 Veuillez réessayer ou contacter le support si le problème persiste.`;
        } else {
          errorMessage = '❌ Oups ! Une erreur inattendue s\'est produite lors de votre tentative de quitter le groupe.\n\n🔄 Veuillez réessayer dans quelques instants. Si le problème persiste, rafraîchissez la page.';
        }
        
        // Appeler le callback d'erreur si fourni, sinon afficher une alerte
        if (onError) {
          onError(errorMessage);
        } else {
          alert(errorMessage);
        }
      } else {
        // Sortie réussie - Vérifier que items existe et contient le participant mis à jour
        if (response.items && response.items.length > 0) {
          const updatedParticipant = response.items[0];
          
          // Validation : vérifier que la logique métier est respectée
          if (typeof window !== 'undefined' && participantBefore) {
            const participantBeforeNormalized = normalizeParticipant(participantBefore);
            const validation = validateDeleteResponse(
              participantBeforeNormalized,
              updatedParticipant,
              currentUserId
            );
            logValidation(validation, 'Quitter le groupe (LeaveGroupButton)');
            
            if (!validation.isValid) {
              console.error('🚨 PROBLÈME BACKEND: La logique métier n\'est pas respectée lors de la sortie du groupe');
              const state = getParticipantState(participantBeforeNormalized);
              if (state.status === 'active') {
                console.error('1er départ attendu: hasLeft=true, leftAt et leftBy remplis, isDeleted=true');
              } else if (state.status === 'rejoined') {
                console.error('2ème départ (définitif) attendu: hasDefinitivelyLeft=true, definitivelyLeftAt et definitivelyLeftBy remplis, hasCleaned=true');
              }
            }
          }
        }
        
        dispatchParticipantLeft(conversationId);
        // Sortie réussie
        if (onLeave) {
          onLeave();
        }
        console.log('Groupe quitté avec succès:', conversationId);
      }
    } catch (err: any) {
      console.error('Erreur lors de la sortie du groupe:', err);
      let errorMessage = '';
      
      if (err.response?.data?.status?.message) {
        const apiMsg = err.response.data.status.message.toLowerCase();
        if (apiMsg.includes('réseau') || apiMsg.includes('network') || apiMsg.includes('timeout')) {
          errorMessage = '🌐 Problème de connexion : Le serveur ne répond pas.\n\n🔄 Vérifiez votre connexion internet et réessayez. Si le problème persiste, le serveur peut être temporairement indisponible.';
        } else {
          errorMessage = `❌ Erreur : ${err.response.data.status.message}\n\n💡 Veuillez réessayer ou rafraîchir la page.`;
        }
      } else if (err.message) {
        if (err.message.toLowerCase().includes('network') || err.message.toLowerCase().includes('timeout')) {
          errorMessage = '🌐 Problème de connexion : Impossible d\'établir une connexion avec le serveur.\n\n🔄 Vérifiez votre connexion internet et réessayez.';
        } else {
          errorMessage = `❌ Erreur technique : ${err.message}\n\n💡 Si le problème persiste, essayez de rafraîchir la page.`;
        }
      } else {
        errorMessage = '🌐 Erreur de connexion : Impossible de contacter le serveur.\n\n🔄 Vérifiez votre connexion internet et réessayez. Si le problème persiste, le serveur peut être temporairement indisponible.';
      }
      
      // Appeler le callback d'erreur si fourni, sinon afficher une alerte
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const borderColor = theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50';
  const cardBg = theme === 'dark' ? 'bg-gray-900/30 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm';
  
  // Design avec gradient orange/rouge esthétique
  const buttonBg = theme === 'dark' 
    ? 'bg-gradient-to-r from-red-600 via-orange-600 to-red-600 hover:from-red-500 hover:via-orange-500 hover:to-red-500 active:from-red-700 active:via-orange-700 active:to-red-700 shadow-lg shadow-red-500/30 hover:shadow-red-500/40' 
    : 'bg-gradient-to-r from-red-500 via-orange-500 to-red-500 hover:from-red-400 hover:via-orange-400 hover:to-red-400 active:from-red-600 active:via-orange-600 active:to-red-600 shadow-lg shadow-red-400/30 hover:shadow-red-500/40';
  const iconBg = theme === 'dark' ? 'bg-white/25' : 'bg-white/40';

  return (
    <div className={`${cardBg} rounded-2xl p-3 border ${borderColor} transition-all hover:shadow-lg hover:border-red-500/30`}>
      {(participantState === null || participantState.canLeave) && (
        <button
          onClick={handleLeave}
          disabled={loading}
          className={`mx-auto ${buttonBg} text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 active:scale-95 relative overflow-hidden group`}
        >
          {/* Effet de brillance animé */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          
          <div className={`p-1.5 rounded-lg ${iconBg} backdrop-blur-sm relative z-10 group-hover:scale-110 transition-transform duration-300`}>
            <FiLogOut className="w-4 h-4 relative z-10" />
          </div>
          <span className="text-sm relative z-10 tracking-wide">
            {loading ? 'Traitement...' : participantState?.isRejoined ? 'Quitter définitivement' : 'Quitter le groupe'}
          </span>
        </button>
      )}
      {participantState && !participantState.canLeave && (
        <p className={`text-xs text-center mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          ⚠️ Vous avez déjà quitté définitivement ce groupe
        </p>
      )}
    </div>
  );
};

export default LeaveGroupButton;
