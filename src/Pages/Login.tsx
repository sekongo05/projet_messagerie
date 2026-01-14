import { useState } from 'react';
import type { Theme } from '../mode';
import { login } from '../Api/Auth.api';

type LoginProps = {
  onNavigateToRegister?: () => void;
  onLoginSuccess?: () => void;
  theme?: Theme;
};

const Login = ({ onNavigateToRegister, onLoginSuccess, theme = 'light' }: LoginProps = {}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await login(email);
      
      if (response.hasError) {
        // Gérer les erreurs de l'API
        const errorMessage = response.status?.message || 'Une erreur est survenue lors de la connexion';
        setError(errorMessage);
      } else {
        // Connexion réussie
        setSuccess('Connexion réussie !!');
        
        // Sauvegarder les données de l'utilisateur
        if (response.items && response.items.length > 0) {
          const userData = response.items[0];
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userData', JSON.stringify(userData));
        }
        
        // Naviguer vers Chat après 1 seconde
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          }
        }, 1000);
      }
    } catch (err: any) {
      // Gérer les erreurs réseau ou autres erreurs
      let errorMessage = 'Une erreur est survenue lors de la connexion';
      
      if (err.response?.data?.status?.message) {
        // Erreur retournée par l'API
        errorMessage = err.response.data.status.message;
      } else if (err.response?.status === 404) {
        errorMessage = "Utilisateur Introuvable";
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterClick = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else {
      window.location.href = '/register';
    }
  };

  const bgGradient = theme === 'light' 
    ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
    : 'bg-gradient-to-br from-gray-800 to-gray-900';
  
  const cardBg = theme === 'light' ? 'bg-white' : 'bg-gray-800';
  const textPrimary = theme === 'light' ? 'text-gray-800' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const labelColor = theme === 'light' ? 'text-gray-700' : 'text-gray-300';
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-gray-700';
  const inputBorder = theme === 'light' ? 'border-gray-300' : 'border-gray-600';
  const inputText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const linkColor = theme === 'light' ? 'text-indigo-600 hover:text-indigo-700' : 'text-indigo-400 hover:text-indigo-300';

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgGradient} px-4`}>
      <div className={`max-w-md w-full ${cardBg} rounded-2xl shadow-xl p-8 transition-colors duration-300`}>
        {/* Message de bienvenue esthétique */}
        <div className={`text-center mb-8 pb-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-700'}`}>
          {/* Icône de chat avec animation */}
          <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 shadow-lg ${
            theme === 'light' 
              ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600' 
              : 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700'
          }`}>
            <svg 
              className="w-10 h-10 text-white animate-pulse" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" 
              />
            </svg>
          </div>
          
          {/* Titre de bienvenue */}
          <h1 className={`text-4xl font-bold mb-3 ${
            theme === 'light' 
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent' 
              : 'text-orange-400'
          }`}>
            Bienvenue !
          </h1>
          
          {/* Sous-titre */}
          <p className={`${textSecondary} text-lg font-medium mb-2`}>
            Rejoignez vos conversations
          </p>
          <p className={`${textSecondary} text-sm`}>
            Connectez-vous pour accéder à votre messagerie
          </p>
        </div>

        {/* Section connexion */}
        <div className="text-center mb-6">
          <h2 className={`text-xl font-semibold ${textPrimary} mb-1`}>Connexion</h2>
          <p className={`${textSecondary} text-sm`}>Entrez votre email pour continuer</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className={`block text-sm font-medium ${labelColor} mb-2`}>
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className={`w-full px-4 py-3 ${inputBg} ${inputText} ${inputBorder} border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              placeholder="votre.email@gmail.com"
            />
          </div>

          {error && (
            <div className={`${theme === 'light' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-red-900/30 border-red-700 text-red-300'} border px-4 py-3 flex justify-center items-center rounded-lg text-sm`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`${theme === 'light' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-green-900/30 border-green-700 text-green-300'} border px-4 py-3 flex justify-center items-center rounded-lg text-sm`}>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full ${isLoading ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange-400 hover:bg-orange-700'} text-white py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors`}
          >
            {isLoading ? 'Connexion en cours...' : 'Se connecter'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm ${textSecondary}`}>
            Vous n'avez pas de compte ?{' '}
            <button
              onClick={handleRegisterClick}
              className={`${linkColor} cursor-pointer font-medium underline focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded`}
            >
              S'inscrire
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;