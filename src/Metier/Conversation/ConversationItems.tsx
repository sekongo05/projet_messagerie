import type { ReactNode } from 'react';
import { CiExport } from "react-icons/ci";


type ConversationItemProps = {
  id: number;
  name: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  avatar?: string;
  isActive?: boolean;
  onClick: () => void;
  children?: ReactNode;
  theme?: 'light' | 'dark';
};

export const ConversationItem = ({
  name,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  avatar,
  isActive = false,
  onClick,
  theme = 'light',
}: ConversationItemProps) => {
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100';
  const activeBg = theme === 'dark' 
    ? (isActive ? 'bg-blue-900/20 border-l-4 border-orange-500' : '')
    : (isActive ? 'bg-blue-50 border-l-4 border-orange-500' : '');
  
  const nameColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const timeColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const messageColor = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';

  // Fonction pour formater l'heure depuis une date
  const formatTime = (dateString?: string): string => {
    if (!dateString) return '';
    
    try {
      // Si le format est DD/MM/YYYY (sans heure), on ne peut pas afficher l'heure
      // Dans ce cas, on retourne la date formatée de manière courte
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        // Format DD/MM/YYYY - pas d'heure disponible
        const [day, month] = dateString.split('/');
        return `${day}/${month}`; // Retourner seulement jour/mois
      }
      
      // Si la chaîne contient "invalid" ou est vide après trim, retourner une valeur par défaut
      if (typeof dateString === 'string' && (dateString.toLowerCase().includes('invalid') || dateString.trim() === '')) {
        return '';
      }
      
      // Essayer de parser la date complète
      const date = new Date(dateString);
      
      // Vérifier si la date est valide
      if (isNaN(date.getTime())) {
        // Si ce n'est pas une date valide, vérifier si c'est une date au format ISO
        // ou retourner une chaîne vide pour éviter d'afficher "Invalid Date"
        console.warn('Date invalide:', dateString);
        return '';
      }
      
      // Vérifier si l'heure est 00:00:00 (ce qui signifie qu'on n'avait pas l'heure)
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const seconds = date.getSeconds();
      
      // Si c'est exactement minuit (00:00:00), c'est probablement une date sans heure
      if (hours === 0 && minutes === 0 && seconds === 0) {
        // Vérifier si c'est aujourd'hui ou une date différente
        const today = new Date();
        const isToday = date.toDateString() === today.toDateString();
        
        if (isToday) {
          return "Aujourd'hui";
        } else {
          // Afficher la date formatée (jour/mois)
          return date.toLocaleDateString('fr-FR', { 
            day: '2-digit', 
            month: '2-digit' 
          });
        }
      }
      
      // Formater pour afficher seulement l'heure (HH:MM)
      return date.toLocaleTimeString('fr-FR', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
    } catch (error) {
      // En cas d'erreur, retourner la valeur originale
      return dateString;
    }
  };

  const formattedTime = formatTime(lastMessageTime);

  return (
    <div
      onClick={onClick}
      className={`flex border-b-2 border-gray-400 items-center gap-3 p-4 cursor-pointer ${hoverBg} transition-colors ${activeBg}`}>
      {/* Avatar */}
      <div className="shrink-0" >
        {avatar ? (
          <img
            src={avatar}
            alt={name}
            className="w-12 h-12 rounded-full object-cover"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-100 to-orange-500 flex items-center justify-center text-white font-semibold text-lg">
            {name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      {/* Contenu */}
      <div className="flex-1 min-w-0">
        <div className="flex  items-center justify-between mb-1">
          <h3 className={`font-semibold ${nameColor} truncate`}>
            {name}
          </h3>
          
          {formattedTime && (
            <span className={`text-xs ${timeColor} shrink-0 ml-2`}>
              {formattedTime}
            </span>
          )}
        </div>
        {lastMessage && (
          <div className="flex items-center justify-between">
            <p className={`text-sm ${messageColor} truncate`}>
              {lastMessage}
            </p>
            {unreadCount > 0 && (
              <span className="ml-2 bg-orange-500 text-white text-xs font-semibold rounded-full px-2 py-1 shrink-0 min-w-[20px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </div>
        )}
        
      </div>
      <div className='h-30 w-11 flex justify-center items-center bottom-0' ><p><CiExport className='w-10 h-7'/></p></div>
    </div>
  );
};

