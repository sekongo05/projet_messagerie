import { useState } from 'react';
import { useTheme } from '../mode';
import { FiLogOut } from 'react-icons/fi';
import { deleteParticipant } from '../Api/deleteParticipant.api';

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
      const response = await deleteParticipant(conversationId, currentUserId);
      
      if (response.hasError) {
        // Gérer les erreurs de l'API
        const apiMessage = response.status?.message || '';
        let errorMessage = 'Une erreur est survenue lors de la sortie du groupe';
        
        // Personnaliser le message selon le type d'erreur
        if (apiMessage.toLowerCase().includes('admin') || apiMessage.toLowerCase().includes('administrateur')) {
          errorMessage = '✗ Les administrateurs ne peuvent pas quitter le groupe directement. Veuillez transférer les droits d\'administration d\'abord';
        } else if (apiMessage.toLowerCase().includes('dernier') || apiMessage.toLowerCase().includes('last')) {
          errorMessage = '✗ Impossible de quitter le groupe. Vous êtes le dernier membre. Supprimez le groupe à la place';
        } else if (apiMessage.toLowerCase().includes('introuvable') || apiMessage.toLowerCase().includes('not found')) {
          errorMessage = '✗ Participant introuvable. Vous avez peut-être déjà quitté le groupe';
        } else if (apiMessage.toLowerCase().includes('permission') || apiMessage.toLowerCase().includes('autorisé')) {
          errorMessage = '✗ Vous n\'avez pas la permission de quitter ce groupe';
        } else if (apiMessage) {
          errorMessage = `✗ ${apiMessage}`;
        } else {
          errorMessage = '✗ Erreur lors de la sortie du groupe. Veuillez réessayer';
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
      let errorMessage = '✗ Erreur de connexion. Vérifiez votre connexion internet et réessayez';
      
      if (err.response?.data?.status?.message) {
        errorMessage = `✗ ${err.response.data.status.message}`;
      } else if (err.message) {
        errorMessage = `✗ ${err.message}`;
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
