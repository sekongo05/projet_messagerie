import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { CgExport } from "react-icons/cg";
import { FiMoreVertical, FiTrash2 } from "react-icons/fi";

type ConversationItemProps = {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  isActive?: boolean;
  onClick: () => void;
  onExport?: (conversationId: number) => void;
  onDelete?: (conversationId: number) => void;
  isGroup?: boolean;
  children?: ReactNode;
  theme?: 'light' | 'dark';
};

export const ConversationItem = ({
  id,
  name,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  avatar,
  isActive = false,
  onClick,
  onExport,
  onDelete,
  isGroup = false,
  theme = 'light',
}: ConversationItemProps) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);
  const nameColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const timeColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const messageColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';

  // Fonction pour parser une date depuis différents formats
  const parseDateToDate = (dateString?: string): Date | null => {
    if (!dateString) return null;
    
    try {
      const raw = dateString.trim();
      
      if (raw.toLowerCase().includes('invalid') || raw === '') {
        return null;
      }

      // Format DD/MM/YYYY HH:mm:ss (ex: "13/01/2026 14:19:55")
      if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(raw)) {
        const [datePart, timePart] = raw.split(/\s+/);
        const [day, month, year] = datePart.split('/');
        const iso = `${year}-${month}-${day}T${timePart}`;
        const parsed = new Date(iso);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      // Format DD/MM/YYYY (sans heure)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) {
        const [day, month, year] = raw.split('/');
        const iso = `${year}-${month}-${day}T00:00:00`;
        const parsed = new Date(iso);
        if (!isNaN(parsed.getTime())) {
          return parsed;
        }
      }
      
      // Format ISO ou autre
      const date = new Date(raw);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      return null;
    } catch {
      return null;
    }
  };

  // Fonction pour formater l'heure/date style WhatsApp
  const formatTime = (dateString?: string): string => {
    const date = parseDateToDate(dateString);
    if (!date) return '';
    
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    // Normaliser les dates pour comparer seulement le jour (sans l'heure)
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDateOnly = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const messageDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    // Aujourd'hui → afficher l'heure (HH:MM)
    if (messageDateOnly.getTime() === todayDateOnly.getTime()) {
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
    }
    
    // Hier → afficher "Hier"
    if (messageDateOnly.getTime() === yesterdayDateOnly.getTime()) {
      return 'Hier';
    }
    
    // Autres jours → afficher la date (JJ/MM)
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  const formattedTime = formatTime(lastMessageTime);

  const baseBg = theme === 'dark' ? 'bg-black' : 'bg-white';
  const activeBg = isActive 
    ? (theme === 'dark' 
        ? 'bg-gray-900/50 border-l-2 border-orange-500' 
        : 'bg-orange-50/80 border-l-2 border-orange-400')
    : '';
  const hoverBg = theme === 'dark'
    ? 'hover:bg-gray-900/40'
    : 'hover:bg-gray-50';

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors ${baseBg} ${activeBg} ${hoverBg} border-b ${theme === 'dark' ? 'border-gray-900' : 'border-gray-200'}`}>
      {/* Avatar - Style avec dégradé */}
      <div className="shrink-0">
        {avatar ? (
          <div className="relative w-14 h-14 rounded-full overflow-hidden ring-2 ring-orange-400/30">
            <img
              src={avatar}
              alt={name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 via-transparent to-orange-600/20" />
          </div>
        ) : (
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30`}>
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0 py-1">
        <div className="flex items-start justify-between mb-1">
          <h3 className={`font-semibold ${nameColor} truncate text-base`}>
            {name}
          </h3>
          
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {formattedTime && (
              <span className={`text-xs ${timeColor} mt-0.5`}>
                {formattedTime}
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onExport) {
                  onExport(id);
                }
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer relative group ${
                theme === 'dark'
                  ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
              }`}
              title="Exporter les messages"
              aria-label="Exporter les messages"
            >
              <CgExport className="w-4 h-4" />
              {/* Tooltip au survol */}
              <span className={`absolute right-full mr-2 top-1/2 -translate-y-1/2 px-2 py-1 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 ${
                theme === 'dark'
                  ? 'bg-gray-800 text-white'
                  : 'bg-gray-900 text-white'
              }`}>
                Exporter
              </span>
            </button>
            
            {/* Bouton trois points avec menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  theme === 'dark'
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
                title="Actions"
                aria-label="Actions"
              >
                <FiMoreVertical className="w-4 h-4" />
              </button>

              {/* Menu déroulant */}
              {showMenu && (
                <div className={`absolute right-0 top-full mt-1 rounded-lg border shadow-xl z-50 min-w-[180px] ${
                  theme === 'dark'
                    ? 'bg-gray-900 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="py-1">
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          // Appeler directement onDelete sans confirmation
                          // La vérification et les messages seront gérés dans handleDelete
                          onDelete(id);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 cursor-pointer transition-all flex items-center gap-3 ${
                          theme === 'dark'
                            ? 'hover:bg-gray-800 text-red-400'
                            : 'hover:bg-red-50 text-red-600'
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg ${
                          theme === 'dark' ? 'bg-red-900/30' : 'bg-red-100'
                        }`}>
                          <FiTrash2 className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-sm">Supprimer</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        {lastMessage && (
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm ${messageColor} truncate flex-1`}>
              {lastMessage}
            </p>
            {unreadCount > 0 && (
              <span className={`${theme === 'dark' ? 'bg-green-500' : 'bg-green-500'} text-white text-xs font-semibold rounded-full px-2.5 py-1 shrink-0 min-w-[24px] text-center flex items-center justify-center`}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

