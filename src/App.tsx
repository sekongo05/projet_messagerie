import { useState } from 'react';
import Login from './Pages/Login';
import Register from './Pages/Register';
import Chat from './Pages/Chat';
import Profile from './Pages/Profile';
import { useTheme, ThemeToggle } from './mode';

const App = () => {
  // Vérifier si l'utilisateur est connecté au chargement
  const getInitialPage = (): 'login' | 'register' | 'chat' | 'profile' => {
    const userEmail = localStorage.getItem('userEmail');
    const userData = localStorage.getItem('userData');
    const currentUser = localStorage.getItem('currentUser');
    
    // Si l'utilisateur est connecté, retourner 'chat'
    if (userEmail || userData || currentUser) {
      return 'chat';
    }
    return 'login';
  };

  const [page, setPage] = useState<'login' | 'register' | 'chat' | 'profile'>(getInitialPage);
  const { theme, toggleTheme } = useTheme();

  const getBackgroundColor = () => {
    return theme === 'light' ? 'bg-gray-50' : 'bg-black';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getBackgroundColor()}`}>
      {page !== 'chat' && page !== 'profile' && <ThemeToggle theme={theme} onToggle={toggleTheme} />}

      {page === 'login' && (
        <Login 
          onNavigateToRegister={() => setPage('register')} 
          onLoginSuccess={() => setPage('chat')}
          theme={theme} 
        />
      )}
      {page === 'register' && (
        <Register onNavigateToLogin={() => setPage('login')} theme={theme} />
      )}
      {page === 'chat' && (
        <Chat onNavigateToProfile={() => setPage('profile')} />
      )}
      {page === 'profile' && (
        <Profile onNavigateToChat={() => setPage('chat')} />
      )}
    </div>
  );
};



export default App;