export const lightColors = {
  bg: '#f8fafc',
  surface: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  accent: '#0891b2',
  accentDark: '#0e7490',
  onAccent: '#ffffff',
  brandMaroon: '#be123c',
  brandCrimson: '#e11d48',
  brandDeep: '#9f1239',
  border: '#e2e8f0',
  success: '#059669',
  successBg: '#ecfdf5',
  successBorder: '#a7f3d0',
  successText: '#047857',
  pending: '#64748b',
  pendingBg: '#f1f5f9',
  partial: '#d97706',
  partialBg: '#fffbeb',
  partialBorder: '#fde68a',
  partialText: '#b45309',
  error: '#dc2626',
  errorBg: '#fef2f2',
  errorBorder: '#fecaca',
  streakPerfectBg: '#ecfdf5',
  streakPerfectBorder: '#86efac',
  streakPartialBg: '#ede9fe',
  streakPartialBorder: '#c4b5fd',
  streakMissedBg: '#fef2f2',
  streakMissedBorder: '#fecaca',
  avatarFallbackBg: '#eef2ff',
  avatarFallbackBorder: '#c7d2fe',
  avatarInitials: '#3730a3',
  typeCardActiveBg: '#ecfeff',
  tabBar: '#ffffff',
  tabBarBorder: '#e2e8f0',
  inputBg: '#ffffff',
  badgeMajorBg: '#fee2e2',
  badgeModerateBg: '#ffedd5',
  badgeMinorBg: '#eff6ff',
} as const;

export const darkColors = {
  bg: '#0f172a',
  surface: '#1e293b',
  text: '#f1f5f9',
  textMuted: '#94a3b8',
  accent: '#22d3ee',
  accentDark: '#0891b2',
  onAccent: '#0f172a',
  brandMaroon: '#fb7185',
  brandCrimson: '#f43f5e',
  brandDeep: '#e11d48',
  border: '#475569',
  success: '#34d399',
  successBg: '#064e3b',
  successBorder: '#059669',
  successText: '#6ee7b7',
  pending: '#94a3b8',
  pendingBg: '#273549',
  partial: '#fbbf24',
  partialBg: '#422006',
  partialBorder: '#b45309',
  partialText: '#fcd34d',
  error: '#f87171',
  errorBg: '#450a0a',
  errorBorder: '#dc2626',
  streakPerfectBg: '#064e3b',
  streakPerfectBorder: '#34d399',
  streakPartialBg: '#312e81',
  streakPartialBorder: '#818cf8',
  streakMissedBg: '#450a0a',
  streakMissedBorder: '#f87171',
  avatarFallbackBg: '#312e81',
  avatarFallbackBorder: '#6366f1',
  avatarInitials: '#e0e7ff',
  typeCardActiveBg: '#164e63',
  tabBar: '#1e293b',
  tabBarBorder: '#334155',
  inputBg: '#0f172a',
  badgeMajorBg: '#7f1d1d',
  badgeModerateBg: '#7c2d12',
  badgeMinorBg: '#1e3a5f',
} as const;

export type ColorPalette = {
  readonly bg: string;
  readonly surface: string;
  readonly text: string;
  readonly textMuted: string;
  readonly accent: string;
  readonly accentDark: string;
  readonly onAccent: string;
  readonly brandMaroon: string;
  readonly brandCrimson: string;
  readonly brandDeep: string;
  readonly border: string;
  readonly success: string;
  readonly successBg: string;
  readonly successBorder: string;
  readonly successText: string;
  readonly pending: string;
  readonly pendingBg: string;
  readonly partial: string;
  readonly partialBg: string;
  readonly partialBorder: string;
  readonly partialText: string;
  readonly error: string;
  readonly errorBg: string;
  readonly errorBorder: string;
  readonly streakPerfectBg: string;
  readonly streakPerfectBorder: string;
  readonly streakPartialBg: string;
  readonly streakPartialBorder: string;
  readonly streakMissedBg: string;
  readonly streakMissedBorder: string;
  readonly avatarFallbackBg: string;
  readonly avatarFallbackBorder: string;
  readonly avatarInitials: string;
  readonly typeCardActiveBg: string;
  readonly tabBar: string;
  readonly tabBarBorder: string;
  readonly inputBg: string;
  readonly badgeMajorBg: string;
  readonly badgeModerateBg: string;
  readonly badgeMinorBg: string;
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
