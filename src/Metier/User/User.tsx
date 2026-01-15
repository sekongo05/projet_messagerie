import { useState, useEffect } from 'react';
import { getUsers, type User } from '../../Api/User.api';
import { FiLoader } from "react-icons/fi";

type UserItemProps = {
  user: User;
  isSelected?: boolean;
  onClick: () => void;
  theme?: 'light' | 'dark';
};

const UserItem = ({ user, isSelected = false, onClick, theme = 'light' }: UserItemProps) => {
  const hoverBg = theme === 'dark' ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50';
  const selectedBg = theme === 'dark' ? 'bg-gray-700/30' : 'bg-gray-100';
  const nameColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const emailColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-600';
  const borderColor = theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200';

  const fullName = user.prenoms && user.nom 
    ? `${user.prenoms} ${user.nom}`.trim()
    : user.prenoms || user.nom || 'Utilisateur';
  const initials = (user.prenoms?.charAt(0) || '') + (user.nom?.charAt(0) || '');

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 cursor-pointer ${hoverBg} transition-colors ${
        isSelected ? selectedBg : ''
      } border-b ${borderColor}`}
    >
      {/* Avatar */}
      <div className="shrink-0">
        <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${
          theme === 'dark' ? 'from-orange-500 to-orange-600' : 'from-orange-400 to-orange-500'
        } flex items-center justify-center text-white font-semibold text-xl`}>
          {initials || fullName.charAt(0).toUpperCase()}
        </div>
      </div>

      {/* Informations utilisateur */}
      <div className="flex-1 min-w-0 py-1">
        <h3 className={`font-medium ${nameColor} truncate text-base`}>
          {fullName}
        </h3>
        {user.email && (
          <p className={`text-sm ${emailColor} truncate`}>
            {user.email}
          </p>
        )}
      </div>
    </div>
  );
};

type UserListProps = {
  users: User[];
  selectedUserId?: number;
  onUserSelect: (userId: number) => void;
  theme?: 'light' | 'dark';
};

export const UserList = ({
  users,
  selectedUserId,
  onUserSelect,
  theme = 'light',
}: UserListProps) => {
  if (users.length === 0) {
    return (
      <div className={`p-8 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <p>Aucun utilisateur disponible</p>
      </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
      {users.map((user) => (
        <UserItem
          key={user.id}
          user={user}
          isSelected={selectedUserId === user.id}
          onClick={() => onUserSelect(user.id)}
          theme={theme}
        />
      ))}
    </div>
  );
};

type UserListContainerProps = {
  onUserSelect?: (userId: number) => void;
  selectedUserId?: number;
  theme?: 'light' | 'dark';
  userId?: number;
};

export const UserListContainer = ({
  onUserSelect,
  selectedUserId,
  theme = 'light',
  userId = 1,
}: UserListContainerProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadUsers();
  }, [userId]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response: any = await getUsers(userId);
      const usersList: User[] = response?.items || [];
      
      // Filtrer les utilisateurs non supprimés
      const activeUsers = usersList.filter(user => !user.isDeleted);
      
      setUsers(activeUsers);
      console.log("Utilisateurs chargés:", activeUsers.length);
    } catch (err: any) {
      console.error('Erreur lors du chargement des utilisateurs:', err);
      setError(err.message || 'Erreur lors du chargement des utilisateurs');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (userId: number) => {
    console.log('=== UserItem cliqué ===', { userId, hasCallback: !!onUserSelect });
    if (onUserSelect) {
      console.log('Appel de onUserSelect avec userId:', userId);
      onUserSelect(userId);
    } else {
      console.warn('onUserSelect n\'est pas défini');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center p-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
        <FiLoader className="animate-spin mr-2" />
        <p>Chargement des utilisateurs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-8 text-center ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
        <p>{error}</p>
        <button
          onClick={loadUsers}
          className={`mt-4 px-4 py-2 rounded-lg ${
            theme === 'dark' 
              ? 'bg-gray-700 text-white hover:bg-gray-600' 
              : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
          }`}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <UserList
      users={users}
      selectedUserId={selectedUserId}
      onUserSelect={handleUserSelect}
      theme={theme}
    />
  );
};
