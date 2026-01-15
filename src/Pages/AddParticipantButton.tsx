import { useState } from 'react';
import { useTheme } from '../mode';
import { CgAdd } from 'react-icons/cg';
import UserPage from './user';

type AddParticipantButtonProps = {
  conversationId: number;
  theme?: 'light' | 'dark';
  onAdd?: (userId: number) => void; // Callback avec l'ID de l'utilisateur sélectionné
};

const AddParticipantButton = ({ conversationId, theme: themeProp, onAdd }: AddParticipantButtonProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [showContactsList, setShowContactsList] = useState(false);

  const handleAdd = () => {
    setShowContactsList(true);
  };

  const handleUserSelect = (userId: number) => {
    console.log('Utilisateur sélectionné pour être ajouté au groupe:', userId);
    if (onAdd) {
      onAdd(userId);
    }
    // Fermer la liste après sélection
    setShowContactsList(false);
  };

  const handleClose = () => {
    setShowContactsList(false);
  };

  const borderColor = theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50';
  const cardBg = theme === 'dark' ? 'bg-gray-900/30 backdrop-blur-sm' : 'bg-white/50 backdrop-blur-sm';
  const buttonBg = theme === 'dark' 
    ? 'bg-gradient-to-r from-orange-500 via-orange-500 to-orange-600 hover:from-orange-400 hover:via-orange-500 hover:to-orange-600 active:from-orange-600 active:to-orange-700 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40' 
    : 'bg-gradient-to-r from-orange-400 via-orange-500 to-orange-500 hover:from-orange-300 hover:via-orange-400 hover:to-orange-500 active:from-orange-500 active:to-orange-600 shadow-lg shadow-orange-400/30 hover:shadow-orange-500/40';
  const iconBg = theme === 'dark' ? 'bg-white/25' : 'bg-white/40';

  const overlayBg = theme === 'dark' ? 'bg-black/50' : 'bg-black/30';
  const modalBg = theme === 'dark' ? 'bg-black' : 'bg-white';

  return (
    <>
      <div className={`${cardBg} rounded-2xl p-3 border ${borderColor} transition-all hover:shadow-lg hover:border-orange-500/30`}>
        <button
          onClick={handleAdd}
          className={`mx-auto ${buttonBg} text-white px-4 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2.5 transform hover:scale-105 active:scale-95 relative overflow-hidden group`}
        >
          {/* Effet de brillance animé */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
          
          <div className={`p-1.5 rounded-lg ${iconBg} backdrop-blur-sm relative z-10 group-hover:scale-110 transition-transform duration-300`}>
            <CgAdd className="w-4 h-4 relative z-10" />
          </div>
          <span className="text-sm relative z-10 tracking-wide">Ajouter un participant</span>
        </button>
      </div>

      {/* Modal avec liste des contacts */}
      {showContactsList && (
        <>
          {/* Overlay */}
          <div 
            className={`fixed inset-0 z-[60] ${overlayBg} backdrop-blur-sm transition-opacity`}
            onClick={handleClose}
          />
          
          {/* Modal */}
          <div 
            className={`fixed inset-x-4 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[70] ${modalBg} rounded-2xl shadow-2xl border ${borderColor} max-w-2xl w-full max-h-[80vh] flex flex-col`}
            onClick={(e) => e.stopPropagation()}
            style={{
              animation: 'slideDown 0.3s ease-out'
            }}
          >
            {/* En-tête du modal */}
            <div className={`p-4 border-b ${borderColor} flex items-center justify-between`}>
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Sélectionner un contact
              </h3>
              <button
                onClick={handleClose}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-900 hover:text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
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

            {/* Liste des contacts */}
            <div className="flex-1 overflow-y-auto p-4">
              <UserPage 
                onUserSelect={handleUserSelect}
                selectedUserId={undefined}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default AddParticipantButton;