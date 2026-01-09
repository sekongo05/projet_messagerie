import { useState, useEffect } from 'react';
import type { Theme } from './theme.types';
import {
  getThemeFromStorage,
  saveThemeToStorage,
  applyThemeToDocument,
  getNextTheme,
} from './theme.utils';

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getThemeFromStorage);

  useEffect(() => {
    // Appliquer le thème au document et sauvegarder
    applyThemeToDocument(theme);
    saveThemeToStorage(theme);
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = getNextTheme(theme);
    setTheme(nextTheme);
  };

  const setThemeValue = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  return {
    theme,
    toggleTheme,
    setTheme: setThemeValue,
  };
};

