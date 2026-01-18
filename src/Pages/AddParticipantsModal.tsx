import { useState, useEffect } from 'react';
import { useTheme } from '../mode';
import { getUsers, type User } from '../Api/User.api';
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import { FiLoader, FiX } from 'react-icons/fi';
import axios from 'axios';

const API_URL = 'http://localhost:8080';

type AddParticipantsModalProps = {
  conversationId: number;
  conversationTitle: string;
  currentUserId: number;
  onClose: () => void;
  onSuccess?: () => void;
  theme?: 'light' | 'dark';
};

const AddParticipantsModal = ({ 
  conversationId, 
  conversationTitle,
  currentUserId,
  onClose, 
  onSuccess,
  theme: themeProp 
}: AddParticipantsModalProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState('');
  const [existingParticipantIds, setExistingParticipantIds] = useState<number[]>([]);

  // Charger la liste des contacts et les participants existants
  useEffect(() => {
    loadContactsAndExistingParticipants();
  }, []);

  const loadContactsAndExistingParticipants = async () => {
    setLoadingContacts(true);
    try {
      // 1. Charger tous les utilisateurs
      const response: any = await getUsers(currentUserId);
      let usersList: User[] = [];
      
      if (Array.isArray(response)) {
        usersList = response;
      } else if (response?.items) {
        usersList = response.items;
      } else if (response?.data?.items) {
        usersList = response.data.items;
      } else if (response?.data && Array.isArray(response.data)) {
        usersList = response.data;
      }

      // 2. Charger les participants existants du groupe
      const participantsResponse: any = await getParticipantsByConversationId(conversationId);
      let participantsList: any[] = [];
      
      if (Array.isArray(participantsResponse)) {
        participantsList = participantsResponse;
      } else if (participantsResponse?.items) {
        participantsList = participantsResponse.items;
      } else if (participantsResponse?.data?.items) {
        participantsList = participantsResponse.data.items;
      } else if (participantsResponse?.data && Array.isArray(participantsResponse.data)) {
        participantsList = participantsResponse.data;
      }

      // Extraire les IDs des participants existants
      const existingIds = participantsList.map((p: any) => p.userId).filter((id: any) => id);
      setExistingParticipantIds(existingIds);
      
      // Filtrer pour exclure l'utilisateur connecté, les utilisateurs supprimés et les participants existants
      const filteredContacts = usersList.filter(
        user => !user.isDeleted && 
                user.id !== currentUserId && 
                !existingIds.includes(user.id || 0)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (selectedContacts.length === 0) {
      setError('Veuillez sélectionner au moins un participant');
      return;
    }

    setLoading(true);

    try {
      // Ajouter les participants sélectionnés (non-admin)
      const participantsToAdd = selectedContacts.map(userId => ({
        conversationId: conversationId,
        userId: userId,
        isAdmin: false
      }));

      await axios.post(`${API_URL}/participantConversation/create`, {
        user: currentUserId,
        datas: participantsToAdd
      });
      
      console.log('Participants ajoutés avec succès');
      
      // Succès
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout des participants:', err);
      setError(err.response?.data?.status?.message || err.message || 'Erreur lors de l\'ajout des participants');
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
          <div>
            <h2 className={`text-2xl font-bold ${textPrimary}`}>Ajouter des participants</h2>
            <p className={`text-sm ${textSecondary} mt-1`}>Groupe: {conversationTitle}</p>
          </div>
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
                <p className={`text-center py-8 ${textSecondary}`}>
                  {existingParticipantIds.length > 0 
                    ? 'Tous les contacts sont déjà participants du groupe' 
                    : 'Aucun contact disponible'}
                </p>
              ) : (
                <div className={`max-h-96 overflow-y-auto space-y-2 ${cardBg} rounded-lg p-4`}>
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
              disabled={loading || selectedContacts.length === 0}
              className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                loading || selectedContacts.length === 0
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <FiLoader className="animate-spin" />
                  Ajout...
                </span>
              ) : (
                `Ajouter ${selectedContacts.length} participant${selectedContacts.length > 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddParticipantsModal;
