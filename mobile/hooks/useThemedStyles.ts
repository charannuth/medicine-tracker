import { useMemo } from 'react';
import { StyleSheet, type ImageStyle, type TextStyle, type ViewStyle } from 'react-native';
import type { ColorPalette } from '../constants/theme';
import { useTheme } from '../context/ThemeProvider';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * Build a StyleSheet from the active theme palette. Pass a module-level factory, e.g.
 * `useThemedStyles(makeStyles)` where `makeStyles` is defined outside the component.
 */
export function useThemedStyles<T extends NamedStyles<T>>(
  factory: (colors: ColorPalette) => T,
): T {
  const { colors } = useTheme();
  return useMemo(() => StyleSheet.create(factory(colors)), [colors, factory]);
}
