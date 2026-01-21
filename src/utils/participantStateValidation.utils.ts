/**
 * Utilitaires de validation pour vérifier que la logique métier
 * des états des participants est respectée par le backend
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  expectedState: string;
  actualState: string;
}

/**
 * Valide que la réponse du backend après suppression (retirer/quitter) respecte la logique
 */
export function validateDeleteResponse(
  participantBefore: any,
  participantAfter: any,
  requestingUserId: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const before = participantBefore || {};
  const after = participantAfter || {};

  // Vérifier si c'est le 1er départ ou le 2ème (définitif)
  const wasActive = !before.hasLeft || before.hasLeft === false;
  const wasRejoined = before.hasLeft === true && before.recreatedAt != null;

  if (wasActive) {
    // 1er départ : doit avoir hasLeft = true, leftAt et leftBy remplis
    if (after.hasLeft !== true) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après 1er départ, hasLeft devrait être true, mais reçu: ${after.hasLeft}`
      );
    }
    if (!after.leftAt) {
      errors.push('❌ ERREUR LOGIQUE: Après 1er départ, leftAt devrait être rempli');
    }
    if (after.leftBy !== requestingUserId) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après 1er départ, leftBy devrait être ${requestingUserId}, mais reçu: ${after.leftBy}`
      );
    }
    if (after.hasDefinitivelyLeft === true) {
      errors.push(
        '❌ ERREUR LOGIQUE: Après 1er départ, hasDefinitivelyLeft ne devrait PAS être true'
      );
    }
    // Vérifier que isDeleted passe à true
    if (after.isDeleted !== true) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après 1er départ, isDeleted devrait être true (participant retiré du groupe), mais reçu: ${after.isDeleted}`
      );
    }

    const expectedState = `hasLeft=true, leftAt=date, leftBy=${requestingUserId}, hasDefinitivelyLeft=false, isDeleted=true`;
    const actualState = `hasLeft=${after.hasLeft}, leftAt=${after.leftAt || 'MANQUANT'}, leftBy=${after.leftBy || 'MANQUANT'}, hasDefinitivelyLeft=${after.hasDefinitivelyLeft}, isDeleted=${after.isDeleted}`;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      expectedState,
      actualState,
    };
  } else if (wasRejoined) {
    // 2ème départ (définitif) : doit avoir hasDefinitivelyLeft = true, definitivelyLeftAt et definitivelyLeftBy remplis
    if (after.hasDefinitivelyLeft !== true) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après 2ème départ (définitif), hasDefinitivelyLeft devrait être true, mais reçu: ${after.hasDefinitivelyLeft}`
      );
    }
    if (!after.definitivelyLeftAt) {
      errors.push('❌ ERREUR LOGIQUE: Après 2ème départ, definitivelyLeftAt devrait être rempli');
    }
    if (after.definitivelyLeftBy !== requestingUserId) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après 2ème départ, definitivelyLeftBy devrait être ${requestingUserId}, mais reçu: ${after.definitivelyLeftBy}`
      );
    }
    // Vérifier que les champs du 1er départ sont conservés
    if (after.leftAt !== before.leftAt) {
      warnings.push(
        '⚠️ ATTENTION: leftAt du 1er départ devrait être conservé mais a changé'
      );
    }
    if (after.leftBy !== before.leftBy) {
      warnings.push(
        '⚠️ ATTENTION: leftBy du 1er départ devrait être conservé mais a changé'
      );
    }
    if (after.recreatedAt !== before.recreatedAt) {
      warnings.push(
        '⚠️ ATTENTION: recreatedAt devrait être conservé mais a changé'
      );
    }
    // Vérifier que hasCleaned passe à true lors du 2ème départ
    if (after.hasCleaned !== true) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après 2ème départ (définitif), hasCleaned devrait être true (conversation nettoyée automatiquement), mais reçu: ${after.hasCleaned}`
      );
    }
    // Vérifier que isDeleted reste à true
    if (after.isDeleted !== true) {
      warnings.push(
        `⚠️ ATTENTION: Après 2ème départ, isDeleted devrait rester true, mais reçu: ${after.isDeleted}`
      );
    }

    const expectedState = `hasDefinitivelyLeft=true, definitivelyLeftAt=date, definitivelyLeftBy=${requestingUserId}, hasCleaned=true, leftAt et recreatedAt conservés`;
    const actualState = `hasDefinitivelyLeft=${after.hasDefinitivelyLeft}, definitivelyLeftAt=${after.definitivelyLeftAt || 'MANQUANT'}, definitivelyLeftBy=${after.definitivelyLeftBy || 'MANQUANT'}, hasCleaned=${after.hasCleaned}`;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      expectedState,
      actualState,
    };
  } else {
    // Participant déjà définitivement parti - ne devrait pas pouvoir quitter
    errors.push('❌ ERREUR LOGIQUE: Tentative de quitter un participant déjà définitivement parti');
    return {
      isValid: false,
      errors,
      warnings,
      expectedState: 'Aucune action possible',
      actualState: `hasDefinitivelyLeft=${before.hasDefinitivelyLeft}`,
    };
  }
}

