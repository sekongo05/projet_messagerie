import { useState } from 'react';
import type { Theme } from '../mode';
import { CreateUser } from '../Api/Usercreate.api';
import { FiCheckCircle, FiXCircle, FiUserPlus } from 'react-icons/fi';

type RegisterProps = {
  onNavigateToLogin?: () => void;
  theme?: Theme;
};

const Register = ({ onNavigateToLogin, theme = 'light' }: RegisterProps = {}) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await CreateUser(
        email.trim(),
        nom.trim(),
        prenom.trim()
      );

      if (response.hasError) {
        // Gérer les erreurs de l'API
        const errorMessage = response.status?.message || "Une erreur est survenue lors de l'inscription";
        setError(errorMessage);
      } else {
        // Inscription réussie
        setSuccess(true);
        
        // Sauvegarder les données utilisateur dans localStorage
        if (response.items && response.items.length > 0) {
          const userData = response.items[0];
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
        localStorage.setItem('userEmail', email.trim());
      }
    } catch (err: any) {
      // Gérer les erreurs réseau ou autres erreurs
      let errorMessage = "Une erreur est survenue lors de l'inscription";
      
      if (err.response?.data?.status?.message) {
        // Erreur retournée par l'API
        errorMessage = err.response.data.status.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    }
  };

  const handleLoginClick = () => {
    if (onNavigateToLogin) {
      onNavigateToLogin();
    } else {
      // Fallback : navigation par URL (nécessite un système de routing)
      window.location.href = '/login';
    }
  };

  const bgGradient = theme === 'light' 
    ? 'bg-gradient-to-br from-blue-50 to-indigo-100' 
    : 'bg-black';
  
  const cardBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  const textPrimary = theme === 'light' ? 'text-gray-800' : 'text-white';
  const textSecondary = theme === 'light' ? 'text-gray-600' : 'text-gray-300';
  const labelColor = theme === 'light' ? 'text-gray-700' : 'text-gray-300';
  const inputBg = theme === 'light' ? 'bg-white' : 'bg-gray-900';
  const inputBorder = theme === 'light' ? 'border-gray-300' : 'border-gray-800';
  const inputText = theme === 'light' ? 'text-gray-900' : 'text-white';
  const linkColor = theme === 'light' ? 'text-indigo-600 hover:text-indigo-700' : 'text-indigo-400 hover:text-indigo-300';

  return (
    <div className={`min-h-screen flex items-center justify-center ${bgGradient} px-4`}>
      <div className={`max-w-md w-full ${cardBg} rounded-2xl shadow-xl p-8 transition-colors duration-300`}>
        {/* En-tête esthétique avec icône */}
        <div className={`text-center mb-8 pb-6 border-b ${theme === 'light' ? 'border-gray-200' : 'border-gray-900'}`}>
          {/* Icône de messagerie avec animations */}
          <div className="flex justify-center mb-4">
            <div className={`relative inline-flex items-center justify-center w-24 h-24 rounded-full animate-float animate-glow ${
              theme === 'light' 
                ? 'bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600' 
                : 'bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700'
            }`}>
              {/* Effet de brillance animé */}
              <div className={`absolute inset-0 rounded-full ${
                theme === 'light' 
                  ? 'bg-gradient-to-tr from-white/40 to-transparent' 
                  : 'bg-gradient-to-tr from-white/30 to-transparent'
              } animate-pulse`} style={{ animationDuration: '1.5s' }}></div>
              
              <FiUserPlus className="w-12 h-12 text-white relative z-10" strokeWidth={2} />
            </div>
          </div>
          
          {/* Titre accrocheur */}
          <h1 className={`text-4xl font-bold mb-3 ${
            theme === 'light' 
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent' 
              : 'text-orange-400'
          }`}>
            🎉 Créez votre compte
          </h1>
          
          <p className={`${textSecondary} text-sm`}>
            Rejoignez notre communauté de messagerie
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="nom" className={`block text-sm font-medium ${labelColor} mb-2`}>
              Nom
            </label>
            <input
              type="text"
              id="nom"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className={`w-full px-4 py-3 ${inputBg} ${inputText} ${inputBorder} border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400 hover:border-orange-300 ${theme === 'dark' ? 'hover:border-orange-700' : ''}`}
              placeholder="Votre nom"
            />
          </div>

          <div>
            <label htmlFor="prenom" className={`block text-sm font-medium ${labelColor} mb-2`}>
              Prénom
            </label>
            <input
              type="text"
              id="prenom"
              value={prenom}
              onChange={(e) => setPrenom(e.target.value)}
              required
              className={`w-full px-4 py-3 ${inputBg} ${inputText} ${inputBorder} border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400 hover:border-orange-300 ${theme === 'dark' ? 'hover:border-orange-700' : ''}`}
              placeholder="Votre prénom"
            />
          </div>

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
              className={`w-full px-4 py-3 ${inputBg} ${inputText} ${inputBorder} border rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400 hover:border-orange-300 ${theme === 'dark' ? 'hover:border-orange-700' : ''}`}
              placeholder="votre.email@exemple.com"
            />
          </div>

          {error && (
            <div className={`${theme === 'light' ? 'bg-red-50 border-red-300 text-red-800' : 'bg-red-900/40 border-red-600 text-red-200'} border-2 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium shadow-md animate-slide-down transition-all`}>
              <div className={`flex-shrink-0 ${theme === 'light' ? 'text-red-600' : 'text-red-400'}`}>
                <FiXCircle className="w-5 h-5" />
              </div>
              <p className="flex-1">{error}</p>
            </div>
          )}

          {success && (
            <div className={`${theme === 'light' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-green-900/40 border-green-600 text-green-200'} border-2 px-4 py-3 rounded-xl flex items-center gap-3 text-sm font-medium shadow-md animate-slide-down transition-all`}>
              <div className={`flex-shrink-0 ${theme === 'light' ? 'text-green-600' : 'text-green-400'} animate-pulse`}>
                <FiCheckCircle className="w-5 h-5" />
              </div>
              <p className="flex-1">Inscription réussie ! Votre compte a été créé.</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-400 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
            ✨ S'inscrire
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm ${textSecondary}`}>
            Vous avez déjà un compte ?{' '}
            <button
              onClick={handleLoginClick}
              className={`${linkColor} cursor-pointer font-medium underline focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 rounded hover:opacity-80 transition-opacity`}
            >
              Se connecter
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

