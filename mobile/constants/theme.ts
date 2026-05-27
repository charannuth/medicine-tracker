export const lightColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#0891b2',
  accentDark: '#0e7490',
  brandMaroon: '#be123c',
  brandCrimson: '#e11d48',
  brandDeep: '#9f1239',
  border: '#e2e8f0',
  success: '#059669',
  successBg: '#ecfdf5',
  pending: '#64748b',
  pendingBg: '#f1f5f9',
  partial: '#d97706',
  partialBg: '#fffbeb',
  error: '#dc2626',
  errorBg: '#fef2f2',
  streakPerfectBg: '#ecfdf5',
  streakPerfectBorder: '#86efac',
  streakPartialBg: '#ede9fe',
  streakPartialBorder: '#c4b5fd',
  streakMissedBg: '#fef2f2',
  streakMissedBorder: '#fecaca',
  avatarFallbackBg: '#eef2ff',
  avatarFallbackBorder: '#c7d2fe',
  avatarInitials: '#3730a3',
} as const;

export const darkColors = {
  bg: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  accent: '#22d3ee',
  accentDark: '#0891b2',
  brandMaroon: '#fb7185',
  brandCrimson: '#f43f5e',
  brandDeep: '#e11d48',
  border: '#334155',
  success: '#34d399',
  successBg: '#064e3b',
  pending: '#94a3b8',
  pendingBg: '#1e293b',
  partial: '#fbbf24',
  partialBg: '#422006',
  error: '#f87171',
  errorBg: '#450a0a',
  streakPerfectBg: '#064e3b',
  streakPerfectBorder: '#059669',
  streakPartialBg: '#312e81',
  streakPartialBorder: '#6366f1',
  streakMissedBg: '#450a0a',
  streakMissedBorder: '#dc2626',
  avatarFallbackBg: '#312e81',
  avatarFallbackBorder: '#4f46e5',
  avatarInitials: '#c7d2fe',
} as const;

export type ColorPalette = {
  readonly bg: string;
  readonly surface: string;
  readonly text: string;
  readonly textMuted: string;
  readonly accent: string;
  readonly accentDark: string;
  readonly brandMaroon: string;
  readonly brandCrimson: string;
  readonly brandDeep: string;
  readonly border: string;
  readonly success: string;
  readonly successBg: string;
  readonly pending: string;
  readonly pendingBg: string;
  readonly partial: string;
  readonly partialBg: string;
  readonly error: string;
  readonly errorBg: string;
  readonly streakPerfectBg: string;
  readonly streakPerfectBorder: string;
  readonly streakPartialBg: string;
  readonly streakPartialBorder: string;
  readonly streakMissedBg: string;
  readonly streakMissedBorder: string;
  readonly avatarFallbackBg: string;
  readonly avatarFallbackBorder: string;
  readonly avatarInitials: string;
};

/** @deprecated Prefer `useTheme().colors` for theme-aware UI */
export const colors: ColorPalette = lightColors;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;
