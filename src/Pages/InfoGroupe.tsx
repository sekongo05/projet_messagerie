import { useState } from 'react';
import { CgInfo } from "react-icons/cg";
import { useTheme } from '../mode';
import type { Conversation } from '../Api/Conversation.api';
import { FiCalendar, FiHash } from "react-icons/fi";

type InfoGroupeProps = {
  conversation: Conversation;
  theme?: 'light' | 'dark';
};

const InfoGroupe = ({ conversation, theme: themeProp }: InfoGroupeProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [isOpen, setIsOpen] = useState(false);

  const handleShowGroupeInfo = () => {
    setIsOpen(!isOpen);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Extraire les informations de la conversation
  const conv = conversation as any;
  const titre = conv.titre || 'Groupe sans nom';
  const createdAt = conv.createdAt || conv.dateCreation || null;

  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const overlayBg = theme === 'dark' ? 'bg-black/50' : 'bg-black/30';
  const cardBg = theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50';
  const iconBg = theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100';

  return (
    <>
      {/* Bouton info */}
      <button
        onClick={handleShowGroupeInfo}
        className={`p-2 rounded-lg transition-colors ${
          theme === 'dark'
            ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
        title="Informations du groupe"
        aria-label="Informations du groupe"
      >
        <CgInfo className='w-5 h-5' />
      </button>

      {/* Panneau latéral depuis la droite */}
      {isOpen && (
        <div 
          className={`fixed inset-0 z-50 ${overlayBg} transition-opacity`}
          onClick={handleClose}
        >
          <div 
            className={`fixed right-0 top-0 h-full ${bgColor} shadow-2xl w-full max-w-md ${borderColor} border-l transform animate-slide-in-right`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* En-tête du panneau avec gradient */}
            <div className={`relative p-6 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 to-gray-700' : 'bg-gradient-to-r from-orange-50 to-orange-100'} border-b ${borderColor}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${iconBg} ${theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                    <CgInfo className={`w-6 h-6 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                  <h2 className={`text-xl font-bold ${textPrimary}`}>
                    Informations du groupe
                  </h2>
                </div>
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-lg transition-all ${
                    theme === 'dark'
                      ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-white hover:text-gray-900'
                  }`}
                  aria-label="Fermer"
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
            </div>

            {/* Contenu du panneau */}
            <div className="p-6 overflow-y-auto h-[calc(100vh-120px)]">
              <div className="space-y-4">
                {/* Titre du groupe - Carte avec icône */}
                <div className={`${cardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                      <FiHash className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-xs font-semibold uppercase tracking-wide ${textSecondary} mb-2`}>
                        Titre du groupe
                      </h3>
                      <p className={`text-base font-medium ${textPrimary} break-words`}>
                        {titre}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Date de création - Carte avec icône */}
                {createdAt && (
                  <div className={`${cardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                        <FiCalendar className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={`text-xs font-semibold uppercase tracking-wide ${textSecondary} mb-2`}>
                          Date de création
                        </h3>
                        <p className={`text-base font-medium ${textPrimary}`}>
                          {(() => {
                            try {
                              const date = new Date(createdAt);
                              if (!isNaN(date.getTime())) {
                                return date.toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: 'long',
                                  year: 'numeric'
                                });
                              }
                            } catch (e) {
                              // Ignorer les erreurs de parsing
                            }
                            return createdAt;
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default InfoGroupe;
