import { useState, useEffect, useMemo } from 'react';
import { CgInfo } from "react-icons/cg";
import { useTheme } from '../mode';
import type { Conversation } from '../Api/Conversation.api';
import { FiCalendar, FiHash, FiUsers } from "react-icons/fi";
import { getParticipantsByConversationId } from '../Api/ParticipantConversation.api';
import { getUsers, type User } from '../Api/User.api';
import LeaveGroupButton from './LeaveGroupButton';
import AddParticipantButton from './AddParticipantButton';

type InfoGroupeProps = {
  conversation: Conversation;
  theme?: 'light' | 'dark';
};

type ParticipantUser = {
  id: number;
  nom?: string;
  prenoms?: string;
  email?: string;
  userId: number;
  isAdmin?: boolean;
  [key: string]: any;
};

const InfoGroupe = ({ conversation, theme: themeProp }: InfoGroupeProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState<ParticipantUser[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const handleShowGroupeInfo = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Charger les participants quand le panneau est ouvert
  useEffect(() => {
    if (isOpen && conversation.id) {
      loadParticipants(conversation.id);
    }
  }, [isOpen, conversation.id]);

  // Charger les participants d'une conversation
  const loadParticipants = async (conversationId: number) => {
    setLoadingParticipants(true);
    
    try {
      console.log('Chargement des participants pour la conversation:', conversationId);
      
      // Récupérer les participants de la conversation
      const participantsResponse: any = await getParticipantsByConversationId(conversationId);
      console.log('Réponse complète des participants:', participantsResponse);
      
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
      
      console.log('Participants extraits:', participantsList);
      console.log('Nombre de participants:', participantsList.length);
      
      if (participantsList.length === 0) {
        console.warn('Aucun participant trouvé pour la conversation', conversationId);
        setParticipants([]);
        setLoadingParticipants(false);
        return;
      }

      // Récupérer tous les utilisateurs pour obtenir leurs noms et prénoms
      console.log('Chargement de tous les utilisateurs...');
      const usersResponse: any = await getUsers(1);
      console.log('Réponse complète des utilisateurs:', usersResponse);
      
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
      
      console.log('Utilisateurs extraits:', allUsers);
      console.log('Nombre d\'utilisateurs:', allUsers.length);
      
      // Mapper les participants avec leurs informations utilisateur
      const participantsWithUserInfo = participantsList.map((participant: any) => {
        console.log('Traitement du participant depuis ParticipantConversation API:', participant);
        const userInfo = allUsers.find((u: User) => u.id === participant.userId);
        console.log('UserInfo trouvé pour userId', participant.userId, ':', userInfo);
        
        // Extraire isAdmin depuis les données du participant de l'API ParticipantConversation
        // L'API ParticipantConversation retourne directement isAdmin dans les données du participant
        const isAdmin = participant.isAdmin === true || participant.isAdmin === 1 || participant.isAdmin === 'true';
        console.log('isAdmin extrait du participant:', isAdmin, '(valeur brute:', participant.isAdmin, ')');
        
        return {
          ...participant,
          nom: userInfo?.nom || participant.nom || '',
          prenoms: userInfo?.prenoms || participant.prenoms || '',
          email: userInfo?.email || participant.email || '',
          isAdmin: isAdmin,
        };
      });

      console.log('Participants avec informations utilisateur:', participantsWithUserInfo);
      setParticipants(participantsWithUserInfo);
    } catch (err: any) {
      console.error('Erreur lors du chargement des participants:', err);
      console.error('Détails de l\'erreur:', err.response?.data || err.message);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Extraire les informations de la conversation
  const conv = conversation as any;
  const titre = conv.titre || 'Groupe sans nom';
  const createdAt = conv.createdAt || conv.dateCreation || null;

  // Trier les participants : admins en premier, puis membres
  const sortedParticipants = useMemo(() => {
    return [...participants].sort((a, b) => {
      // Si a est admin et b ne l'est pas, a vient en premier
      if (a.isAdmin && !b.isAdmin) return -1;
      // Si b est admin et a ne l'est pas, b vient en premier
      if (!a.isAdmin && b.isAdmin) return 1;
      // Sinon, garder l'ordre initial (ou trier par nom si souhaité)
      return 0;
    });
  }, [participants]);

  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-white';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const overlayBg = theme === 'dark' ? 'bg-black/50' : 'bg-black/30';
  const cardBg = theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50';
  const iconBg = theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100';

  return (
    <>
      {/* Bouton info */}
      <button
        onClick={handleShowGroupeInfo}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'text-gray-400 hover:bg-gray-900 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        title="Informations du groupe"
        aria-label="Informations du groupe"
      >
        <CgInfo className='w-5 h-5' />
      </button>

      {/* Panneau grand affiché juste en dessous de l'en-tête */}
      {isOpen && (
        <>
          {/* Overlay pour fermer en cliquant à l'extérieur avec flou */}
          <div 
            className={`fixed inset-0 z-40 ${overlayBg} backdrop-blur-sm transition-opacity`}
            onClick={handleClose}
          />
          <div 
            className={`fixed ${bgColor} shadow-2xl ${borderColor} border-b z-50 transform animate-slide-in-right`}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              right: 0, // Collé à droite
              width: '50vw', // Moitié de la largeur de la page
              height: '100vh', // Toute la hauteur de la page
              top: 0 // Depuis le haut de la page
            }}
          >
            {/* En-tête du panneau avec gradient */}
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-orange-50 to-orange-100'} border-b ${borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${iconBg} ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                    <CgInfo className={`w-6 h-6 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                  <h2 className={`text-xl font-bold ${textPrimary}`}>
                    Informations du groupe
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-900 hover:text-white'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                  aria-label="Fermer"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Contenu du panneau */}
            <div className="p-6 overflow-y-auto" style={{ height: 'calc(100vh - 120px)' }}>
              <div className="space-y-4">
                {/* Titre du groupe - Carte avec icône */}
                <div className={`${cardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                      <FiHash className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold uppercase tracking-wide ${textSecondary} mb-2`}>
                        Titre du groupe
                      </h3>
                      <p className={`text-base font-medium ${textPrimary} break-words`}>
                        {titre}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date de création - Carte avec icône */}
                {createdAt && (
                  <div className={`${cardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                        <FiCalendar className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xs font-semibold uppercase tracking-wide ${textSecondary} mb-2`}>
                          Date de création
                        </h3>
                        <p className={`text-base font-medium ${textPrimary}`}>
                          {(() => {
                            try {
                              const date = new Date(createdAt);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                });
                              }
                            } catch (e) {
                              // Ignorer les erreurs de parsing
                            }
                            return createdAt;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Participants - Carte avec liste */}
                <div className={`${cardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                      <FiUsers className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold uppercase tracking-wide ${textSecondary} mb-2`}>
                        Participants ({loadingParticipants ? '...' : sortedParticipants.length})
                      </h3>
                    </div>
                  </div>
                  
                  {loadingParticipants ? (
                    <div className="text-center py-4">
                      <p className={textSecondary}>Chargement des participants...</p>
                    </div>
                  ) : sortedParticipants.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {sortedParticipants.map((participant) => (
                        <div 
                          key={participant.id} 
                          className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-600/30' : 'bg-white'} border ${borderColor}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-orange-100 to-orange-500 flex items-center justify-center text-white font-semibold text-xs border-2 border-orange-400 shrink-0`}>
                              {participant.prenoms && participant.nom
                                ? (participant.prenoms.charAt(0) + participant.nom.charAt(0)).toUpperCase()
                                : participant.prenoms
                                ? participant.prenoms.charAt(0).toUpperCase()
                                : participant.email
                                ? participant.email.charAt(0).toUpperCase()
                                : '?'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className={`${textPrimary} font-medium text-sm`}>
                                  {participant.prenoms && participant.nom
                                    ? `${participant.prenoms} ${participant.nom}`
                                    : participant.prenoms
                                    ? participant.prenoms
                                    : participant.nom
                                    ? participant.nom
                                    : participant.email
                                    ? participant.email.split('@')[0]
                                    : `Participant #${participant.userId || participant.id}`}
                                </p>
                                {/* Badge de statut stylisé */}
                                {participant.isAdmin !== undefined && (
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${
                                    participant.isAdmin
                                      ? theme === 'dark'
                                        ? 'bg-gradient-to-r from-orange-500/30 to-orange-600/30 text-orange-300 border border-orange-400/40 shadow-orange-500/20'
                                        : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-300 shadow-orange-200/50'
                                      : theme === 'dark'
                                      ? 'bg-gradient-to-r from-gray-600/40 to-gray-700/40 text-gray-300 border border-gray-500/40 shadow-gray-600/20'
                                      : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 shadow-gray-200/50'
                                  }`}>
                                    {participant.isAdmin ? (
                                      <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                        Admin
                                      </span>
                                    ) : (
                                      <span className="flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                                        </svg>
                                        Membre
                                      </span>
                                    )}
                                  </span>
                                )}
                              </div>
                              {participant.email && (
                                <p className={`text-xs ${textSecondary} mt-0.5`}>{participant.email}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className={textSecondary}>Aucun participant trouvé.</p>
                    </div>
                  )}
                </div>

                {/* Bouton ajouter un participant */}
                <AddParticipantButton
                  conversationId={conversation.id}
                  conversationTitle={titre}
                  theme={theme}
                  onSuccess={() => {
                    // Recharger les participants après ajout
                    loadParticipants(conversation.id);
                  }}
                />

                {/* Bouton quitter le groupe */}
                <LeaveGroupButton
                  conversationId={conversation.id}
                  theme={theme}
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default InfoGroupe;
