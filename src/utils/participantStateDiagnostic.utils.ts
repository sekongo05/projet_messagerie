/**
 * Utilitaires de diagnostic pour vérifier que le backend retourne
 * tous les champs d'état nécessaires pour la gestion des participants
 */

export interface DiagnosticResult {
  isComplete: boolean;
  missingFields: string[];
  presentFields: string[];
  warnings: string[];
  participant: any;
}

/**
 * Liste des champs d'état obligatoires selon la logique métier
 */
export const REQUIRED_STATE_FIELDS = [
  'hasLeft',
  'hasDefinitivelyLeft',
  'hasCleaned',
  'isAdmin',
  'isDeleted',
] as const;

/**
 * Champs conditionnels - doivent être présents selon le contexte
 */
export const CONDITIONAL_STATE_FIELDS = [
  'recreatedAt',
  'recreatedBy',
  'leftAt',
  'leftBy',
  'definitivelyLeftAt',
  'definitivelyLeftBy',
] as const;

/**
 * Vérifie si un participant a tous les champs d'état nécessaires
 */
export function diagnoseParticipantState(
  participant: any,
  apiSource: 'getByCriteria' | 'delete' | 'create' = 'getByCriteria'
): DiagnosticResult {
  const missingFields: string[] = [];
  const presentFields: string[] = [];
  const warnings: string[] = [];

  // Vérifier chaque champ obligatoire (toujours présents)
  REQUIRED_STATE_FIELDS.forEach((field) => {
    if (participant[field] === undefined) {
      missingFields.push(field);
    } else {
      presentFields.push(field);
    }
  });
  
  // Vérifier les champs conditionnels selon le contexte
  // Ces champs peuvent être null/undefined dans certains cas
  CONDITIONAL_STATE_FIELDS.forEach((field) => {
    // On vérifie juste leur présence, mais on ne les marque pas comme "manquants"
    // car ils peuvent être null dans certains états (ex: recreatedAt est null pour un nouveau participant)
    if (participant[field] !== undefined) {
      presentFields.push(field);
    }
  });

  // Vérifications spécifiques selon l'API
  if (apiSource === 'delete') {
    // Après suppression, on doit avoir hasLeft ou hasDefinitivelyLeft mis à jour
    if (!missingFields.includes('hasLeft') && participant.hasLeft !== undefined) {
      if (participant.hasLeft === true) {
        if (missingFields.includes('leftAt')) {
          warnings.push('hasLeft est true mais leftAt est manquant');
        }
        if (missingFields.includes('leftBy')) {
          warnings.push('hasLeft est true mais leftBy est manquant');
        }
      }
    }

    if (
      !missingFields.includes('hasDefinitivelyLeft') &&
      participant.hasDefinitivelyLeft === true
    ) {
      if (missingFields.includes('definitivelyLeftAt')) {
        warnings.push('hasDefinitivelyLeft est true mais definitivelyLeftAt est manquant');
      }
      if (missingFields.includes('definitivelyLeftBy')) {
        warnings.push('hasDefinitivelyLeft est true mais definitivelyLeftBy est manquant');
      }
    }
  }

  if (apiSource === 'create') {
    // Lors de réintégration, on doit avoir recreatedAt et recreatedBy
    if (
      !missingFields.includes('hasLeft') &&
      participant.hasLeft === false &&
      !missingFields.includes('recreatedAt') &&
      participant.recreatedAt
    ) {
      if (missingFields.includes('recreatedBy')) {
        warnings.push('recreatedAt est présent mais recreatedBy est manquant');
      }
    }
  }

  // Vérifier les champs booléens qui doivent toujours être présents
  const booleanFields = ['hasLeft', 'hasDefinitivelyLeft', 'hasCleaned', 'isAdmin', 'isDeleted'];
  booleanFields.forEach((field) => {
    if (!missingFields.includes(field) && typeof participant[field] !== 'boolean') {
      warnings.push(`${field} existe mais n'est pas un booléen (type: ${typeof participant[field]})`);
    }
  });

  const isComplete = missingFields.length === 0 && warnings.length === 0;

  return {
    isComplete,
    missingFields,
    presentFields,
    warnings,
    participant,
  };
}

/**
 * Génère un rapport de diagnostic détaillé pour un participant
 */
