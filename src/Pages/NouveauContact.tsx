import { useState } from 'react';
import { CreateUser } from '../Api/Usercreate.api';
import { FiX, FiUserPlus } from 'react-icons/fi';

type NouveauContactProps = {
  onClose: () => void;
  onSuccess?: () => void;
  theme?: 'light' | 'dark';
  onError?: (message: string) => void;
  onSuccessToast?: (message: string) => void;
};

const NouveauContact = ({ 
  onClose, 
  onSuccess,
  theme = 'light',
  onError,
  onSuccessToast
}: NouveauContactProps) => {
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nom.trim() || !prenom.trim() || !email.trim()) {
      if (onError) {
        onError('Veuillez remplir tous les champs');
      }
      return;
    }

    // Validation basique de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      if (onError) {
        onError('Veuillez entrer une adresse email valide');
      }
      return;
    }

    setLoading(true);

    try {
      const response = await CreateUser(
        email.trim(),
        nom.trim(),
        prenom.trim()
      );

      if (response.hasError) {
        const errorMessage = response.status?.message || "Une erreur est survenue lors de la création du contact";
        if (onError) {
          onError(errorMessage);
        }
      } else {
        if (onSuccessToast) {
          onSuccessToast(`Contact "${prenom.trim()} ${nom.trim()}" créé avec succès`);
        }
        
        // Réinitialiser le formulaire
        setNom('');
        setPrenom('');
        setEmail('');
        
        // Appeler le callback de succès si fourni
        if (onSuccess) {
          onSuccess();
        }
        
        // Fermer le modal après un court délai
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: any) {
      console.error('Erreur lors de la création du contact:', err);
      let errorMessage = "Une erreur est survenue lors de la création du contact";
      
      if (err.response?.data?.status?.message) {
        errorMessage = err.response.data.status.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const bgColor = theme === 'dark' ? 'bg-black' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-gray-800' : 'border-gray-200';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const inputBg = theme === 'dark' ? 'bg-gray-900' : 'bg-white';
  const inputBorder = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const overlayBg = theme === 'dark' ? 'bg-black/80' : 'bg-black/50';

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 ${overlayBg} z-40 transition-opacity`}
        onClick={onClose}
      />

      {/* Modal */}
      <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none`}>
        <div 
          className={`${bgColor} ${borderColor} border rounded-xl shadow-2xl max-w-md w-full p-6 pointer-events-auto transform transition-all`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* En-tête */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                theme === 'dark' 
                  ? 'bg-orange-500/20 text-orange-400' 
                  : 'bg-orange-100 text-orange-600'
              }`}>
                <FiUserPlus className="w-5 h-5" />
              </div>
              <h2 className={`text-xl font-semibold ${textColor}`}>
                Nouveau contact
              </h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
                  : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              }`}
              aria-label="Fermer"
            >
              <FiX className="w-5 h-5" />
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nom" className={`block text-sm font-medium ${textColor} mb-2`}>
                Nom *
              </label>
              <input
                type="text"
                id="nom"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-4 py-2.5 ${inputBg} ${inputBorder} border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${textColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Nom"
              />
            </div>

            <div>
              <label htmlFor="prenom" className={`block text-sm font-medium ${textColor} mb-2`}>
                Prénom *
              </label>
              <input
                type="text"
                id="prenom"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-4 py-2.5 ${inputBg} ${inputBorder} border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${textColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="Prénom"
              />
            </div>

            <div>
              <label htmlFor="email" className={`block text-sm font-medium ${textColor} mb-2`}>
                Email *
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className={`w-full px-4 py-2.5 ${inputBg} ${inputBorder} border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${textColor} disabled:opacity-50 disabled:cursor-not-allowed`}
                placeholder="email@example.com"
              />
            </div>

            {/* Boutons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  theme === 'dark'
                    ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Création...' : 'Créer le contact'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default NouveauContact;
