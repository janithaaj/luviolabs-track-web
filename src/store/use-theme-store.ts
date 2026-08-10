'use client';

import { create } from 'zustand';

export type Theme = 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light', // Light mode default as requested

  setTheme: (newTheme: Theme) => {
    set({ theme: newTheme });
    if (typeof window !== 'undefined') {
      localStorage.setItem('luvio_theme', newTheme);
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  },

  toggleTheme: () => {
    const currentTheme = get().theme;
    const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
    get().setTheme(nextTheme);
  },

  initTheme: () => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('luvio_theme') as Theme | null;
      if (saved === 'dark') {
        set({ theme: 'dark' });
        document.documentElement.classList.add('dark');
      } else {
        // Default to light mode
        set({ theme: 'light' });
        document.documentElement.classList.remove('dark');
      }
    }
  }
}));