export function generateDiagnosticReport(
  participant: any,
  apiSource: 'getByCriteria' | 'delete' | 'create' = 'getByCriteria'
): string {
  const diagnostic = diagnoseParticipantState(participant, apiSource);

  let report = `\n=== DIAGNOSTIC PARTICIPANT STATE (${apiSource}) ===\n`;
  report += `Participant ID: ${participant.id || 'N/A'}\n`;
  report += `User ID: ${participant.userId || 'N/A'}\n`;
  report += `Conversation ID: ${participant.conversationId || 'N/A'}\n\n`;

  report += `✅ Champs obligatoires présents (${REQUIRED_STATE_FIELDS.filter(f => !diagnostic.missingFields.includes(f)).length}/${REQUIRED_STATE_FIELDS.length}):\n`;
  REQUIRED_STATE_FIELDS.forEach((field) => {
    const value = participant[field];
    if (value !== undefined) {
      report += `  - ${field}: ${JSON.stringify(value)}\n`;
    } else {
      report += `  - ${field}: ❌ MANQUANT\n`;
    }
  });

  report += `\n📋 Champs conditionnels (selon contexte):\n`;
  CONDITIONAL_STATE_FIELDS.forEach((field) => {
    const value = participant[field];
    if (value !== undefined && value !== null) {
      report += `  - ${field}: ${JSON.stringify(value)} ✅\n`;
    } else {
      report += `  - ${field}: null/undefined (normal selon contexte)\n`;
    }
  });

  report += `\n❌ Champs obligatoires manquants (${diagnostic.missingFields.length}):\n`;
  if (diagnostic.missingFields.length > 0) {
    diagnostic.missingFields.forEach((field) => {
      report += `  - ${field}\n`;
    });
  } else {
    report += `  (aucun) ✅\n`;
  }

  if (diagnostic.warnings.length > 0) {
    report += `\n⚠️ Avertissements:\n`;
    diagnostic.warnings.forEach((warning) => {
      report += `  - ${warning}\n`;
    });
  }

  report += `\n📊 Statut: ${diagnostic.isComplete ? '✅ COMPLET' : '❌ INCOMPLET'}\n`;
  report += `==========================================\n`;

  return report;
}

/**
 * Vérifie plusieurs participants et génère un rapport global
 */
export function diagnoseMultipleParticipants(
  participants: any[],
  apiSource: 'getByCriteria' | 'delete' | 'create' = 'getByCriteria'
): {
  allComplete: boolean;
  reports: DiagnosticResult[];
  summary: string;
} {
  const reports = participants.map((p) => diagnoseParticipantState(p, apiSource));
  const allComplete = reports.every((r) => r.isComplete);

  let summary = `\n=== RAPPORT GLOBAL (${participants.length} participants) ===\n`;
  summary += `Tous complets: ${allComplete ? '✅ OUI' : '❌ NON'}\n\n`;

  const missingFieldsCount: Record<string, number> = {};
  reports.forEach((report) => {
    report.missingFields.forEach((field) => {
      missingFieldsCount[field] = (missingFieldsCount[field] || 0) + 1;
    });
  });

  if (Object.keys(missingFieldsCount).length > 0) {
    summary += `Champs manquants (fréquence):\n`;
    Object.entries(missingFieldsCount)
      .sort(([, a], [, b]) => b - a)
      .forEach(([field, count]) => {
        summary += `  - ${field}: ${count}/${participants.length} participants\n`;
      });
  } else {
    summary += `✅ Tous les champs requis sont présents\n`;
  }

  summary += `==========================================\n`;

  return {
    allComplete,
    reports,
    summary,
  };
}

/**
 * Log un diagnostic complet pour debugging
 */
export function logDiagnostic(
  participant: any,
  apiSource: 'getByCriteria' | 'delete' | 'create' = 'getByCriteria',
  context?: string
): DiagnosticResult {
  const diagnostic = diagnoseParticipantState(participant, apiSource);
  const report = generateDiagnosticReport(participant, apiSource);

  console.group(
    `🔍 Diagnostic Participant State ${context ? `(${context})` : ''} - ${apiSource}`
  );
  console.log(report);
  if (!diagnostic.isComplete) {
    console.error('❌ Participant incomplet - Le backend ne retourne pas tous les champs requis');
    console.error('Champs manquants:', diagnostic.missingFields);
    if (diagnostic.warnings.length > 0) {
      console.warn('Avertissements:', diagnostic.warnings);
    }
  } else {
    console.log('✅ Participant complet - Tous les champs requis sont présents');
  }
  console.groupEnd();

  return diagnostic;
}
