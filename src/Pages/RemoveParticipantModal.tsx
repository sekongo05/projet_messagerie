import { useState, useEffect } from 'react';
import { useTheme } from '../mode';
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import { deleteParticipant } from '../Api/deleteParticipantConversation.api';
import { getUsers, type User } from '../Api/User.api';
import { FiLoader, FiX, FiTrash2 } from 'react-icons/fi';
import {
  normalizeParticipant,
  getParticipantState,
  canManageAdminStatus
} from '../utils/participantState.utils';
import { logDiagnostic } from '../utils/participantStateDiagnostic.utils';
import { validateDeleteResponse, logValidation } from '../utils/participantStateValidation.utils';

type RemoveParticipantModalProps = {
  conversationId: number;
  conversationTitle: string;
  currentUserId: number;
  onClose: () => void;
  onSuccess?: (participant?: any) => void;
  theme?: 'light' | 'dark';
};

type ParticipantWithUserInfo = {
  id: number;
  userId: number;
  isAdmin?: boolean;
  nom?: string;
  prenoms?: string;
  email?: string;
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

const RemoveParticipantModal = ({ 
  conversationId, 
  conversationTitle,
  currentUserId,
  onClose, 
  onSuccess,
  theme: themeProp 
}: RemoveParticipantModalProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [participants, setParticipants] = useState<ParticipantWithUserInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Charger les participants du groupe
  useEffect(() => {
    loadParticipants();
  }, []);

  const loadParticipants = async () => {
    setLoadingParticipants(true);
    setError('');
    
    try {
      // 1. Charger les participants de la conversation
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

      // 2. Charger tous les utilisateurs pour obtenir leurs informations
      const usersResponse: any = await getUsers(currentUserId);
      let allUsers: User[] = [];
      
      if (Array.isArray(usersResponse)) {
        allUsers = usersResponse;
      } else if (usersResponse?.items) {
        allUsers = usersResponse.items;
      } else if (usersResponse?.data?.items) {
        allUsers = usersResponse.data.items;
      } else if (usersResponse?.data && Array.isArray(usersResponse.data)) {
        allUsers = usersResponse.data;
      }

      // 3. Mapper les participants avec leurs informations utilisateur
      const participantsWithUserInfo = participantsList.map((participant: any) => {
        // Normaliser le participant
        const normalizedParticipant = normalizeParticipant(participant);
        const userInfo = allUsers.find((u: User) => u.id === participant.userId);
        
        return {
          ...normalizedParticipant,
          id: participant.id,
          userId: participant.userId,
          nom: userInfo?.nom || participant.nom || '',
          prenoms: userInfo?.prenoms || participant.prenoms || '',
          email: userInfo?.email || participant.email || '',
        };
      });

      // Filtrer pour exclure l'utilisateur connecté et les participants avec hasLeft ou hasDefinitivelyLeft
      const filteredParticipants = participantsWithUserInfo.filter(p => {
        if (p.userId === currentUserId) return false;
        
        const state = getParticipantState(p);
        return state.status !== 'definitively_left' && state.status !== 'left_once' && state.status !== 'rejoined';
      });

      setParticipants(filteredParticipants);
    } catch (err: any) {
      console.error('Erreur lors du chargement des participants:', err);
      setError('Erreur lors du chargement des participants');
    } finally {
      setLoadingParticipants(false);
    }
  };

  const handleDeleteParticipant = async (participantId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir retirer ce participant du groupe ?')) {
      return;
    }

    setDeletingId(participantId);
    setError('');

    try {
      // Trouver le participant pour obtenir son userId
      const participant = participants.find(p => p.id === participantId);
      if (!participant) {
        throw new Error('Participant introuvable');
      }

      // Utiliser deleteParticipant avec conversationId, userId du participant, et currentUserId comme requestingUserId
      const response = await deleteParticipant(
        {
          conversationId: conversationId,
          userId: participant.userId
        },
        currentUserId
      );
      
      console.log('Réponse complète après suppression de participant:', response);
      console.log('Structure complète de la réponse:', JSON.stringify(response, null, 2));
      
      // ✅ Vérifier d'abord les erreurs
      if (response.hasError) {
        const errorCode = response.status?.code;
        const errorMessage = response.status?.message || 'Erreur lors de la suppression du participant';
        
        console.error('Erreur fonctionnelle dans la réponse:', {
          hasError: response.hasError,
          code: errorCode,
          status: response.status,
          message: errorMessage,
          fullResponse: response
        });
        
        // Les messages d'erreur du backend sont déjà explicites et complets
        // On les affiche directement à l'utilisateur
        setError(errorMessage);
        setDeletingId(null);
        return;
      }
      
      // ✅ Vérifier que items existe et contient au moins un élément
      if (response.items && response.items.length > 0) {
        const updatedParticipant = response.items[0];
        
        // Diagnostic : vérifier si le backend retourne les champs mis à jour après suppression
        if (typeof window !== 'undefined') {
          logDiagnostic(updatedParticipant, 'delete', 'Après suppression du participant');
          
          // Validation : vérifier que la logique métier est respectée
          const validation = validateDeleteResponse(participant, updatedParticipant, currentUserId);
          logValidation(validation, 'Retirer un participant du groupe');
          
          if (!validation.isValid) {
            console.error('🚨 PROBLÈME BACKEND: La logique métier n\'est pas respectée lors de la suppression');
            console.error('Le participant devrait avoir hasLeft=true, leftAt et leftBy remplis');
          }
        }
        
        console.log('Participant mis à jour après suppression:', updatedParticipant);
        
        // Logger les nouveaux états du participant
        console.log('États du participant après suppression:', {
          id: updatedParticipant.id,
          userId: updatedParticipant.userId,
          conversationId: updatedParticipant.conversationId,
          hasLeft: updatedParticipant.hasLeft,
          hasDefinitivelyLeft: updatedParticipant.hasDefinitivelyLeft,
          hasCleaned: updatedParticipant.hasCleaned,
          leftAt: updatedParticipant.leftAt,
          leftBy: updatedParticipant.leftBy,
          definitivelyLeftAt: updatedParticipant.definitivelyLeftAt,
          definitivelyLeftBy: updatedParticipant.definitivelyLeftBy,
          fullData: updatedParticipant
        });
        
        // Retirer le participant de la liste locale
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        
        // ✅ Passer le participant mis à jour à onSuccess
        if (onSuccess) {
          onSuccess(updatedParticipant);
        }
      } else {
        console.warn('Aucun participant retourné dans la réponse', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          fullResponse: response
        });
        // Retirer quand même de la liste locale même si pas de réponse
        setParticipants(prev => prev.filter(p => p.id !== participantId));
        if (onSuccess) {
          onSuccess(undefined);
        }
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression du participant:', err);
      setError(err.response?.data?.status?.message || err.message || 'Erreur lors de la suppression du participant');
    } finally {
      setDeletingId(null);
    }
  };

  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const cardBg = theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={`${bgColor} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${borderColor} border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
          <div>
            <h2 className={`text-2xl font-bold ${textPrimary}`}>Supprimer des participants</h2>
            <p className={`text-sm ${textSecondary} mt-1`}>Groupe: {conversationTitle}</p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            aria-label="Fermer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Liste des participants */}
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-3`}>
                Participants du groupe ({participants.length})
              </label>
              
              {loadingParticipants ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="animate-spin text-orange-500" />
                  <span className={`ml-2 ${textSecondary}`}>Chargement des participants...</span>
                </div>
              ) : participants.length === 0 ? (
                <p className={`text-center py-8 ${textSecondary}`}>
                  Aucun participant à supprimer (vous êtes le seul membre)
                </p>
              ) : (
                <div className={`max-h-96 overflow-y-auto space-y-2 ${cardBg} rounded-lg p-4`}>
                  {participants.map((participant) => {
                    const fullName = (participant.prenoms && participant.nom)
                      ? `${participant.prenoms} ${participant.nom}`
                      : participant.prenoms || participant.nom || participant.email || 'Participant';
                    const initials = (participant.prenoms?.charAt(0) || '') + (participant.nom?.charAt(0) || '') || fullName.charAt(0).toUpperCase();
                    const isDeleting = deletingId === participant.id;

                    return (
                      <div
                        key={participant.id}
                        className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                          theme === 'dark'
                            ? 'bg-gray-600/30 border border-gray-600'
                            : 'bg-white border border-gray-200'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-500 flex items-center justify-center text-white font-semibold text-sm border-2 border-orange-300 shrink-0`}>
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-medium ${textPrimary} truncate`}>{fullName}</p>
                            {participant.isAdmin && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                theme === 'dark'
                                  ? 'bg-orange-500/20 text-orange-300 border border-orange-400/40'
                                  : 'bg-orange-100 text-orange-700 border border-orange-300'
                              }`}>
                                Admin
                              </span>
                            )}
                            {/* Badge d'état du participant */}
                            {(() => {
                              const state = getParticipantState(participant);
                              if (state.status === 'left_once') {
                                return (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    theme === 'dark'
                                      ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/40'
                                      : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                                  }`}>
                                    🟡 A quitté
                                  </span>
                                );
                              } else if (state.status === 'rejoined') {
                                return (
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    theme === 'dark'
                                      ? 'bg-green-900/30 text-green-300 border border-green-500/40'
                                      : 'bg-green-100 text-green-700 border border-green-300'
                                  }`}>
                                    🟢 Réintégré
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>
                          {participant.email && (
                            <p className={`text-xs ${textSecondary} truncate`}>{participant.email}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleDeleteParticipant(participant.id)}
                          disabled={isDeleting || loading}
                          className={`p-2 rounded-lg transition-colors ${
                            isDeleting || loading
                              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                              : theme === 'dark'
                              ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                          }`}
                          title="Supprimer ce participant"
                        >
                          {isDeleting ? (
                            <FiLoader className="w-5 h-5 animate-spin" />
                          ) : (
                            <FiTrash2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              } border`}>
                {error}
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className={`p-6 border-t ${borderColor} flex items-center justify-end gap-3`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveParticipantModal;
