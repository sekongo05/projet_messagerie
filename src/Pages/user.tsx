import { UserListContainer } from '../Metier/User/User';
import { useTheme } from '../mode';

type UserPageProps = {
  onUserSelect?: (userId: number) => void;
  selectedUserId?: number;
  refreshTrigger?: number;
};

const UserPage = ({ 
  onUserSelect, 
  selectedUserId,
  refreshTrigger
}: UserPageProps = {}) => {
  const { theme } = useTheme();

  return (
    <UserListContainer
      onUserSelect={onUserSelect}
      selectedUserId={selectedUserId}
      theme={theme}
      refreshTrigger={refreshTrigger}
    />
  );
};

export default UserPage;
