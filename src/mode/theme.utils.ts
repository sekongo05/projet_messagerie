import type { Theme } from './theme.types';

export const getThemeIcon = (theme: Theme): string => {
  switch (theme) {
    case 'light':
      return '☀️';
    case 'dark':
      return '🌙';
    default:
      return '☀️';
  }
};

export const getNextTheme = (currentTheme: Theme): Theme => {
  return currentTheme === 'light' ? 'dark' : 'light';
};

export const getThemeFromStorage = (): Theme => {
  if (typeof window === 'undefined') return 'light';
  const savedTheme = localStorage.getItem('theme') as Theme;
  return savedTheme || 'light';
};

export const saveThemeToStorage = (theme: Theme): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('theme', theme);
};

export const applyThemeToDocument = (theme: Theme): void => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.remove('light', 'dark');
  root.classList.add(theme);
};

