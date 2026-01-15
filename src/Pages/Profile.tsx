import { useState, useEffect } from 'react';
import { useTheme, ThemeToggle } from '../mode';
import { FiUser, FiMail, FiCalendar, FiHash } from 'react-icons/fi';

type User = {
  id?: number;
  nom?: string;
  prenoms?: string;
  email?: string;
  createdAt?: string;
  [key: string]: any; // Pour les autres champs possibles
};

type ProfileProps = {
  onNavigateToChat?: () => void;
};

const Profile = ({ onNavigateToChat }: ProfileProps = {}) => {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  // Charger les informations de l'utilisateur connecté depuis localStorage
  const loadUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Récupérer les données utilisateur sauvegardées lors du login
      const savedUserData = localStorage.getItem('userData');
      const userEmail = localStorage.getItem('userEmail');
      
      if (!savedUserData && !userEmail) {
        setError("Aucun utilisateur connecté. Veuillez vous connecter.");
        setLoading(false);
        return;
      }

      if (savedUserData) {
        // Utiliser les données sauvegardées depuis le login
        const userData = JSON.parse(savedUserData);
        setUser(userData);
      } else if (userEmail) {
        // Fallback : créer un objet minimal avec l'email si les données complètes ne sont pas disponibles
        setUser({
          email: userEmail,
        });
        setError("Données utilisateur incomplètes. Veuillez vous reconnecter.");
      }
    } catch (err: any) {
      console.error('Erreur lors du chargement du profil:', err);
      setError(err.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-gradient-to-br from-gray-50 via-orange-50/30 to-gray-50';
  const cardBg = theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-sm' : 'bg-white/80 backdrop-blur-sm';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const labelColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200/50';
  const infoCardBg = theme === 'dark' ? 'bg-gray-900/50' : 'bg-gray-50';
  const iconBg = theme === 'dark' ? 'bg-orange-500/20' : 'bg-orange-100';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor} transition-colors duration-300`}>
        <div className={`${cardBg} rounded-3xl shadow-2xl p-12 max-w-md w-full border ${borderColor}`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center animate-pulse`}>
              <FiUser className={`w-8 h-8 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
            </div>
            <p className={`text-center ${textSecondary} font-medium`}>Chargement du profil...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor} transition-colors duration-300`}>
        <div className={`${cardBg} rounded-3xl shadow-2xl p-8 max-w-md w-full border ${borderColor}`}>
          <div className={`${theme === 'dark' ? 'bg-red-900/40 border-red-700/50 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border-2 px-4 py-3 rounded-xl text-sm font-medium`}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor} transition-colors duration-300`}>
        <div className={`${cardBg} rounded-3xl shadow-2xl p-12 max-w-md w-full border ${borderColor}`}>
          <div className="flex flex-col items-center gap-4">
            <div className={`w-16 h-16 rounded-full ${iconBg} flex items-center justify-center`}>
              <FiUser className={`w-8 h-8 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
            </div>
            <p className={`text-center ${textSecondary} font-medium`}>Aucune information utilisateur disponible</p>
          </div>
        </div>
      </div>
    );
  }

  // Initiales pour l'avatar
  const getInitials = () => {
    if (user.prenoms && user.nom) {
      return (user.prenoms.charAt(0) + user.nom.charAt(0)).toUpperCase();
    } else if (user.prenoms) {
      return user.prenoms.charAt(0).toUpperCase();
    } else if (user.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Nom complet
  const getFullName = () => {
    if (user.prenoms && user.nom) {
      return `${user.prenoms} ${user.nom}`;
    } else if (user.prenoms) {
      return user.prenoms;
    } else if (user.nom) {
      return user.nom;
    } else if (user.email) {
      return user.email.split('@')[0];
    }
    return 'Utilisateur';
  };

  return (
    <div className={`min-h-screen ${bgColor} py-8 px-4 transition-colors duration-300`}>
      <div className="max-w-3xl mx-auto">
        {/* En-tête avec bouton retour et toggle */}
        <div className="flex items-center justify-between mb-6">
          {onNavigateToChat && (
            <button
              onClick={onNavigateToChat}
              className={`group relative px-5 py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2.5 overflow-hidden ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-gray-800/80 to-gray-700/80 text-gray-200 hover:from-orange-600/20 hover:to-orange-500/20 hover:text-orange-400 border border-gray-700/50 hover:border-orange-500/30'
                  : 'bg-gradient-to-r from-white/90 to-gray-50/90 text-gray-700 hover:from-orange-50 hover:to-orange-100 hover:text-orange-600 border border-gray-200/50 hover:border-orange-300'
              } backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95`}
            >
              {/* Effet de brillance au survol */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              
              {/* Icône avec animation */}
              <svg 
                className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-1 relative z-10" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              
              <span className="relative z-10 tracking-wide">Retour</span>
            </button>
          )}
          <ThemeToggle theme={theme} onToggle={toggleTheme} />
        </div>

        <div className={`${cardBg} rounded-3xl shadow-2xl border ${borderColor} overflow-hidden transition-colors duration-300`}>
          {/* En-tête avec gradient et avatar */}
          <div className={`relative p-4 ${theme === 'dark' ? 'bg-gradient-to-r from-gray-800 via-gray-800 to-gray-700' : 'bg-gradient-to-r from-orange-50 via-orange-100 to-orange-50'} border-b ${borderColor}`}>
            <div className="flex flex-col items-center">
              {/* Avatar avec design moderne */}
              <div className="relative mb-2">
                {/* Glow effect en arrière-plan */}
                <div className={`absolute inset-0 rounded-full ${
                  theme === 'dark' 
                    ? 'bg-gradient-to-r from-orange-500/30 via-orange-600/30 to-orange-500/30' 
                    : 'bg-gradient-to-r from-orange-300/40 via-orange-400/40 to-orange-300/40'
                } blur-2xl scale-110`} />
                
                {/* Avatar principal avec double bordure */}
                <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 flex items-center justify-center text-white font-bold text-2xl ${
                  theme === 'dark' 
                    ? 'ring-4 ring-orange-500/30 ring-offset-4 ring-offset-gray-800' 
                    : 'ring-4 ring-orange-400/30 ring-offset-4 ring-offset-white'
                } shadow-2xl relative overflow-hidden group transition-all duration-300 hover:scale-105`}>
                  {/* Pattern de fond animé */}
                  <div className="absolute inset-0 opacity-20">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.3),transparent_50%)]" />
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.2),transparent_50%)]" />
                  </div>
                  
                  {/* Effet de brillance au survol */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform rotate-45" />
                  
                  {/* Initiales avec ombre portée */}
                  <span className="relative z-10 drop-shadow-2xl font-extrabold tracking-tight">
                    {getInitials()}
                  </span>
                  
                  {/* Bordure intérieure pour effet de profondeur */}
                  <div className={`absolute inset-0.5 rounded-full ${
                    theme === 'dark' ? 'border border-white/5' : 'border border-white/20'
                  }`} />
                </div>
              </div>
              
              <h1 className={`text-xl font-bold ${textPrimary} mb-1`}>{getFullName()}</h1>
              {user.email && (
                <p className={`${textSecondary} text-xs`}>{user.email}</p>
              )}
            </div>
          </div>

          {/* Message d'erreur si données incomplètes */}
          {error && (
            <div className={`m-6 ${theme === 'dark' ? 'bg-yellow-900/40 border-yellow-700/50 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700'} border-2 px-4 py-3 rounded-xl text-sm font-medium`}>
              {error}
            </div>
          )}

          {/* Contenu */}
          <div className="p-4 space-y-3">
            {/* Nom */}
            {user.nom && (
              <div className={`${infoCardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                    <FiUser className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide ${labelColor} mb-2`}>
                      Nom
                    </h3>
                    <p className={`${textPrimary} text-base`}>{user.nom}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Prénom */}
            {user.prenoms && (
              <div className={`${infoCardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                    <FiUser className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide ${labelColor} mb-2`}>
                      Prénom
                    </h3>
                    <p className={`${textPrimary} text-base`}>{user.prenoms}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Email */}
            {user.email && (
              <div className={`${infoCardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                    <FiMail className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide ${labelColor} mb-2`}>
                      Email
                    </h3>
                    <p className={`${textPrimary} text-base break-all`}>{user.email}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ID utilisateur */}
            {user.id && (
              <div className={`${infoCardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                    <FiHash className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide ${labelColor} mb-2`}>
                      ID utilisateur
                    </h3>
                    <p className={`${textSecondary} text-base font-mono`}>#{user.id}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Date de création */}
            {user.createdAt && (
              <div className={`${infoCardBg} rounded-xl p-4 border ${borderColor} transition-all hover:shadow-md`}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${iconBg} shrink-0`}>
                    <FiCalendar className={`w-5 h-5 ${theme === 'dark' ? 'text-orange-400' : 'text-orange-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`text-xs font-semibold uppercase tracking-wide ${labelColor} mb-2`}>
                      Date de création
                    </h3>
                    <p className={`${textSecondary} text-base`}>
                      {(() => {
                        try {
                          const date = new Date(user.createdAt);
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
                        return user.createdAt;
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
  );
};

export default Profile;