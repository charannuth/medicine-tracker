import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { Appearance } from 'react-native';
import { darkColors, lightColors, type ColorPalette } from '../constants/theme';
import {
  getThemeMode,
  loadTimezone,
  setThemeMode as persistThemeMode,
  type ResolvedTheme,
  type ThemeMode,
} from '../lib/settings';

type ThemeContextValue = {
  themeMode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ColorPalette;
  isDark: boolean;
  ready: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveTheme(mode: ThemeMode, systemScheme: ResolvedTheme | null): ResolvedTheme {
  if (mode === 'light' || mode === 'dark') return mode;
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [systemScheme, setSystemScheme] = useState<ResolvedTheme | null>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void Promise.all([getThemeMode(), loadTimezone()]).then(([mode]) => {
      setThemeModeState(mode);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme === 'dark' ? 'dark' : 'light');
    });
    return () => sub.remove();
  }, []);

  const resolvedTheme = resolveTheme(themeMode, systemScheme);
  const colors = resolvedTheme === 'dark' ? darkColors : lightColors;

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    await persistThemeMode(mode);
    setThemeModeState(mode);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeMode,
      resolvedTheme,
      colors,
      isDark: resolvedTheme === 'dark',
      ready,
      setThemeMode,
    }),
    [themeMode, resolvedTheme, colors, ready, setThemeMode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return ctx;
}
