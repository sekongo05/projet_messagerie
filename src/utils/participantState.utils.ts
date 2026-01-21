/**
 * Utilitaires pour la gestion des états des participants
 * Gère le cycle de vie : Actif → A quitté → Réintégré → Définitivement parti
 */

export interface ParticipantState {
  id: number;
  conversationId: number;
  userId: number;
  hasLeft: boolean;
  hasDefinitivelyLeft: boolean;
  hasCleaned: boolean;
  isAdmin: boolean;
  isDeleted: boolean;
  recreatedAt?: string | null;
  recreatedBy?: number | null;
  leftAt?: string | null;
  leftBy?: number | null;
  definitivelyLeftAt?: string | null;
  definitivelyLeftBy?: number | null;
  userNom?: string;
  userPrenoms?: string;
  [key: string]: any;
}

export type ParticipantStatus = 'active' | 'left_once' | 'rejoined' | 'definitively_left';

export interface ParticipantStateInfo {
  status: ParticipantStatus;
  canRejoin: boolean;
  canLeave: boolean;
  displayMessage: string;
}

/**
 * Normalise une valeur booléenne (false par défaut si null/undefined)
 */
export function normalizeBoolean(value: any): boolean {
  if (value === true || value === 1 || value === 'true') return true;
  if (value === false || value === 0 || value === 'false') return false;
  return false; // Par défaut false si null/undefined
}

/**
 * Normalise un participant avec toutes ses valeurs booléennes
 */
export function normalizeParticipant(participant: any): ParticipantState {
  // Gérer les variantes de noms (camelCase vs snake_case)
  const recreatedAt = participant.recreatedAt ?? participant.recreated_at ?? null;
  const recreatedBy = participant.recreatedBy ?? participant.recreated_by ?? null;
  const leftAt = participant.leftAt ?? participant.left_at ?? null;
  const leftBy = participant.leftBy ?? participant.left_by ?? null;
  const definitivelyLeftAt = participant.definitivelyLeftAt ?? participant.definitively_left_at ?? null;
  const definitivelyLeftBy = participant.definitivelyLeftBy ?? participant.definitively_left_by ?? null;
  
  return {
    ...participant,
    hasLeft: normalizeBoolean(participant.hasLeft ?? participant.has_left),
    hasDefinitivelyLeft: normalizeBoolean(participant.hasDefinitivelyLeft ?? participant.has_definitively_left),
    hasCleaned: normalizeBoolean(participant.hasCleaned ?? participant.has_cleaned),
    isAdmin: normalizeBoolean(participant.isAdmin ?? participant.is_admin),
    isDeleted: normalizeBoolean(participant.isDeleted ?? participant.is_deleted),
    recreatedAt: recreatedAt || null,
    recreatedBy: recreatedBy || null,
    leftAt: leftAt || null,
    leftBy: leftBy || null,
    definitivelyLeftAt: definitivelyLeftAt || null,
    definitivelyLeftBy: definitivelyLeftBy || null,
  };
}

/**
 * Détermine l'état actuel d'un participant
 */
export function getParticipantState(participant: ParticipantState): ParticipantStateInfo {
  // Normaliser le participant
  const normalized = normalizeParticipant(participant);

  // Participant définitivement parti
  if (normalized.hasDefinitivelyLeft) {
    return {
      status: 'definitively_left',
      canRejoin: false,
      canLeave: false,
      displayMessage: 'A quitté définitivement le groupe'
    };
  }

  // Participant qui a quitté une fois
  if (normalized.hasLeft && !normalized.hasDefinitivelyLeft) {
    // Vérifier s'il a été réintégré
    // IMPORTANT: Lors de la réintégration, hasLeft reste à true, mais recreatedAt est rempli
    // Vérifier si recreatedAt existe et n'est pas vide/null/undefined
    const hasRecreatedAt = normalized.recreatedAt && 
                           normalized.recreatedAt !== null && 
                           normalized.recreatedAt !== undefined &&
                           normalized.recreatedAt !== '';
    
    if (hasRecreatedAt) {
      // Participant réintégré: hasLeft = true, recreatedAt != null, isDeleted = false
      return {
        status: 'rejoined',
        canRejoin: false, // Déjà réintégré
        canLeave: true,   // Peut quitter une 2ème fois (définitif)
        displayMessage: `Réintégré le ${normalized.recreatedAt}`
      };
    } else {
      // Participant a quitté une fois mais pas encore réintégré
      return {
        status: 'left_once',
        canRejoin: true,  // Peut être réintégré par admin/créateur
        canLeave: false,  // Déjà parti
        displayMessage: `A quitté le ${normalized.leftAt || 'groupe'}`
      };
    }
  }

  // Participant actif
  return {
    status: 'active',
    canRejoin: false,
    canLeave: true,
    displayMessage: 'Membre actif'
  };
}

