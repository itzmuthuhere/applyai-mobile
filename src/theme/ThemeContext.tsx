import React, { createContext, useContext, useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import * as SecureStore from 'expo-secure-store';
import { RootState, AppDispatch } from '../store';
import { buildTheme, AppColors, ThemeMode, AccentColor } from './themes';
import { setMode, setAccent } from '../store/slices/themeSlice';

const PREFS_KEY = 'theme_prefs';

interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
  mode: ThemeMode;
  accent: AccentColor;
}

const defaultColors = buildTheme('light', 'blue');
const ThemeContext = createContext<ThemeContextValue>({
  colors: defaultColors,
  isDark: false,
  mode: 'light',
  accent: 'blue',
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((s: RootState) => s.theme.mode);
  const accent = useSelector((s: RootState) => s.theme.accent);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(PREFS_KEY).then(val => {
      if (val) {
        try {
          const { mode: m, accent: a } = JSON.parse(val);
          if (m) dispatch(setMode(m));
          if (a) dispatch(setAccent(a));
        } catch {}
      }
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    SecureStore.setItemAsync(PREFS_KEY, JSON.stringify({ mode, accent }));
  }, [mode, accent, ready]);

  const colors = buildTheme(mode, accent);
  const value: ThemeContextValue = { colors, isDark: mode === 'dark', mode, accent };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): AppColors {
  return useContext(ThemeContext).colors;
}

export function useThemeSettings(): ThemeContextValue {
  return useContext(ThemeContext);
}