/**
 * Valide que la réponse du backend après création (ajout/réintégration) respecte la logique
 */
export function validateCreateResponse(
  participantBefore: any | null,
  participantAfter: any,
  requestingUserId: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Si le participant existait déjà et avait quitté, c'est une réintégration
  if (participantBefore && participantBefore.hasLeft === true) {
    // Réintégration : IMPORTANT - hasLeft RESTE À true, mais recreatedAt et recreatedBy remplis
    // isDeleted passe à false (participant actif maintenant)
    if (participantAfter.hasLeft !== true) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après réintégration, hasLeft devrait RESTER true (indique qu'il a déjà quitté une fois), mais reçu: ${participantAfter.hasLeft}`
      );
    }
    if (!participantAfter.recreatedAt) {
      errors.push(
        '❌ ERREUR LOGIQUE: Après réintégration, recreatedAt devrait être rempli'
      );
    }
    if (participantAfter.recreatedBy !== requestingUserId) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après réintégration, recreatedBy devrait être ${requestingUserId}, mais reçu: ${participantAfter.recreatedBy}`
      );
    }
    if (participantAfter.isDeleted !== false) {
      errors.push(
        `❌ ERREUR LOGIQUE: Après réintégration, isDeleted devrait être false (participant actif), mais reçu: ${participantAfter.isDeleted}`
      );
    }
    if (participantAfter.hasDefinitivelyLeft === true) {
      errors.push(
        '❌ ERREUR LOGIQUE: Après réintégration, hasDefinitivelyLeft ne devrait PAS être true (participant définitivement parti)'
      );
    }
    // Vérifier que leftAt et leftBy sont conservés
    if (
      participantBefore.leftAt &&
      participantAfter.leftAt !== participantBefore.leftAt
    ) {
      warnings.push(
        '⚠️ ATTENTION: leftAt du 1er départ devrait être conservé lors de la réintégration'
      );
    }
    if (
      participantBefore.leftBy &&
      participantAfter.leftBy !== participantBefore.leftBy
    ) {
      warnings.push(
        '⚠️ ATTENTION: leftBy du 1er départ devrait être conservé lors de la réintégration'
      );
    }

    const expectedState = `hasLeft=true (conserve l'historique), isDeleted=false (actif), recreatedAt=date, recreatedBy=${requestingUserId}, leftAt et leftBy conservés`;
    const actualState = `hasLeft=${participantAfter.hasLeft}, isDeleted=${participantAfter.isDeleted}, recreatedAt=${participantAfter.recreatedAt || 'MANQUANT'}, recreatedBy=${participantAfter.recreatedBy || 'MANQUANT'}`;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      expectedState,
      actualState,
    };
  } else {
    // Nouveau participant : doit avoir hasLeft = false par défaut
    if (participantAfter.hasLeft !== false && participantAfter.hasLeft !== undefined) {
      errors.push(
        `❌ ERREUR LOGIQUE: Nouveau participant devrait avoir hasLeft=false, mais reçu: ${participantAfter.hasLeft}`
      );
    }
    if (participantAfter.recreatedAt) {
      warnings.push(
        '⚠️ ATTENTION: Nouveau participant ne devrait pas avoir recreatedAt rempli'
      );
    }

    const expectedState = `hasLeft=false (nouveau participant)`;
    const actualState = `hasLeft=${participantAfter.hasLeft}`;

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      expectedState,
      actualState,
    };
  }
}

/**
 * Log la validation avec des messages clairs
 */
export function logValidation(
  validation: ValidationResult,
  context: string
): void {
  console.group(`🔍 Validation Logique Métier - ${context}`);
  console.log(`État attendu: ${validation.expectedState}`);
  console.log(`État reçu: ${validation.actualState}`);

  if (validation.isValid) {
    console.log('✅ Validation OK - La logique métier est respectée');
    if (validation.warnings.length > 0) {
      console.warn('⚠️ Avertissements:', validation.warnings);
    }
  } else {
    console.error('❌ Validation ÉCHOUÉE - La logique métier n\'est PAS respectée par le backend');
    console.error('Erreurs:', validation.errors);
    if (validation.warnings.length > 0) {
      console.warn('Avertissements:', validation.warnings);
    }
  }
  console.groupEnd();
}
