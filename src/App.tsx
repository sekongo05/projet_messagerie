import { useState } from 'react';
import Login from './Pages/Login';
import Register from './Pages/Register';
import { useTheme, ThemeToggle } from './mode';

const App = () => {
  const [page, setPage] = useState<'login' | 'register'>('login');
  const { theme, toggleTheme } = useTheme();

  const getBackgroundColor = () => {
    return theme === 'light' ? 'bg-gray-50' : 'bg-gray-900';
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${getBackgroundColor()}`}>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />

      {page === 'login' && (
        <Login onNavigateToRegister={() => setPage('register')} theme={theme} />
      )}
      {page === 'register' && (
        <Register onNavigateToLogin={() => setPage('login')} theme={theme} />
      )}
    </div>
  );
};



export default App;