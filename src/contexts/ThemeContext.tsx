import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ThemeId = 'light' | 'dark' | 'rose' | 'lavender' | 'ocean' | 'midnight' | 'sunset';

const ALL_THEME_IDS: ThemeId[] = ['light', 'dark', 'rose', 'lavender', 'ocean', 'midnight', 'sunset'];

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  previewColors: string[]; // 3 colors for the preview swatch
  isPremium: boolean;
  unlockType?: 'subscription' | 'referral' | 'achievement';
  unlockRequirement?: string;
}

export const THEMES: ThemeConfig[] = [
  {
    id: 'light',
    name: 'Light',
    description: 'Clean and professional',
    previewColors: ['#ffffff', '#3b82f6', '#f3f4f6'],
    isPremium: false,
  },
  {
    id: 'dark',
    name: 'Dark',
    description: 'Easy on the eyes',
    previewColors: ['#1e293b', '#60a5fa', '#334155'],
    isPremium: false,
  },
  {
    id: 'rose',
    name: 'Rose',
    description: 'Soft & feminine pink',
    previewColors: ['#fff5f5', '#f472b6', '#fce7f3'],
    isPremium: true,
    unlockType: 'subscription',
    unlockRequirement: 'Subscribe to Pro',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    description: 'Dreamy purple vibes',
    previewColors: ['#faf5ff', '#a78bfa', '#ede9fe'],
    isPremium: true,
    unlockType: 'referral',
    unlockRequirement: 'Refer 1 friend',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Deep blue calm',
    previewColors: ['#0c1929', '#22d3ee', '#164e63'],
    isPremium: true,
    unlockType: 'subscription',
    unlockRequirement: 'Subscribe to Pro',
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Electric & bold',
    previewColors: ['#0f0f1a', '#818cf8', '#1e1b4b'],
    isPremium: true,
    unlockType: 'referral',
    unlockRequirement: 'Refer 3 friends',
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm & creative',
    previewColors: ['#fffbf5', '#f97316', '#ffedd5'],
    isPremium: true,
    unlockType: 'achievement',
    unlockRequirement: 'Complete 5 content plans',
  },
];

interface ThemeContextType {
  currentTheme: ThemeId;
  setTheme: (theme: ThemeId) => void;
  unlockedThemes: ThemeId[];
  unlockTheme: (theme: ThemeId) => void;
  isThemeUnlocked: (theme: ThemeId) => boolean;
  getThemeConfig: (theme: ThemeId) => ThemeConfig | undefined;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY_THEME = 'wavebound-theme';
const STORAGE_KEY_UNLOCKED = 'wavebound-unlocked-themes';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>('light');
  const [unlockedThemes, setUnlockedThemes] = useState<ThemeId[]>(['light', 'dark']);

  // Load saved theme and unlocked themes on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem(STORAGE_KEY_THEME) as ThemeId | null;
    const savedUnlocked = localStorage.getItem(STORAGE_KEY_UNLOCKED);

    if (savedUnlocked) {
      try {
        const parsed = JSON.parse(savedUnlocked) as ThemeId[];
        const withDefaults: ThemeId[] = Array.from(new Set([...parsed, 'light', 'dark'])) as ThemeId[];
        setUnlockedThemes(withDefaults);
      } catch {
        // ignore
      }
    }

    if (savedTheme && THEMES.some(t => t.id === savedTheme)) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    THEMES.forEach(t => {
      root.classList.remove(t.id);
    });
    root.removeAttribute('data-theme');
    
    if (currentTheme === 'dark') {
      root.classList.add('dark');
    } else if (currentTheme !== 'light') {
      root.setAttribute('data-theme', currentTheme);
    }
    
    localStorage.setItem(STORAGE_KEY_THEME, currentTheme);
  }, [currentTheme]);

  const setTheme = useCallback((theme: ThemeId) => {
    if (unlockedThemes.includes(theme) || !THEMES.find(t => t.id === theme)?.isPremium) {
      setCurrentTheme(theme);
    }
  }, [unlockedThemes]);

  const unlockTheme = useCallback((theme: ThemeId) => {
    if (!unlockedThemes.includes(theme)) {
      const newUnlocked = [...unlockedThemes, theme];
      setUnlockedThemes(newUnlocked);
      localStorage.setItem(STORAGE_KEY_UNLOCKED, JSON.stringify(newUnlocked));
    }
  }, [unlockedThemes]);

  const isThemeUnlocked = useCallback((theme: ThemeId) => {
    const config = THEMES.find(t => t.id === theme);
    if (!config?.isPremium) return true;
    return unlockedThemes.includes(theme);
  }, [unlockedThemes]);

  const getThemeConfig = useCallback((theme: ThemeId) => THEMES.find(t => t.id === theme), []);

  return (
    <ThemeContext.Provider
      value={{
        currentTheme,
        setTheme,
        unlockedThemes,
        unlockTheme,
        isThemeUnlocked,
        getThemeConfig,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useAppTheme must be used within a ThemeProvider');
  }
  return context;
}
