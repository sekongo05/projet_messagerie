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
