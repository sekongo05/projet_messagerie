import { useState, useEffect } from 'react';
import { useTheme } from '../mode';
import { getUsers, type User } from '../Api/User.api';
import { createConversation } from '../Api/ConversationCreate.api';
import axios from 'axios';
import { FiLoader, FiX } from 'react-icons/fi';

const API_URL = 'http://localhost:8080';

type CreateGroupeProps = {
  currentUserId: number;
  onClose: () => void;
  onSuccess?: (conversationId: number) => void;
  theme?: 'light' | 'dark';
};

const CreateGroupe = ({ currentUserId, onClose, onSuccess, theme: themeProp }: CreateGroupeProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [titre, setTitre] = useState('');
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState('');

  // Charger la liste des contacts
  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoadingContacts(true);
    try {
      const response: any = await getUsers(currentUserId);
      const usersList: User[] = response?.items || [];
      
      // Filtrer pour exclure l'utilisateur connecté et les utilisateurs supprimés
      const filteredContacts = usersList.filter(
        user => !user.isDeleted && user.id !== currentUserId
      );
      
      setContacts(filteredContacts);
    } catch (err: any) {
      console.error('Erreur lors du chargement des contacts:', err);
      setError('Erreur lors du chargement des contacts');
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleToggleContact = (userId: number) => {
    setSelectedContacts(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Vérifier si tous les contacts sont sélectionnés
  const allSelected = contacts.length > 0 && selectedContacts.length === contacts.length;

  // Fonction pour sélectionner/désélectionner tous les contacts
  const handleToggleAll = () => {
    if (allSelected) {
      // Désélectionner tous
      setSelectedContacts([]);
    } else {
      // Sélectionner tous
      setSelectedContacts(contacts.map(contact => contact.id || 0));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!titre.trim()) {
      setError('Le titre du groupe est obligatoire');
      return;
    }

    if (selectedContacts.length === 0) {
      setError('Veuillez sélectionner au moins un participant');
      return;
    }

    setLoading(true);

    try {
      // 1. Créer le groupe
      const response: any = await createConversation(
        currentUserId,
        "GROUP",
        {
          titre: titre.trim(),
          messageContent: " " // Message par défaut pour satisfaire le backend
        }
      );

      // Extraire l'ID de la conversation créée
      const newConversationId = response?.items?.[0]?.id || 
                               response?.data?.items?.[0]?.id ||
                               response?.id ||
                               response?.conversationId;

      if (!newConversationId) {
        throw new Error('Impossible de récupérer l\'ID de la conversation créée');
      }

      console.log('Groupe créé avec succès:', newConversationId);

      // 2. Ajouter le créateur comme admin
      try {
        await axios.post(`${API_URL}/participantConversation/create`, {
          user: currentUserId,
          datas: [{
            conversationId: newConversationId,
            userId: currentUserId,
            isAdmin: true
          }]
        });
        console.log('Créateur ajouté comme admin');
      } catch (err: any) {
        console.error('Erreur lors de l\'ajout du créateur:', err);
        // Continuer même en cas d'erreur
      }

      // 3. Ajouter les participants sélectionnés (non-admin)
      const participantsToAdd = selectedContacts.map(userId => ({
        conversationId: newConversationId,
        userId: userId,
        isAdmin: false
      }));

      try {
        await axios.post(`${API_URL}/participantConversation/create`, {
          user: currentUserId,
          datas: participantsToAdd
        });
        console.log('Participants ajoutés avec succès');
      } catch (err: any) {
        console.error('Erreur lors de l\'ajout des participants:', err);
        // Afficher un avertissement mais continuer
        setError('Groupe créé mais erreur lors de l\'ajout de certains participants');
      }

      // Succès
      if (onSuccess) {
        onSuccess(newConversationId);
      }
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de la création du groupe:', err);
      setError(err.response?.data?.status?.message || err.message || 'Erreur lors de la création du groupe');
    } finally {
      setLoading(false);
    }
  };

  const borderColor = theme === 'dark' ? 'border-gray-700' : 'border-gray-300';
  const bgColor = theme === 'dark' ? 'bg-gray-800' : 'bg-white';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const inputBg = theme === 'dark' ? 'bg-gray-700' : 'bg-white';
  const inputBorder = theme === 'dark' ? 'border-gray-600' : 'border-gray-300';
  const cardBg = theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div 
        className={`${bgColor} rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col ${borderColor} border`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div className={`p-6 border-b ${borderColor} flex items-center justify-between`}>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Créer un nouveau groupe</h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-gray-400 hover:bg-gray-700 hover:text-white'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            }`}
            aria-label="Fermer"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Contenu */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Champ titre */}
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-2`}>
                Titre du groupe *
              </label>
              <input
                type="text"
                value={titre}
                onChange={(e) => setTitre(e.target.value)}
                placeholder="Nom du groupe"
                className={`w-full px-4 py-3 ${inputBg} ${textPrimary} ${inputBorder} border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all`}
                required
                disabled={loading}
              />
            </div>

            {/* Liste des contacts */}
            <div>
              <label className={`block text-sm font-medium ${textSecondary} mb-3`}>
                Sélectionner les participants ({selectedContacts.length} sélectionné{selectedContacts.length > 1 ? 's' : ''})
              </label>
              
              {loadingContacts ? (
                <div className="flex items-center justify-center py-8">
                  <FiLoader className="animate-spin text-orange-500" />
                  <span className={`ml-2 ${textSecondary}`}>Chargement des contacts...</span>
                </div>
              ) : contacts.length === 0 ? (
                <p className={`text-center py-8 ${textSecondary}`}>Aucun contact disponible</p>
              ) : (
                <div className={`max-h-96 overflow-y-auto space-y-2 ${cardBg} rounded-lg p-4`}>
                  {/* Option "Sélectionner tous" */}
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all mb-2 ${
                      allSelected
                        ? theme === 'dark'
                          ? 'bg-orange-500/20 border-2 border-orange-500'
                          : 'bg-orange-50 border-2 border-orange-400'
                        : theme === 'dark'
                        ? 'bg-gray-600/30 border-2 border-transparent hover:bg-gray-600/50'
                        : 'bg-white border-2 border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={handleToggleAll}
                      className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-2"
                      disabled={loading}
                    />
                    <div className="flex-1">
                      <p className={`font-semibold ${textPrimary}`}>
                        Sélectionner tous ({contacts.length} contact{contacts.length > 1 ? 's' : ''})
                      </p>
                    </div>
                  </label>

                  {contacts.map((contact) => {
                    const isSelected = selectedContacts.includes(contact.id || 0);
                    const fullName = (contact.prenoms && contact.nom)
                      ? `${contact.prenoms} ${contact.nom}`
                      : contact.prenoms || contact.nom || contact.email || 'Contact';
                    const initials = (contact.prenoms?.charAt(0) || '') + (contact.nom?.charAt(0) || '');

                    return (
                      <label
                        key={contact.id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? theme === 'dark'
                              ? 'bg-orange-500/20 border-2 border-orange-500'
                              : 'bg-orange-50 border-2 border-orange-400'
                            : theme === 'dark'
                            ? 'bg-gray-600/30 border-2 border-transparent hover:bg-gray-600/50'
                            : 'bg-white border-2 border-transparent hover:bg-gray-50'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleContact(contact.id || 0)}
                          className="w-5 h-5 rounded border-gray-300 text-orange-500 focus:ring-orange-500 focus:ring-2"
                          disabled={loading}
                        />
                        <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-500 flex items-center justify-center text-white font-semibold text-sm border-2 ${
                          isSelected ? 'border-orange-500' : 'border-orange-300'
                        } shrink-0`}>
                          {initials || fullName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${textPrimary} truncate`}>{fullName}</p>
                          {contact.email && (
                            <p className={`text-xs ${textSecondary} truncate`}>{contact.email}</p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <div className={`p-4 rounded-lg ${
                theme === 'dark' ? 'bg-red-900/30 border-red-700 text-red-300' : 'bg-red-50 border-red-200 text-red-700'
              } border`}>
                {error}
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className={`p-6 border-t ${borderColor} flex items-center justify-end gap-3`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !titre.trim() || selectedContacts.length === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                loading || !titre.trim() || selectedContacts.length === 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <FiLoader className="animate-spin" />
                  Création...
                </span>
              ) : (
                'Créer le groupe'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupe;
