import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useEffect,
  useCallback,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  darkColors,
  lightColors,
  ThemeColors,
  AppearancePreference,
} from '../styles/theme';

const APPEARANCE_KEY = 'AIWISH_APPEARANCE';
const LEGACY_DARK_KEY = 'AIWISH_THEME_DARK';

interface ThemeContextValue {
  colors: ThemeColors;
  isDark: boolean;
  appearance: AppearancePreference;
  setAppearance: (value: AppearancePreference) => void;
  /** @deprecated Use setAppearance */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: lightColors,
  isDark: false,
  appearance: 'system',
  setAppearance: () => {},
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useColorScheme();
  const [appearance, setAppearanceState] = useState<AppearancePreference>('system');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(APPEARANCE_KEY);
      if (
        stored === 'light' ||
        stored === 'dark' ||
        stored === 'system'
      ) {
        setAppearanceState(stored);
      } else {
        const legacy = await AsyncStorage.getItem(LEGACY_DARK_KEY);
        const migrated: AppearancePreference =
          legacy === 'true' ? 'dark' : 'system';
        setAppearanceState(migrated);
        await AsyncStorage.setItem(APPEARANCE_KEY, migrated);
      }
      setHydrated(true);
    })();
  }, []);

  const setAppearance = useCallback((value: AppearancePreference) => {
    setAppearanceState(value);
    AsyncStorage.setItem(APPEARANCE_KEY, value);
  }, []);

  const toggleTheme = useCallback(() => {
    setAppearanceState((prev) => {
      const resolvedDark =
        prev === 'system' ? systemScheme === 'dark' : prev === 'dark';
      const next: AppearancePreference = resolvedDark ? 'light' : 'dark';
      AsyncStorage.setItem(APPEARANCE_KEY, next);
      return next;
    });
  }, [systemScheme]);

  const isDark = useMemo(() => {
    if (appearance === 'dark') return true;
    if (appearance === 'light') return false;
    return systemScheme === 'dark';
  }, [appearance, systemScheme]);

  const value = useMemo(
    () => ({
      colors: isDark ? darkColors : lightColors,
      isDark,
      appearance,
      setAppearance,
      toggleTheme,
    }),
    [isDark, appearance, setAppearance, toggleTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
