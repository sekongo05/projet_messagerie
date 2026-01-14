import { UserListContainer } from '../Metier/User/User';
import { useTheme } from '../mode';

type UserPageProps = {
  onUserSelect?: (userId: number) => void;
  selectedUserId?: number;
};

const UserPage = ({ 
  onUserSelect, 
  selectedUserId 
}: UserPageProps = {}) => {
  const { theme } = useTheme();

  return (
    <UserListContainer
      onUserSelect={onUserSelect}
      selectedUserId={selectedUserId}
      theme={theme}
    />
  );
};

export default UserPage;
