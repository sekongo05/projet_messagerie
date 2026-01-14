import { useState, useEffect } from 'react';
import { useTheme, ThemeToggle } from '../mode';

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

  const bgColor = theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-300' : 'text-gray-600';
  const labelColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-700';
  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-200';

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor}`}>
        <div className={`${cardBg} rounded-2xl shadow-xl p-8 max-w-md w-full`}>
          <p className={`text-center ${textSecondary}`}>Chargement du profil...</p>
        </div>
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor}`}>
        <div className={`${cardBg} rounded-2xl shadow-xl p-8 max-w-md w-full`}>
          <div className={`${theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'} border px-4 py-3 rounded-lg text-sm`}>
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${bgColor}`}>
        <div className={`${cardBg} rounded-2xl shadow-xl p-8 max-w-md w-full`}>
          <p className={`text-center ${textSecondary}`}>Aucune information utilisateur disponible</p>
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
    <div className={`min-h-screen ${bgColor} py-8 px-4`}>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      <div className="max-w-2xl mx-auto">
        <div className={`${cardBg} rounded-2xl shadow-xl p-8 transition-colors duration-300`}>
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-between mb-4">
              {onNavigateToChat && (
                <button
                  onClick={onNavigateToChat}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-700 text-white hover:bg-gray-600'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ← Retour
                </button>
              )}
              <div className="flex-1"></div>
            </div>
            <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>Mon Profil</h1>
            <p className={textSecondary}>Vos coordonnées</p>
          </div>

          {/* Message d'erreur si données incomplètes */}
          {error && (
            <div className={`mb-4 ${theme === 'dark' ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300' : 'bg-yellow-50 border-yellow-200 text-yellow-700'} border px-4 py-3 rounded-lg text-sm`}>
              {error}
            </div>
          )}

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-orange-400">
              {getInitials()}
            </div>
          </div>

          {/* Informations */}
          <div className="space-y-4">
            {/* Nom complet */}
            <div className={`p-4 rounded-lg border ${borderColor}`}>
              <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                Nom complet
              </label>
              <p className={`${textPrimary} text-lg font-semibold`}>
                {getFullName()}
              </p>
            </div>

            {/* Prénom */}
            {user.prenoms && (
              <div className={`p-4 rounded-lg border ${borderColor}`}>
                <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                  Prénom
                </label>
                <p className={textPrimary}>{user.prenoms}</p>
              </div>
            )}

            {/* Nom */}
            {user.nom && (
              <div className={`p-4 rounded-lg border ${borderColor}`}>
                <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                  Nom
                </label>
                <p className={textPrimary}>{user.nom}</p>
              </div>
            )}

            {/* Email */}
            {user.email && (
              <div className={`p-4 rounded-lg border ${borderColor}`}>
                <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                  Email
                </label>
                <p className={textPrimary}>{user.email}</p>
              </div>
            )}

            {/* ID utilisateur */}
            {user.id && (
              <div className={`p-4 rounded-lg border ${borderColor}`}>
                <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                  ID utilisateur
                </label>
                <p className={textSecondary}>#{user.id}</p>
              </div>
            )}

            {/* Date de création */}
            {user.createdAt && (
              <div className={`p-4 rounded-lg border ${borderColor}`}>
                <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                  Date de création
                </label>
                <p className={textSecondary}>{user.createdAt}</p>
              </div>
            )}
          </div>

          {/* Bouton de rafraîchissement */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={loadUserProfile}
              className={`bg-orange-400 hover:bg-orange-500 text-white px-6 py-2 rounded-lg font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2`}
            >
              Actualiser les informations
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;