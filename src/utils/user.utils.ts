/**
 * Utilitaires pour la gestion des utilisateurs
 */

/**
 * Récupère l'ID de l'utilisateur connecté depuis localStorage
 * @returns L'ID de l'utilisateur ou null si non trouvé
 */
export const getCurrentUserId = (): number | null => {
  try {
    // Essayer d'abord userData (utilisé lors de la connexion)
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.id && typeof parsed.id === 'number') {
        return parsed.id;
      }
    }
    
    // Essayer currentUser (utilisé lors de l'inscription)
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const parsed = JSON.parse(currentUser);
      if (parsed.id && typeof parsed.id === 'number') {
        return parsed.id;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    return null;
  }
};

/**
 * Récupère l'ID de l'utilisateur connecté ou lance une erreur si non trouvé
 * Utile pour les cas où l'ID est strictement requis
 * @param errorMessage Message d'erreur personnalisé
 * @returns L'ID de l'utilisateur (ne retourne jamais null)
 * @throws Error si l'utilisateur n'est pas connecté
 */
export const requireCurrentUserId = (errorMessage: string = 'Utilisateur non connecté'): number => {
  const userId = getCurrentUserId();
  if (userId === null) {
    throw new Error(errorMessage);
  }
  return userId;
};
