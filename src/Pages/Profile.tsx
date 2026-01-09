import { useState, useEffect } from 'react';
import { useTheme, ThemeToggle } from '../mode';

type User = {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  avatar?: string;
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

  // Charger les informations de l'utilisateur connecté
  const loadUserProfile = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Récupérer l'email depuis localStorage (sauvegardé lors de la connexion)
      const userEmail = localStorage.getItem('userEmail');
      
      if (!userEmail) {
        setError("Aucun utilisateur connecté");
        setLoading(false);
        return;
      }

      // TODO: Remplacer par l'appel API réel
      // const response = await Auth.api.getProfile(userEmail);
      // setUser(response.data);

      // Simulation : récupérer les données depuis localStorage ou utiliser des données mock
      const savedUser = localStorage.getItem('currentUser');
      
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      } else {
        // Données de démonstration basées sur l'email
        const mockUser: User = {
          id: 1,
          nom: 'Doe',
          prenom: 'John',
          email: userEmail,
        };
        setUser(mockUser);
        // Sauvegarder pour les prochaines fois
        localStorage.setItem('currentUser', JSON.stringify(mockUser));
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

  if (error) {
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

          {/* Avatar */}
          <div className="flex justify-center mb-6">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={`${user.prenom} ${user.nom}`}
                className="w-24 h-24 rounded-full object-cover border-4 border-orange-400"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-linear-to-br from-orange-100 to-orange-500 flex items-center justify-center text-white font-bold text-3xl border-4 border-orange-400">
                {user.prenom.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="space-y-4">
            {/* Nom complet */}
            <div className={`p-4 rounded-lg border ${borderColor}`}>
              <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                Nom complet
              </label>
              <p className={`${textPrimary} text-lg font-semibold`}>
                {user.prenom} {user.nom}
              </p>
            </div>

            {/* Prénom */}
            <div className={`p-4 rounded-lg border ${borderColor}`}>
              <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                Prénom
              </label>
              <p className={textPrimary}>{user.prenom}</p>
            </div>

            {/* Nom */}
            <div className={`p-4 rounded-lg border ${borderColor}`}>
              <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                Nom
              </label>
              <p className={textPrimary}>{user.nom}</p>
            </div>

            {/* Email */}
            <div className={`p-4 rounded-lg border ${borderColor}`}>
              <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                Email
              </label>
              <p className={textPrimary}>{user.email}</p>
            </div>

            {/* ID utilisateur */}
            <div className={`p-4 rounded-lg border ${borderColor}`}>
              <label className={`block text-sm font-medium ${labelColor} mb-2`}>
                ID utilisateur
              </label>
              <p className={textSecondary}>#{user.id}</p>
            </div>
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

