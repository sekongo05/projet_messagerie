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
  const buttonBg = theme === 'dark' 
    ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' 
    : 'bg-red-500 hover:bg-red-600 active:bg-red-700';
  const iconBg = theme === 'dark' ? 'bg-red-500/20' : 'bg-red-100';

  return (
    <div className={`${cardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
      <button
        onClick={handleLeave}
        disabled={loading}
        className={`w-full ${buttonBg} text-white px-4 py-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <FiLogOut className="w-4 h-4" />
        </div>
        <span>{loading ? 'Traitement...' : 'Quitter le groupe'}</span>
      </button>
    </div>
  );
};

export default LeaveGroupButton;
