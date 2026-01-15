import { useState } from 'react';
import type { Theme } from '../mode';
import { CreateUser } from '../Api/Usercreate.api';

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
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>Inscription</h1>
          <p className={textSecondary}>Créez votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
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
              className={`w-full px-4 py-3 ${inputBg} ${inputText} ${inputBorder} border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400`}
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
              className={`w-full px-4 py-3 ${inputBg} ${inputText} ${inputBorder} border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400`}
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
              className={`w-full px-4 py-3 ${inputBg} ${inputText} ${inputBorder} border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400`}
              placeholder="votre.email@exemple.com"
            />
          </div>

          {error && (
            <div className={`${theme === 'light' ? 'bg-red-50 border-red-200 text-red-700' : theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-950 border-red-800 text-red-400'} border px-4 py-3 rounded-lg text-sm`}>
              {error}
            </div>
          )}

          {success && (
            <div className={`${theme === 'light' ? 'bg-green-50 border-green-200 text-green-700' : theme === 'dark' ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-green-950 border-green-800 text-green-400'} border px-4 py-3 rounded-lg text-sm`}>
              Inscription réussie ! Votre compte a été créé.
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-400 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors">
            S'inscrire
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className={`text-sm ${textSecondary}`}>
            Vous avez déjà un compte ?{' '}
            <a
              href="/login"
              onClick={(e) => {
                e.preventDefault();
                handleLoginClick();
              }}
              className={`${linkColor} font-medium underline focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded`}
            >
              Se connecter
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

