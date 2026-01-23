import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { CgInfo } from "react-icons/cg";
import { useTheme } from '../mode';
import type { Conversation } from '../Api/Conversation.api';
import { FiCalendar, FiHash, FiUsers, FiChevronDown, FiUserPlus, FiUserMinus, FiLogOut, FiMoreVertical, FiShield, FiX } from "react-icons/fi";
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import { getUsers, type User } from '../Api/User.api';
import { promoteAdmin } from '../Api/PromoteAdmin.api';
import { deleteParticipant } from '../Api/deleteParticipantConversation.api';
import AddParticipantsModal from './AddParticipantsModal';
import RemoveParticipantModal from './RemoveParticipantModal';
import {
  normalizeParticipant,
  getParticipantState,
  canLeaveGroup,
  getParticipantStatusMessage,
  type ParticipantState
} from '../utils/participantState.utils';
import { logDiagnostic } from '../utils/participantStateDiagnostic.utils';
import { validateDeleteResponse, logValidation } from '../utils/participantStateValidation.utils';
import { getCurrentUserId as getCurrentUserIdFromUtils } from '../utils/user.utils';
import { dispatchParticipantLeft } from '../Hooks/useCurrentUserLeftGroup';

type InfoGroupeProps = {
  conversation: Conversation;
  theme?: 'light' | 'dark';
  onWarning?: (message: string) => void;
  onError?: (message: string) => void;
};

type ParticipantUser = {
  id: number;
  conversationId?: number;
  nom?: string;
  prenoms?: string;
  email?: string;
  userId: number;
  isAdmin?: boolean;
  isDeleted?: boolean;
  hasLeft?: boolean;
  hasDefinitivelyLeft?: boolean;
  hasCleaned?: boolean;
  recreatedAt?: string | null;
  recreatedBy?: number | null;
  leftAt?: string | null;
  leftBy?: number | null;
  definitivelyLeftAt?: string | null;
  definitivelyLeftBy?: number | null;
  [key: string]: any;
};

