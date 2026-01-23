import { useState, useEffect } from 'react';
import { useTheme } from '../mode';
import { getUsers, type User } from '../Api/User.api';
import { getParticipantsByConversationId } from '../Api/getParticipantConversation.api';
import { createParticipant } from '../Api/createParticipantConversation.api';
import { FiLoader, FiX } from 'react-icons/fi';
import { useToast } from '../components/Toast';
import {
  normalizeParticipant,
  getParticipantState,
  canRejoinParticipant
} from '../utils/participantState.utils';
import { logDiagnostic, diagnoseMultipleParticipants } from '../utils/participantStateDiagnostic.utils';
import { validateCreateResponse, logValidation } from '../utils/participantStateValidation.utils';

type AddParticipantsModalProps = {
  conversationId: number;
  conversationTitle: string;
  currentUserId: number;
  onClose: () => void;
  onSuccess?: (participants?: any[]) => void;
  onError?: (message: string) => void;
  onWarning?: (message: string) => void;
  theme?: 'light' | 'dark';
};

const AddParticipantsModal = ({ 
  conversationId, 
  conversationTitle,
  currentUserId,
  onClose, 
  onSuccess,
  onWarning,
  onError,
  theme: themeProp 
}: AddParticipantsModalProps) => {
  const { theme: themeContext } = useTheme();
  const theme = themeProp || themeContext;
  const { error: showErrorToast, warning: showWarningToast } = useToast();
  const [contacts, setContacts] = useState<User[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [error, setError] = useState('');
  const [existingParticipantIds, setExistingParticipantIds] = useState<number[]>([]);
  const [existingParticipants, setExistingParticipants] = useState<Array<{
    userId: number;
    normalized: any;
    state: any;
  }>>([]);

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

      // Extraire les IDs des participants existants avec leurs états
      const existingParticipants = participantsList.map((p: any) => {
        const normalized = normalizeParticipant(p);
        const state = getParticipantState(normalized);
        return {
          userId: p.userId,
          normalized,
          state
        };
      });
      
      // Déterminer les participants qui ne peuvent PAS être ajoutés/réintégrés
      // Ils doivent être exclus de la liste des contacts disponibles :
      // 1. Participants actifs (hasLeft=false) - déjà dans le groupe
      // 2. Participants réintégrés (hasLeft=true, recreatedAt!=null) - ne peuvent pas être réintégrés à nouveau
      // 3. Participants définitivement partis (hasDefinitivelyLeft=true) - ne peuvent plus être réintégrés
      const cannotBeAddedIds = existingParticipants
        .filter(p => {
          const status = p.state.status;
          // Exclure : actifs, réintégrés, et définitivement partis
          return status === 'active' || status === 'rejoined' || status === 'definitively_left';
        })
        .map(p => p.userId)
        .filter((id: any) => id);
      
      setExistingParticipantIds(cannotBeAddedIds);
      setExistingParticipants(existingParticipants);
      
      // Filtrer pour exclure :
      // - L'utilisateur connecté
      // - Les utilisateurs supprimés
      // - Les participants actifs (status === 'active')
      // - Les participants avec hasLeft ou hasDefinitivelyLeft (left_once, rejoined, definitively_left) : ne pas les afficher
      const filteredContacts = usersList.filter(
        user => {
          if (user.isDeleted || user.id === currentUserId) {
            return false;
          }
          
          const existingParticipant = existingParticipants.find(p => p.userId === user.id);
          if (!existingParticipant) return true;
          
          const status = existingParticipant.state.status;
          if (status === 'active') return false;
          if (status === 'left_once' || status === 'rejoined' || status === 'definitively_left') {
            return false;
          }
          
          return true;
        }
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

    // Vérification supplémentaire : s'assurer qu'on n'essaie pas d'ajouter quelqu'un qui ne peut pas l'être
    // Générer des messages d'erreur personnalisés pour chaque utilisateur invalide
    const invalidContacts = selectedContacts
      .map(userId => {
        const participant = existingParticipants.find(p => p.userId === userId);
        if (!participant) return null; // Nouveau participant, OK
        
        const status = participant.state.status;
        if (status === 'active' || status === 'rejoined' || status === 'definitively_left') {
          const contact = contacts.find(c => c.id === userId);
          const contactName = contact 
            ? (contact.prenoms && contact.nom 
                ? `${contact.prenoms} ${contact.nom}` 
                : contact.email || 'Cet utilisateur')
            : 'Cet utilisateur';
          
          let errorMessage = '';
          if (status === 'active') {
            errorMessage = `❌ ${contactName} est déjà membre actif du groupe`;
          } else if (status === 'rejoined') {
            errorMessage = `❌ ${contactName} a déjà été réintégré dans le groupe et ne peut pas être réintégré à nouveau`;
          } else if (status === 'definitively_left') {
            errorMessage = `❌ ${contactName} a quitté définitivement le groupe et ne peut plus être ajouté`;
          }
          
          return { userId, errorMessage, status };
        }
        return null;
      })
      .filter(item => item !== null);
    
    if (invalidContacts.length > 0) {
      // Afficher un message d'erreur personnalisé comme pour la création de conversation avec soi-même
      let errorMessage = '';
      
      if (invalidContacts.length === 1) {
        // Un seul utilisateur invalide - message personnalisé
        const invalidContact = invalidContacts[0];
        const contact = contacts.find(c => c.id === invalidContact.userId);
        const contactName = contact 
          ? (contact.prenoms && contact.nom 
              ? `${contact.prenoms} ${contact.nom}` 
              : contact.email || 'Cet utilisateur')
          : 'Cet utilisateur';
        
        if (invalidContact.status === 'rejoined') {
          errorMessage = `Impossible d'ajouter ${contactName}. Cet utilisateur a déjà été réintégré dans le groupe et ne peut pas être ajouté à nouveau.`;
        } else if (invalidContact.status === 'definitively_left') {
          errorMessage = `Impossible d'ajouter ${contactName}. Cet utilisateur a quitté définitivement le groupe et ne peut plus être ajouté.`;
        } else {
          errorMessage = `Impossible d'ajouter ${contactName}. Vous ne pouvez plus intégrer cet utilisateur dans le groupe.`;
        }
      } else {
        // Plusieurs utilisateurs invalides - message regroupé
        const contactNames = invalidContacts.map(invalid => {
          const contact = contacts.find(c => c.id === invalid.userId);
          return contact 
            ? (contact.prenoms && contact.nom 
                ? `${contact.prenoms} ${contact.nom}` 
                : contact.email || 'Cet utilisateur')
            : 'Cet utilisateur';
        }).join(', ');
        
        errorMessage = `Impossible d'ajouter ${invalidContacts.length} utilisateur(s). Les utilisateurs suivants ne peuvent pas être ajoutés : ${contactNames}. Ces utilisateurs ont déjà été réintégrés ou ont quitté définitivement le groupe.`;
      }
      
      // Afficher le message d'erreur dans le modal (pas d'alert natif)
      // Utiliser onWarning si disponible, sinon afficher dans le modal via setError
      if (onWarning) {
        onWarning(errorMessage);
      } else if (onError) {
        onError(errorMessage);
      } else if (showWarningToast) {
        showWarningToast(errorMessage);
      } else if (showErrorToast) {
        showErrorToast(errorMessage);
      }
      
      // Toujours définir l'erreur dans le state pour l'afficher dans le modal
      setError(errorMessage);
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

      console.log('Tentative d\'ajout de participants:', participantsToAdd);
      
      const response = await createParticipant(participantsToAdd, currentUserId);
      
      console.log('Réponse reçue après ajout de participants dans AddParticipantsModal:', response);
      console.log('Structure complète de la réponse:', JSON.stringify(response, null, 2));
      
      // ✅ Vérifier d'abord les erreurs
      if (response.hasError) {
        const errorCode = response.status?.code;
        const errorMessage = response.status?.message || 'Erreur lors de l\'ajout des participants';
        
        console.error('Erreur fonctionnelle dans la réponse:', {
          hasError: response.hasError,
          code: errorCode,
          status: response.status,
          message: errorMessage,
          fullResponse: response
        });
        
        // Les messages d'erreur du backend sont déjà explicites et complets
        // On les affiche directement à l'utilisateur
        setError(errorMessage);
        setLoading(false);
        return;
      }
      
      // ✅ Vérifier que items existe et n'est pas vide
      if (response.items && response.items.length > 0) {
        console.log('Participants ajoutés/réintégrés:', response.items);
        
        // Diagnostic : vérifier si le backend retourne tous les champs après création/réintégration
        if (typeof window !== 'undefined') {
          const globalDiagnostic = diagnoseMultipleParticipants(response.items, 'create');
          console.log(globalDiagnostic.summary);
          response.items.forEach((participant, index) => {
            logDiagnostic(participant, 'create', `Participant ${index + 1}`);
            
            // Validation : vérifier que la logique métier est respectée
            // Trouver l'état avant (si le participant existait déjà)
            const userId = participant.userId;
            const participantBefore = existingParticipants.find(
              p => p.userId === userId
            )?.normalized || null;
            
            const validation = validateCreateResponse(participantBefore, participant, currentUserId);
            logValidation(validation, `Ajout/Réintégration participant ${index + 1} (userId: ${userId})`);
            
            if (!validation.isValid) {
              console.error(`🚨 PROBLÈME BACKEND: La logique métier n'est pas respectée pour le participant ${index + 1}`);
              if (participantBefore) {
                console.error('Réintégration attendue: hasLeft=true (reste à true), isDeleted=false, recreatedAt et recreatedBy remplis');
              } else {
                console.error('Nouveau participant attendu: hasLeft=false');
              }
            }
          });
        }
        
        // Logger les états de chaque participant
        response.items.forEach((participant, index) => {
          // Log de toute la structure de l'objet participant
          console.log(`=== Structure complète du participant ${index + 1} ===`);
          console.log('Toutes les clés de l\'objet participant:', Object.keys(participant));
          console.log('Participant complet (JSON):', JSON.stringify(participant, null, 2));
          console.log('Participant complet (objet):', participant);
          
          // Chercher toutes les clés contenant "recreate", "left", "by"
          const allKeys = Object.keys(participant);
          const relevantKeys = allKeys.filter(key => 
            key.toLowerCase().includes('recreate') || 
            key.toLowerCase().includes('left') || 
            key.toLowerCase().includes('by') ||
            key.toLowerCase().includes('at')
          );
          console.log('Clés pertinentes trouvées:', relevantKeys);
          
          // Vérifier les variations possibles de noms
          const recreateVariations = {
            'recreatedBy': participant.recreatedBy,
            'recreateBy': participant.recreateBy,
            'recreated_by': participant.recreated_by,
            'recreate_by': participant.recreate_by,
            'createdBy': participant.createdBy,
            'created_by': participant.created_by,
          };
          console.log('Variations possibles de recreatedBy:', recreateVariations);
          
          console.log(`Participant ${index + 1} - Résumé:`, {
            id: participant.id,
            userId: participant.userId,
            conversationId: participant.conversationId,
            hasLeft: participant.hasLeft,
            hasDefinitivelyLeft: participant.hasDefinitivelyLeft,
            hasCleaned: participant.hasCleaned,
            recreatedAt: participant.recreatedAt,
            recreatedBy: participant.recreatedBy,
            leftAt: participant.leftAt,
            leftBy: participant.leftBy,
            definitivelyLeftAt: participant.definitivelyLeftAt,
            definitivelyLeftBy: participant.definitivelyLeftBy,
            isAdmin: participant.isAdmin,
          });
          
          // Vérification spécifique pour recreatedBy
          console.log(`⚠️ Vérification détaillée recreatedBy pour participant ${index + 1}:`, {
            'participant.recreatedBy': participant.recreatedBy,
            'participant.recreateBy': participant.recreateBy,
            'participant.recreated_by': participant.recreated_by,
            'Type': typeof participant.recreatedBy,
            'Est défini': participant.recreatedBy !== undefined,
            'Est null': participant.recreatedBy === null,
            'Valeur': participant.recreatedBy,
            'ID utilisateur qui a fait la requête': currentUserId,
            'recreatedAt présent': !!participant.recreatedAt,
            'recreated_at présent': !!participant.recreated_at,
            'Reintégration détectée': !!participant.recreatedAt || !!participant.recreated_at || participant.hasLeft === false
          });
        });
        
        // ✅ Passer les participants à onSuccess
        if (onSuccess) {
          onSuccess(response.items);
        }
      } else {
        console.warn('Aucun participant retourné dans la réponse', {
          hasItems: !!response.items,
          itemsLength: response.items?.length,
          fullResponse: response
        });
      }
      
      onClose();
    } catch (err: any) {
      console.error('Erreur lors de l\'ajout des participants dans AddParticipantsModal:', err);
      console.error('Détails de l\'erreur:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        fullError: err
      });
      setError(err.message || 'Erreur lors de l\'ajout des participants');
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
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className={`font-medium ${textPrimary} truncate`}>{fullName}</p>
                          </div>
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
