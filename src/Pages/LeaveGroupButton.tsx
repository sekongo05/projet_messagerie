import { useState } from 'react';
import { useTheme } from '../mode';
import { FiLogOut } from 'react-icons/fi';
import { deleteParticipant } from '../Api/deleteParticipantConversation.api';

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

  const handleLeave = async () => {
    if (loading) return;
    
    // Confirmation avant de quitter
    if (!window.confirm('Êtes-vous sûr de vouloir quitter ce groupe ?')) {
      return;
    }
    
    setLoading(true);
    
    try {
      const currentUserId = getCurrentUserId();
      const response = await deleteParticipant(
        { conversationId, userId: currentUserId },
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
        <span className="text-sm relative z-10 tracking-wide">{loading ? 'Traitement...' : 'Quitter le groupe'}</span>
      </button>
    </div>
  );
};

export default LeaveGroupButton;
