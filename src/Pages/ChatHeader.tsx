import { useState } from 'react';
import { CgAdd, CgExport, CgProfile, CgLogOut } from "react-icons/cg";

type ChatHeaderProps = {
  theme?: 'light' | 'dark';
  onNavigateToProfile?: () => void;
  onLogout: () => void;
  onAddNewDiscussion: () => void;
  onAddNewGroup: () => void;
};

const ChatHeader = ({
  theme = 'light',
  onNavigateToProfile,
  onLogout,
  onAddNewDiscussion,
  onAddNewGroup,
}: ChatHeaderProps) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  const borderColor = theme === 'dark' ? 'border-gray-900' : 'border-gray-300';

  return (
    <div className={`px-4 py-3 border-b ${borderColor} ${theme === 'dark' ? 'bg-black' : 'bg-white'}`}>
      <div className='flex items-center justify-between mb-3'>
        <h2 className={`text-2xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          Discussions
        </h2>
        <div className="flex items-center gap-2 relative">
          {/* Bouton Add avec menu déroulant */}
          <div className="relative">
            <button 
              onClick={() => setShowAddMenu(!showAddMenu)}
              className={`group relative p-2 rounded-xl transition-all duration-300 ${
                showAddMenu
                  ? theme === 'dark'
                    ? 'bg-gradient-to-br from-orange-500/20 to-orange-600/20 text-orange-400 shadow-lg shadow-orange-500/20'
                    : 'bg-gradient-to-br from-orange-100 to-orange-50 text-orange-600 shadow-lg shadow-orange-200/50'
                  : theme === 'dark' 
                  ? 'text-gray-400 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/20 hover:text-orange-400 hover:shadow-lg hover:shadow-orange-500/20' 
                  : 'text-gray-600 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-50 hover:text-orange-500 hover:shadow-lg hover:shadow-orange-200/50'
              }`}
              title="Nouveau"
            >
              <div className={`absolute inset-0 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10' 
                  : 'bg-gradient-to-br from-orange-200/0 to-orange-100/0 group-hover:from-orange-200/30 group-hover:to-orange-100/30'
              } transition-all duration-300`} />
              <CgAdd className='w-5 h-5 relative z-10 transform group-hover:scale-110 transition-transform duration-300' />
            </button>
            
            {/* Menu déroulant */}
            {showAddMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowAddMenu(false)}
                />
                <div 
                  className={`absolute right-0 mt-2 w-52 rounded-lg shadow-lg z-50 overflow-hidden animate-slide-down ${
                    theme === 'dark' 
                      ? 'bg-gray-900 border border-gray-800' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="py-1">
                    <button
                      onClick={() => {
                        onAddNewDiscussion();
                        setShowAddMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-900 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>Nouvelle discussion</span>
                    </button>
                    <button
                      onClick={() => {
                        onAddNewGroup();
                        setShowAddMenu(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-3 ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-900 hover:text-white'
                          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>Nouveau groupe</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <button 
            className={`group relative p-2 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'text-gray-400 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/20 hover:text-orange-400 hover:shadow-lg hover:shadow-orange-500/20' 
                : 'text-gray-600 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-50 hover:text-orange-500 hover:shadow-lg hover:shadow-orange-200/50'
            }`}
            title="Exporter"
          >
            <div className={`absolute inset-0 rounded-xl ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10' 
                : 'bg-gradient-to-br from-orange-200/0 to-orange-100/0 group-hover:from-orange-200/30 group-hover:to-orange-100/30'
            } transition-all duration-300`} />
            <CgExport className='w-5 h-5 relative z-10 transform group-hover:scale-110 transition-transform duration-300' />
          </button>
          {onNavigateToProfile && (
            <button 
              onClick={onNavigateToProfile} 
              className={`group relative p-2 rounded-xl transition-all duration-300 ${
                theme === 'dark' 
                  ? 'text-gray-400 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/20 hover:text-orange-400 hover:shadow-lg hover:shadow-orange-500/20' 
                  : 'text-gray-600 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-50 hover:text-orange-500 hover:shadow-lg hover:shadow-orange-200/50'
              }`}
              title="Voir mon profil"
            >
              <div className={`absolute inset-0 rounded-xl ${
                theme === 'dark' 
                  ? 'bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10' 
                  : 'bg-gradient-to-br from-orange-200/0 to-orange-100/0 group-hover:from-orange-200/30 group-hover:to-orange-100/30'
              } transition-all duration-300`} />
              <CgProfile className='w-5 h-5 relative z-10 transform group-hover:scale-110 transition-transform duration-300' />
            </button>
          )}
          <button 
            onClick={onLogout} 
            className={`group relative p-2 rounded-xl transition-all duration-300 ${
              theme === 'dark' 
                ? 'text-gray-400 hover:bg-gradient-to-br hover:from-orange-500/20 hover:to-orange-600/20 hover:text-orange-400 hover:shadow-lg hover:shadow-orange-500/20' 
                : 'text-gray-600 hover:bg-gradient-to-br hover:from-orange-100 hover:to-orange-50 hover:text-orange-500 hover:shadow-lg hover:shadow-orange-200/50'
            }`}
            title="Déconnexion"
          >
            <div className={`absolute inset-0 rounded-xl ${
              theme === 'dark' 
                ? 'bg-gradient-to-br from-orange-500/0 to-orange-600/0 group-hover:from-orange-500/10 group-hover:to-orange-600/10' 
                : 'bg-gradient-to-br from-orange-200/0 to-orange-100/0 group-hover:from-orange-200/30 group-hover:to-orange-100/30'
            } transition-all duration-300`} />
            <CgLogOut className='w-5 h-5 relative z-10 transform group-hover:scale-110 transition-transform duration-300' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatHeader;
