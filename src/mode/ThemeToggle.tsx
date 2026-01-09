import type { Theme } from './theme.types';
import { getThemeIcon } from './theme.utils';

type ThemeToggleProps = {
  theme: Theme;
  onToggle: () => void;
};

export const ThemeToggle = ({ theme, onToggle }: ThemeToggleProps) => {
  const buttonStyles = {
    light: 'bg-white text-gray-800 hover:bg-gray-100',
    dark: 'bg-gray-800 text-white hover:bg-gray-700',
  };

  return (
    <button
      onClick={onToggle}
      className={`fixed top-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all duration-300 ${buttonStyles[theme]}`}
      aria-label="Changer de thème"
    >
      <span className="text-2xl">{getThemeIcon(theme)}</span>
    </button>
  );
};