/**
 * Vérifie si un participant peut être réintégré
 */
export function canRejoinParticipant(
  participant: ParticipantState,
  isCreatorOrAdmin: boolean
): boolean {
  const normalized = normalizeParticipant(participant);

  // Ne peut pas réintégrer si définitivement parti
  if (normalized.hasDefinitivelyLeft) {
    return false;
  }

  // Ne peut réintégrer que si le participant a quitté une fois
  if (!normalized.hasLeft) {
    return false;
  }

  // Seul le créateur ou un admin peut réintégrer
  if (!isCreatorOrAdmin) {
    return false;
  }

  // Ne peut pas réintégrer si déjà réintégré (recreatedAt présent = déjà réintégré)
  if (normalized.recreatedAt) {
    return false;
  }

  return true;
}

/**
 * Vérifie si un participant peut quitter le groupe
 */
export function canLeaveGroup(participant: ParticipantState): boolean {
  const normalized = normalizeParticipant(participant);

  // Ne peut pas quitter si déjà définitivement parti
  if (normalized.hasDefinitivelyLeft) {
    return false;
  }

  // Peut quitter si :
  // - Actif (hasLeft = false) OU
  // - Réintégré (hasLeft = true mais recreatedAt présent, peut quitter une 2ème fois = définitif)
  if (!normalized.hasLeft) {
    return true; // Participant actif, peut quitter
  }
  if (normalized.hasLeft && normalized.recreatedAt) {
    return true; // Participant réintégré, peut quitter une 2ème fois (définitif)
  }
  return false; // Déjà quitté une fois, ne peut pas quitter à nouveau
}

/**
 * Détermine si la conversation doit être affichée pour l'utilisateur
 */
export function shouldDisplayConversation(participant: ParticipantState): boolean {
  const normalized = normalizeParticipant(participant);

  // Ne pas afficher si l'utilisateur a nettoyé la conversation
  if (normalized.hasCleaned) {
    return false;
  }

  // Afficher dans tous les autres cas
  return true;
}

/**
 * Obtient le message d'état à afficher pour un participant
 */
export function getParticipantStatusMessage(
  participant: ParticipantState,
  locale: string = 'fr'
): string {
  const state = getParticipantState(participant);
  const normalized = normalizeParticipant(participant);

  const messages = {
    fr: {
      active: 'Membre actif',
      left_once: `A quitté le ${normalized.leftAt || 'groupe'}`,
      rejoined: `Réintégré le ${normalized.recreatedAt}`,
      definitively_left: 'A quitté définitivement',
      cleaned: 'Conversation supprimée'
    },
    en: {
      active: 'Active member',
      left_once: `Left on ${normalized.leftAt || 'group'}`,
      rejoined: `Rejoined on ${normalized.recreatedAt}`,
      definitively_left: 'Definitively left',
      cleaned: 'Conversation deleted'
    }
  };

  const langMessages = messages[locale as keyof typeof messages] || messages.fr;
  return langMessages[state.status] || state.displayMessage;
}

/**
 * Vérifie si un participant peut être promu/rétrogradé admin
 */
export function canManageAdminStatus(
  participant: ParticipantState,
  currentUserId: number,
  isCreatorOrAdmin: boolean
): boolean {
  const normalized = normalizeParticipant(participant);

  // Seul le créateur ou un admin peut gérer les admins
  if (!isCreatorOrAdmin) {
    return false;
  }

  // Ne peut pas gérer si le participant a définitivement quitté
  if (normalized.hasDefinitivelyLeft) {
    return false;
  }

  return true;
}
