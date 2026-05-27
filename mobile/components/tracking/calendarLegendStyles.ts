import type { ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';

/** Legend + day-cell swatch styles aligned with web App.css cycle/tracking calendar. */
export function legendSwatchStyle(swatchClass: string): ViewStyle {
  const base: ViewStyle = {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  };

  switch (swatchClass) {
    case 'logged-period':
      return {
        ...base,
        borderWidth: 2,
        borderColor: '#e11d48',
        backgroundColor: 'rgba(225, 29, 72, 0.25)',
      };
    case 'predicted-period':
      return {
        ...base,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#e11d48',
        backgroundColor: 'rgba(225, 29, 72, 0.12)',
      };
    case 'phase-follicular':
      return {
        ...base,
        backgroundColor: '#c7d2fe',
        borderColor: '#6366f1',
      };
    case 'phase-ovulation':
      return {
        ...base,
        backgroundColor: '#bae6fd',
        borderColor: '#0ea5e9',
      };
    case 'phase-luteal':
      return {
        ...base,
        backgroundColor: '#fbcfe8',
        borderColor: '#ec4899',
      };
    case 'phase-menstrual':
      return {
        ...base,
        backgroundColor: '#fecdd3',
        borderColor: '#f43f5e',
      };
    case 'weight-logged':
      return {
        ...base,
        backgroundColor: 'rgba(34, 197, 94, 0.45)',
        borderColor: '#16a34a',
        borderWidth: 2,
      };
    case 'weight-meals':
      return {
        ...base,
        backgroundColor: 'rgba(22, 163, 74, 0.28)',
        borderColor: '#22c55e',
      };
    case 'hrt-logged':
      return {
        ...base,
        backgroundColor: 'rgba(168, 85, 247, 0.4)',
        borderColor: '#d946ef',
        borderWidth: 2,
      };
    case 'med-perfect':
      return {
        ...base,
        backgroundColor: colors.streakPerfectBg,
        borderColor: colors.streakPerfectBorder,
        borderWidth: 2,
      };
    case 'med-partial':
      return {
        ...base,
        backgroundColor: colors.streakPartialBg,
        borderColor: colors.streakPartialBorder,
        borderWidth: 2,
      };
    case 'med-missed':
      return {
        ...base,
        backgroundColor: colors.streakMissedBg,
        borderColor: colors.streakMissedBorder,
        borderWidth: 2,
      };
    default:
      return base;
  }
}

export const legendDotStyle: ViewStyle = {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#9333ea',
};

export const legendHeartStyle = {
  color: '#ec4899',
  fontSize: 14,
  lineHeight: 16,
} as const;
