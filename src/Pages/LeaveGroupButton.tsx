import { useState } from 'react';
import { useTheme } from '../mode';
import { FiLogOut } from 'react-icons/fi';

type LeaveGroupButtonProps = {
  conversationId: number;
  theme?: 'light' | 'dark';
  onLeave?: () => void; // Callback optionnel pour la logique future
};

const LeaveGroupButton = ({ conversationId, theme: themeProp, onLeave }: LeaveGroupButtonProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [loading, setLoading] = useState(false);

  const handleLeave = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // TODO: Implémenter la logique pour quitter le groupe
      // Appel API à venir
      if (onLeave) {
        onLeave();
      }
      console.log('Quitter le groupe:', conversationId);
    } catch (error) {
      console.error('Erreur lors de la sortie du groupe:', error);
    } finally {
      setLoading(false);
    }
  };

  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const cardBg = theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  
  // Nouveau design avec gradient orange/rouge
  const buttonBg = theme === 'dark' 
    ? 'bg-gradient-to-r from-orange-600/80 to-red-600/80 hover:from-orange-600 hover:to-red-600 active:from-orange-700 active:to-red-700 shadow-lg shadow-orange-500/20' 
    : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 active:from-orange-700 active:to-red-700 shadow-lg shadow-orange-200/50';
  const iconBg = theme === 'dark' ? 'bg-white/20' : 'bg-white/30';

  return (
    <div className={`${cardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
      <button
        onClick={handleLeave}
        disabled={loading}
        className={`w-full ${buttonBg} text-white px-6 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]`}
      >
        <div className={`p-2 rounded-lg ${iconBg} backdrop-blur-sm`}>
          <FiLogOut className="w-5 h-5" />
        </div>
        <span className="text-base">{loading ? 'Traitement...' : 'Quitter le groupe'}</span>
      </button>
    </div>
  );
};

export default LeaveGroupButton;