const InfoGroupe = ({ conversation, theme: themeProp, onWarning, onError }: InfoGroupeProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [isOpen, setIsOpen] = useState(false);
  const [participants, setParticipants] = useState<ParticipantUser[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [leaveGroupError, setLeaveGroupError] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [openAdminMenuId, setOpenAdminMenuId] = useState<number | null>(null);
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string>('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const adminMenuRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  const handleShowGroupeInfo = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Récupérer l'ID de l'utilisateur connecté
  const getCurrentUserId = useCallback((): number | null => {
    return getCurrentUserIdFromUtils();
  }, []);

  // Charger les participants d'une conversation
  const loadParticipants = useCallback(async (conversationId: number) => {
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
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        console.error('ID utilisateur non disponible. Impossible de charger les utilisateurs.');
        setParticipants([]);
        setLoadingParticipants(false);
        return;
      }
      
      console.log('Chargement de tous les utilisateurs...');
      const usersResponse: any = await getUsers(currentUserId);
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
        console.log('Toutes les clés du participant dans loadParticipants:', Object.keys(participant));
        console.log('Participant complet dans loadParticipants:', JSON.stringify(participant, null, 2));
        
        // Chercher toutes les clés contenant "recreate", "left", "by", "at"
        const allKeys = Object.keys(participant);
        const relevantKeys = allKeys.filter(key => 
          key.toLowerCase().includes('recreate') || 
          key.toLowerCase().includes('left') || 
          key.toLowerCase().includes('by') ||
          key.toLowerCase().includes('at') ||
          key.toLowerCase().includes('clean')
        );
        console.log('Clés pertinentes trouvées dans loadParticipants:', relevantKeys);
        
        const userInfo = allUsers.find((u: User) => u.id === participant.userId);
        console.log('UserInfo trouvé pour userId', participant.userId, ':', userInfo);
        
        // Normaliser le participant pour avoir toutes les valeurs booléennes correctes
        const normalizedParticipant = normalizeParticipant(participant);
        
        console.log('Participant normalisé:', normalizedParticipant);
        console.log('🔍 Vérification recreatedAt pour le participant:', {
          userId: participant.userId,
          hasLeft: normalizedParticipant.hasLeft,
          hasDefinitivelyLeft: normalizedParticipant.hasDefinitivelyLeft,
          recreatedAt: normalizedParticipant.recreatedAt,
          recreatedBy: normalizedParticipant.recreatedBy,
          isDeleted: normalizedParticipant.isDeleted,
        });
        
        // Obtenir l'état du participant
        const participantState = getParticipantState(normalizedParticipant);
        console.log('État du participant déterminé:', participantState);
        if (participantState.status === 'rejoined') {
          console.log('✅ Statut "réintégré" détecté pour le participant userId:', participant.userId);
        }
        
        return {
          ...normalizedParticipant,
          nom: userInfo?.nom || participant.nom || '',
          prenoms: userInfo?.prenoms || participant.prenoms || '',
          email: userInfo?.email || participant.email || '',
        };
      });

      console.log('Participants avec informations utilisateur:', participantsWithUserInfo);
      setParticipants(participantsWithUserInfo);

      // Vérifier si l'utilisateur connecté est admin (utiliser la variable déjà déclarée)
      if (currentUserId !== null) {
        const currentUserParticipant = participantsWithUserInfo.find(
          (p) => p.userId === currentUserId
        );
        if (currentUserParticipant) {
          // Utiliser la valeur normalisée depuis normalizeParticipant
          setCurrentUserIsAdmin(currentUserParticipant.isAdmin || false);
        } else {
          setCurrentUserIsAdmin(false);
        }
      } else {
        setCurrentUserIsAdmin(false);
      }

    } catch (err: any) {
      console.error('Erreur lors du chargement des participants:', err);
      console.error('Détails de l\'erreur:', err.response?.data || err.message);
      setParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  }, [getCurrentUserId]);

  // Charger les participants quand le panneau est ouvert
  useEffect(() => {
    if (isOpen && conversation.id) {
      loadParticipants(conversation.id);
    }
  }, [isOpen, conversation.id, loadParticipants]);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }

      // Fermer les menus admin si on clique en dehors
      if (openAdminMenuId !== null) {
        const menuElement = adminMenuRefs.current[openAdminMenuId];
        if (menuElement && !menuElement.contains(event.target as Node)) {
          setOpenAdminMenuId(null);
        }
      }
    };

    if (showDropdown || openAdminMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown, openAdminMenuId]);

  // Extraire les informations de la conversation
  const conv = conversation as any;
  const titre = conv.titre || 'Groupe sans nom';
  const createdAt = conv.createdAt || conv.dateCreation || null;


  // Trier les participants : admins en premier, puis membres actifs, puis ceux qui ont quitté
  const sortedParticipants = useMemo(() => {
    return [...participants]
      .map(p => {
        const normalized = normalizeParticipant(p);
        return {
          ...p,
          ...normalized,
          // S'assurer que conversationId et isDeleted sont présents
          conversationId: normalized.conversationId ?? p.conversationId ?? conversation.id,
          isDeleted: normalized.isDeleted ?? false,
          // S'assurer que les types correspondent
          recreatedAt: normalized.recreatedAt ?? undefined,
          recreatedBy: normalized.recreatedBy ?? undefined,
          leftAt: normalized.leftAt ?? undefined,
          leftBy: normalized.leftBy ?? undefined,
          definitivelyLeftAt: normalized.definitivelyLeftAt ?? undefined,
          definitivelyLeftBy: normalized.definitivelyLeftBy ?? undefined,
        } as ParticipantUser;
      })
      .sort((a, b) => {
        // Si a est admin et b ne l'est pas, a vient en premier
        if (a.isAdmin && !b.isAdmin) return -1;
        // Si b est admin et a ne l'est pas, b vient en premier
        if (!a.isAdmin && b.isAdmin) return 1;
        // Ensuite, trier par statut : actifs en premier, puis ceux qui ont quitté
        // S'assurer que conversationId et isDeleted sont présents pour getParticipantState
        // Les participants sont déjà normalisés dans le map, donc les types sont corrects
        const stateA = getParticipantState(a as ParticipantState);
        const stateB = getParticipantState(b as ParticipantState);
        if (stateA.status === 'active' && stateB.status !== 'active') return -1;
        if (stateA.status !== 'active' && stateB.status === 'active') return 1;
        // Sinon, garder l'ordre initial
        return 0;
      });
  }, [participants, conversation.id]);

  // Calculer le nombre de participants actifs (sans les définitivement partis et les left_once)
  const activeParticipantsCount = useMemo(() => {
    return sortedParticipants.filter(p => {
      const normalized = normalizeParticipant(p);
      const state = getParticipantState(normalized);
      // Exclure définitivement partis et left_once (anciens membres)
      return state.status !== 'definitively_left' && state.status !== 'left_once';
    }).length;
  }, [sortedParticipants]);

  // Filtrer les participants actifs pour l'affichage (sans les anciens membres)
  const activeParticipants = useMemo(() => {
    return sortedParticipants.filter(p => {
      const normalized = normalizeParticipant(p);
      const state = getParticipantState(normalized);
      // Exclure définitivement partis et left_once (anciens membres)
      return state.status !== 'definitively_left' && state.status !== 'left_once';
    });
  }, [sortedParticipants]);

  // Filtrer les anciens membres (définitivement partis et left_once)
  const formerMembers = useMemo(() => {
    return sortedParticipants.filter(p => {
      const normalized = normalizeParticipant(p);
      const state = getParticipantState(normalized);
      // Inclure seulement définitivement partis et left_once
      return state.status === 'definitively_left' || state.status === 'left_once';
    });
  }, [sortedParticipants]);

  // Fonction pour promouvoir un participant en admin
  const handlePromoteAdmin = useCallback(async (participantUserId: number) => {
    setAdminError('');
    setOpenAdminMenuId(null);

    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setAdminError('❌ Erreur : Utilisateur non connecté.');
        setTimeout(() => setAdminError(''), 5000);
        return;
      }
      const response = await promoteAdmin(conversation.id, participantUserId, true, currentUserId);
      
      if (response.hasError) {
        const apiMessage = response.status?.message || '';
        let errorMessage = '';
        
        const lowerMessage = apiMessage.toLowerCase();
        
        if (lowerMessage.includes('admin') || lowerMessage.includes('administrateur') || lowerMessage.includes('permission')) {
          errorMessage = '⚠️ Permission requise : Seuls les administrateurs peuvent promouvoir d\'autres membres.\n\n💡 Vous devez avoir les droits d\'administration pour effectuer cette action.';
        } else if (lowerMessage.includes('introuvable') || lowerMessage.includes('not found')) {
          errorMessage = 'ℹ️ Participant introuvable : Ce membre n\'existe peut-être plus dans le groupe.';
        } else if (apiMessage && apiMessage.trim() !== '') {
          errorMessage = `❌ Erreur : ${apiMessage}\n\n💡 Veuillez réessayer.`;
        } else {
          errorMessage = '❌ Oups ! Une erreur s\'est produite lors de la promotion.\n\n🔄 Veuillez réessayer.';
        }
        
        setAdminError(errorMessage);
        setTimeout(() => {
          setAdminError('');
        }, 5000);
      } else {
        // Recharger les participants après succès
        await loadParticipants(conversation.id);
      }
    } catch (err: any) {
      console.error('Erreur lors de la promotion admin:', err);
      let errorMessage = '🌐 Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      
      if (err.response?.data?.status?.message) {
        errorMessage = `❌ Erreur : ${err.response.data.status.message}`;
      } else if (err.message) {
        errorMessage = `❌ Erreur technique : ${err.message}`;
      }
      
      setAdminError(errorMessage);
      setTimeout(() => {
        setAdminError('');
      }, 5000);
    }
  }, [conversation.id, loadParticipants, getCurrentUserId]);

  // Fonction pour retirer le statut admin d'un participant
  const handleRemoveAdmin = useCallback(async (participantUserId: number) => {
    setAdminError('');
    setOpenAdminMenuId(null);

    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setAdminError('❌ Erreur : Utilisateur non connecté.');
        setTimeout(() => setAdminError(''), 5000);
        return;
      }
      const response = await promoteAdmin(conversation.id, participantUserId, false, currentUserId);
      
      if (response.hasError) {
        const apiMessage = response.status?.message || '';
        let errorMessage = '';
        
        const lowerMessage = apiMessage.toLowerCase();
        
        if (lowerMessage.includes('admin') || lowerMessage.includes('administrateur') || lowerMessage.includes('permission')) {
          errorMessage = '⚠️ Permission requise : Seuls les administrateurs peuvent retirer les droits d\'administration.\n\n💡 Vous devez avoir les droits d\'administration pour effectuer cette action.';
        } else if (lowerMessage.includes('introuvable') || lowerMessage.includes('not found')) {
          errorMessage = 'ℹ️ Participant introuvable : Ce membre n\'existe peut-être plus dans le groupe.';
        } else if (apiMessage && apiMessage.trim() !== '') {
          errorMessage = `❌ Erreur : ${apiMessage}\n\n💡 Veuillez réessayer.`;
        } else {
          errorMessage = '❌ Oups ! Une erreur s\'est produite lors de la rétrogradation.\n\n🔄 Veuillez réessayer.';
        }
        
        setAdminError(errorMessage);
        setTimeout(() => {
          setAdminError('');
        }, 5000);
      } else {
        // Recharger les participants après succès
        await loadParticipants(conversation.id);
      }
    } catch (err: any) {
      console.error('Erreur lors de la rétrogradation admin:', err);
      let errorMessage = '🌐 Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      
      if (err.response?.data?.status?.message) {
        errorMessage = `❌ Erreur : ${err.response.data.status.message}`;
      } else if (err.message) {
        errorMessage = `❌ Erreur technique : ${err.message}`;
      }
      
      setAdminError(errorMessage);
      setTimeout(() => {
        setAdminError('');
      }, 5000);
    }
  }, [conversation.id, loadParticipants, getCurrentUserId]);

  // Fonction pour quitter le groupe
  const handleLeaveGroup = useCallback(async () => {
    const currentUserId = getCurrentUserId();
    if (!currentUserId) {
      setLeaveGroupError('❌ Erreur : Utilisateur non connecté.');
      setTimeout(() => setLeaveGroupError(''), 5000);
      return;
    }

    // Trouver le participant actuel
    const currentUserParticipant = participants.find(p => p.userId === currentUserId);
    
    // Vérifier si le participant peut quitter
    if (currentUserParticipant) {
      const normalized = normalizeParticipant(currentUserParticipant);
      const canLeave = canLeaveGroup(normalized);
      const state = getParticipantState(normalized);
      
      if (!canLeave) {
        setLeaveGroupError('⚠️ Vous avez déjà quitté définitivement ce groupe.');
        setTimeout(() => setLeaveGroupError(''), 5000);
        return;
      }
      
      // Message de confirmation selon l'état
      const confirmMessage = state.status === 'rejoined'
        ? '⚠️ Attention : Ce sera votre 2ème départ. Vous ne pourrez plus revenir dans ce groupe. Êtes-vous sûr de vouloir quitter définitivement ?'
        : 'Êtes-vous sûr de vouloir quitter ce groupe ?';
      
      if (!window.confirm(confirmMessage)) {
        return;
      }
    } else {
      // Fallback si participant non trouvé
      if (!window.confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) {
        return;
      }
    }

    setLeaveGroupError('');

    try {
      const currentUserId = getCurrentUserId();
      if (!currentUserId) {
        setLeaveGroupError('❌ Erreur : Utilisateur non connecté.');
        setTimeout(() => setLeaveGroupError(''), 5000);
        return;
      }
      const response = await deleteParticipant(
        {
          conversationId: conversation.id,
          userId: currentUserId
        },
        currentUserId
      );

      console.log('Réponse complète après avoir quitté le groupe:', response);
      console.log('Structure complète de la réponse:', JSON.stringify(response, null, 2));

      // ✅ Vérifier d'abord les erreurs
      if (response.hasError) {
        const apiMessage = response.status?.message || '';
        let errorMessage = '';
        
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
          errorMessage = `❌ Erreur : ${apiMessage}\n\n💡 Veuillez réessayer ou contacter le support si le problème persiste.`;
        } else {
          errorMessage = '❌ Oups ! Une erreur inattendue s\'est produite lors de votre tentative de quitter le groupe.\n\n🔄 Veuillez réessayer dans quelques instants. Si le problème persiste, rafraîchissez la page.';
        }
        
        setLeaveGroupError(errorMessage);
        setTimeout(() => {
          setLeaveGroupError('');
        }, 5000);
        return;
      }
      
      // ✅ Vérifier que items existe et contient au moins un élément
      if (response.items && response.items.length > 0) {
        const updatedParticipant = response.items[0];
        
        // Diagnostic : vérifier si le backend retourne les champs mis à jour
        if (typeof window !== 'undefined') {
          logDiagnostic(updatedParticipant, 'delete', 'Après avoir quitté le groupe');
          
          // Validation : vérifier que la logique métier est respectée
          if (currentUserParticipant) {
            const validation = validateDeleteResponse(
              normalizeParticipant(currentUserParticipant),
              updatedParticipant,
              currentUserId
            );
            logValidation(validation, 'Quitter le groupe');
            
            if (!validation.isValid) {
              console.error('🚨 PROBLÈME BACKEND: La logique métier n\'est pas respectée lors de la sortie du groupe');
              const state = getParticipantState(normalizeParticipant(currentUserParticipant));
              if (state.status === 'active') {
                console.error('1er départ attendu: hasLeft=true, leftAt et leftBy remplis');
              } else if (state.status === 'rejoined') {
                console.error('2ème départ (définitif) attendu: hasDefinitivelyLeft=true, definitivelyLeftAt et definitivelyLeftBy remplis');
              }
            }
          }
        }
        
        console.log('Vous avez quitté le groupe. Participant mis à jour:', updatedParticipant);
        
        // Logger les états du participant après avoir quitté le groupe
        console.log('Nouveaux états après avoir quitté le groupe:', {
          id: updatedParticipant.id,
          conversationId: updatedParticipant.conversationId,
          userId: updatedParticipant.userId,
          hasLeft: updatedParticipant.hasLeft,
          hasDefinitivelyLeft: updatedParticipant.hasDefinitivelyLeft,
          hasCleaned: updatedParticipant.hasCleaned,
          leftAt: updatedParticipant.leftAt,
          leftBy: updatedParticipant.leftBy,
          definitivelyLeftAt: updatedParticipant.definitivelyLeftAt,
          definitivelyLeftBy: updatedParticipant.definitivelyLeftBy,
          fullData: updatedParticipant
        });
      } else {
        console.warn('Aucun participant retourné dans la réponse après avoir quitté le groupe', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          fullResponse: response
        });
      }
      
      // Signaler que l'utilisateur a quitté (pour masquer l'input immédiatement si pas de reload)
      dispatchParticipantLeft(conversation.id);
      // Sortie réussie - recharger la page
      window.location.reload();
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
      
      setLeaveGroupError(errorMessage);
      setTimeout(() => {
        setLeaveGroupError('');
      }, 5000);
    }
  }, [conversation.id, getCurrentUserId]);

  // Fonction pour rendre un participant actif
  const renderParticipant = (participant: ParticipantUser) => {
    const currentUserId = getCurrentUserId();
    const isOwnParticipant = currentUserId !== null && participant.userId === currentUserId;
    const isMenuOpen = openAdminMenuId === participant.id;
    const showAdminButton = currentUserIsAdmin && !isOwnParticipant;
    
    // Normaliser et obtenir l'état du participant
    const normalizedParticipant = normalizeParticipant(participant);
    const participantState = getParticipantState(normalizedParticipant);
    const statusMessage = getParticipantStatusMessage(normalizedParticipant);

    return (
      <div 
        key={participant.id} 
        className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-600/30' : 'bg-white'} border ${borderColor} transition-all relative`}
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
                {isOwnParticipant ? (
                  <span className="italic">(Vous)</span>
                ) : (
                  participant.prenoms && participant.nom
                    ? `${participant.prenoms} ${participant.nom}`
                    : participant.prenoms
                    ? participant.prenoms
                    : participant.nom
                    ? participant.nom
                    : participant.email
                    ? participant.email.split('@')[0]
                    : `Participant #${participant.userId || participant.id}`
                )}
              </p>
              {/* Badge Admin/Membre */}
              {normalizedParticipant.isAdmin !== undefined && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${
                  normalizedParticipant.isAdmin
                    ? theme === 'dark'
                      ? 'bg-gradient-to-r from-orange-500/30 to-orange-600/30 text-orange-300 border border-orange-400/40 shadow-orange-500/20'
                      : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-300 shadow-orange-200/50'
                    : theme === 'dark'
                    ? 'bg-gradient-to-r from-gray-600/40 to-gray-700/40 text-gray-300 border border-gray-500/40 shadow-gray-600/20'
                    : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300 shadow-gray-200/50'
                }`}>
                  {normalizedParticipant.isAdmin ? (
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
              
              {/* Badge d'état du participant (quitté, réintégré, etc.) */}
              {participantState.status !== 'active' && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  participantState.status === 'left_once'
                    ? theme === 'dark'
                      ? 'bg-yellow-900/30 text-yellow-300 border border-yellow-500/40'
                      : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    : participantState.status === 'rejoined'
                    ? theme === 'dark'
                      ? 'bg-green-900/30 text-green-300 border border-green-500/40'
                      : 'bg-green-100 text-green-700 border border-green-300'
                    : ''
                }`}>
                  {participantState.status === 'left_once' && '🟡 A quitté'}
                  {participantState.status === 'rejoined' && '🟢 Réintégré'}
                </span>
              )}
            </div>
            {participant.email && (
              <p className={`text-xs ${textSecondary} mt-0.5`}>{participant.email}</p>
            )}
            {/* Afficher le message d'état si le participant n'est pas actif */}
            {participantState.status !== 'active' && (
              <p className={`text-xs ${textSecondary} mt-0.5 italic`}>
                {statusMessage}
                {normalizedParticipant.recreatedAt && normalizedParticipant.recreatedBy && (
                  <span className="ml-1">
                    (par utilisateur #{normalizedParticipant.recreatedBy})
                  </span>
                )}
              </p>
            )}
          </div>
        </div>

        {/* Bouton admin avec menu déroulant */}
        {showAdminButton && (
          <div 
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
            ref={(el) => {
              adminMenuRefs.current[participant.id] = el;
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setOpenAdminMenuId(isMenuOpen ? null : participant.id);
              }}
              className={`p-2 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
              title="Gérer le statut admin"
            >
              <FiMoreVertical className="w-5 h-5" />
            </button>

            {/* Menu déroulant */}
            {isMenuOpen && (
              <div className={`absolute right-full mr-2 top-1/2 transform -translate-y-1/2 rounded-lg border shadow-xl z-50 min-w-[200px] ${
                theme === 'dark'
                  ? 'bg-gray-900 border-gray-700'
                  : 'bg-white border-gray-200'
              }`}>
                <div className="py-1">
                  {!participant.isAdmin ? (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePromoteAdmin(participant.userId);
                      }}
                      className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-3 ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800 text-green-400'
                          : 'hover:bg-green-50 text-green-600'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${
                        theme === 'dark' ? 'bg-green-900/30' : 'bg-green-100'
                      }`}>
                        <FiShield className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm">Nommer admin</span>
                    </div>
                  ) : (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveAdmin(participant.userId);
                      }}
                      className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-3 ${
                        theme === 'dark'
                          ? 'hover:bg-gray-800 text-orange-400'
                          : 'hover:bg-orange-50 text-orange-600'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg ${
                        theme === 'dark' ? 'bg-orange-900/30' : 'bg-orange-100'
                      }`}>
                        <FiX className="w-4 h-4" />
                      </div>
                      <span className="font-medium text-sm">Retirer admin</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

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
                        Participants ({loadingParticipants ? '...' : activeParticipantsCount})
                      </h3>
                    </div>
                  </div>
                  
                  {loadingParticipants ? (
                    <div className="text-center py-4">
                      <p className={textSecondary}>Chargement des participants...</p>
                    </div>
                  ) : activeParticipants.length > 0 ? (
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {activeParticipants.map(renderParticipant)}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className={textSecondary}>Aucun participant trouvé.</p>
                    </div>
                  )}
                </div>

                {/* Anciens membres - Carte avec liste */}
                {!loadingParticipants && formerMembers.length > 0 && (
                  <div className={`${cardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md mt-4`}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${iconBg} shrink-0 opacity-60`}>
                        <FiUsers className={`w-5 h-5 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xs font-semibold uppercase tracking-wide ${textSecondary} mb-2 opacity-60`}>
                          Anciens membres ({formerMembers.length})
                        </h3>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {formerMembers.map((participant) => {
                        const normalizedParticipant = normalizeParticipant(participant);
                        const participantState = getParticipantState(normalizedParticipant);
                        const fullName = participant.prenoms && participant.nom
                          ? `${participant.prenoms} ${participant.nom}`
                          : participant.prenoms || participant.nom || participant.email || 'Ancien membre';
                        const initials = (participant.prenoms?.charAt(0) || '') + (participant.nom?.charAt(0) || '');
                        
                        return (
                          <div 
                            key={participant.id} 
                            className={`p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-100'} border ${borderColor} opacity-70`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-gray-300 to-gray-500 flex items-center justify-center text-white font-semibold text-xs border-2 border-gray-400 shrink-0 opacity-70`}>
                                {initials || fullName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`${textSecondary} font-medium text-sm opacity-80`}>
                                  {fullName}
                                </p>
                                {participant.email && (
                                  <p className={`text-xs ${textSecondary} opacity-60 mt-0.5`}>{participant.email}</p>
                                )}
                                {participantState.status === 'left_once' && (
                                  <p className={`text-xs ${textSecondary} opacity-60 mt-1 italic`}>
                                    A quitté le groupe
                                    {normalizedParticipant.leftAt && (
                                      <span className="ml-1">le {normalizedParticipant.leftAt}</span>
                                    )}
                                  </p>
                                )}
                                {participantState.status === 'definitively_left' && (
                                  <p className={`text-xs ${textSecondary} opacity-60 mt-1 italic`}>
                                    A quitté définitivement
                                    {normalizedParticipant.definitivelyLeftAt && (
                                      <span className="ml-1">le {normalizedParticipant.definitivelyLeftAt}</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Message d'erreur pour quitter le groupe */}
                {leaveGroupError && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-red-900/20 border-red-700/50 text-red-300'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <p className="text-sm font-medium whitespace-pre-line">{leaveGroupError}</p>
                  </div>
                )}

                {/* Message d'erreur pour la gestion admin */}
                {adminError && (
                  <div className={`mt-4 p-3 rounded-lg border ${
                    theme === 'dark'
                      ? 'bg-red-900/20 border-red-700/50 text-red-300'
                      : 'bg-red-50 border-red-200 text-red-700'
                  }`}>
                    <p className="text-sm font-medium whitespace-pre-line">{adminError}</p>
                  </div>
                )}

                {/* Menu déroulant pour les actions du groupe */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className={`w-full mt-4 px-4 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-between ${
                      theme === 'dark'
                        ? 'bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-400 hover:to-orange-300 text-white shadow-lg shadow-orange-400/30'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span>Actions du groupe</span>
                    </span>
                    <FiChevronDown 
                      className={`w-5 h-5 transition-transform duration-300 ${showDropdown ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  {/* Menu déroulant */}
                  {showDropdown && (
                    <div className={`absolute top-full left-0 right-0 mt-2 rounded-xl border shadow-xl overflow-hidden z-50 ${
                      theme === 'dark'
                        ? 'bg-gray-900 border-gray-700'
                        : 'bg-white border-gray-200'
                    }`}>
                      <div className="py-2">
                        {/* Options pour les admins uniquement */}
                        {currentUserIsAdmin && (
                          <>
                            {/* Option Ajouter participant */}
                            <div
                              onClick={() => {
                                setShowDropdown(false);
                                setShowAddModal(true);
                              }}
                              className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-3 ${
                                theme === 'dark'
                                  ? 'hover:bg-gray-800 text-gray-200'
                                  : 'hover:bg-orange-50 text-gray-700'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${
                                theme === 'dark' ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600'
                              }`}>
                                <FiUserPlus className="w-5 h-5" />
                              </div>
                              <span className="font-medium">Ajouter un participant</span>
                            </div>

                            {/* Option Supprimer participant */}
                            <div
                              onClick={() => {
                                setShowDropdown(false);
                                setShowRemoveModal(true);
                              }}
                              className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-3 ${
                                theme === 'dark'
                                  ? 'hover:bg-gray-800 text-gray-200'
                                  : 'hover:bg-orange-50 text-gray-700'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${
                                theme === 'dark' ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600'
                              }`}>
                                <FiUserMinus className="w-5 h-5" />
                              </div>
                              <span className="font-medium">Retirer un participant</span>
                            </div>

                            {/* Séparateur seulement si admin */}
                            <div className={`h-px my-2 ${
                              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                            }`} />
                          </>
                        )}

                        {/* Option Quitter le groupe - visible pour tous */}
                        <div
                          onClick={() => {
                            setShowDropdown(false);
                            handleLeaveGroup();
                          }}
                          className={`px-4 py-3 cursor-pointer transition-all flex items-center gap-3 ${
                            theme === 'dark'
                              ? 'hover:bg-red-900/30 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <div className={`p-2 rounded-lg ${
                            theme === 'dark' ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-600'
                          }`}>
                            <FiLogOut className="w-5 h-5" />
                          </div>
                          <span className="font-medium">Quitter le groupe</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modals pour les actions */}
                {showAddModal && (() => {
                  const currentUserId = getCurrentUserId();
                  if (!currentUserId) return null;
                  return (
                    <AddParticipantsModal
                      conversationId={conversation.id}
                      conversationTitle={titre}
                      currentUserId={currentUserId}
                      onClose={() => setShowAddModal(false)}
                      onWarning={onWarning}
                      onError={onError}
                      onSuccess={(participants) => {
                        if (participants && participants.length > 0) {
                          console.log('Participants ajoutés reçus dans InfoGroupe:', participants);
                          participants.forEach((p, index) => {
                            console.log(`État du participant ${index + 1} après ajout:`, {
                              userId: p.userId,
                              hasLeft: p.hasLeft,
                              hasDefinitivelyLeft: p.hasDefinitivelyLeft,
                              hasCleaned: p.hasCleaned,
                              recreatedAt: p.recreatedAt,
                              recreatedBy: p.recreatedBy,
                              leftAt: p.leftAt,
                              leftBy: p.leftBy,
                              definitivelyLeftAt: p.definitivelyLeftAt,
                              definitivelyLeftBy: p.definitivelyLeftBy,
                            });
                            
                            // Vérification spécifique pour recreatedBy
                            console.log(`⚠️ Vérification recreatedBy pour participant ${index + 1}:`, {
                              'recreatedBy reçu': p.recreatedBy,
                              'Type': typeof p.recreatedBy,
                              'Est défini': p.recreatedBy !== undefined,
                              'Est null': p.recreatedBy === null,
                              'recreatedAt présent': !!p.recreatedAt,
                              'Contexte': p.recreatedAt ? 'Réintégration détectée (recreatedAt présent)' : 'Nouveau participant'
                            });
                          });
                        }
                        loadParticipants(conversation.id);
                        setShowAddModal(false);
                      }}
                      theme={theme}
                    />
                  );
                })()}

                {showRemoveModal && (() => {
                  const currentUserId = getCurrentUserId();
                  if (!currentUserId) return null;
                  return (
                    <RemoveParticipantModal
                      conversationId={conversation.id}
                      conversationTitle={titre}
                      currentUserId={currentUserId}
                      theme={theme}
                      onClose={() => setShowRemoveModal(false)}
                      onSuccess={(participant) => {
                        if (participant) {
                          console.log('Participant retiré reçu dans InfoGroupe:', participant);
                          console.log('État du participant après retrait:', {
                            userId: participant.userId,
                            hasLeft: participant.hasLeft,
                            hasDefinitivelyLeft: participant.hasDefinitivelyLeft,
                            hasCleaned: participant.hasCleaned,
                            leftAt: participant.leftAt,
                            leftBy: participant.leftBy,
                            definitivelyLeftAt: participant.definitivelyLeftAt,
                            definitivelyLeftBy: participant.definitivelyLeftBy,
                          });
                        }
                        loadParticipants(conversation.id);
                        setShowRemoveModal(false);
                      }}
                    />
                  );
                })()}

              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default InfoGroupe;
