import { useState } from 'react';
import type { Theme } from '../mode';

type LoginProps = {
  onNavigateToRegister?: () => void;
  theme?: Theme;
};

const Login = ({ onNavigateToRegister, theme = 'light' }: LoginProps = {}) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // TODO: Intégrer avec Auth.api.ts
    // Exemple d'utilisation :
    // import { login } from '../Api/Auth.api';
    // try {
    //   const response = await login(email);
    //   // Gérer la connexion réussie
    // } catch (err: any) {
    //   // Si l'API retourne une erreur indiquant que l'email n'existe pas
    //   if (err.response?.status === 404 || err.message?.includes('email') || err.message?.includes('existe pas')) {
    //     setError("Cet email n'existe pas dans notre base de données");
    //   } else {
    //     setError(err.message || 'Une erreur est survenue lors de la connexion');
    //   }
    // }

    // Simulation pour démonstration
    // Supprimez ce code une fois l'API intégrée
    if (email) {
      // Simuler une erreur d'email inexistant
      setTimeout(() => {
        setError("Utilisateur Introuvable");
      }, 500);
    }
  };

  const handleRegisterClick = () => {
    if (onNavigateToRegister) {
      onNavigateToRegister();
    } else {
      // Fallback : navigation par URL (nécessite un système de routing)
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
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>Connexion</h1>
          <p className={textSecondary}>Connectez-vous à votre compte</p>
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
              className={`w-full px-4 py-3 ${inputBg} ${inputText} ${inputBorder} border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all placeholder-gray-400`}
              placeholder="votre.email@exemple.com"
            />
          </div>

          {error && (
            <div className={`${theme === 'light' ? 'bg-red-50 border-red-200 text-red-700' : theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-950 border-red-800 text-red-400'} border px-4 py-3 flex justify-center items-center rounded-lg text-sm`}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-orange-400 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors"
          >
            Se connecter
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

