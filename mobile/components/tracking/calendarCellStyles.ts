import type { ViewStyle } from 'react-native';
import { colors } from '../../constants/theme';
import type { TrackingCalendarEventTone } from '../../lib/tracking/calendarTypes';

export function cellStylesFromClassNames(classNames: string[]): ViewStyle[] {
  const out: ViewStyle[] = [];
  if (classNames.includes('is-future')) out.push({ opacity: 0.55 });
  if (classNames.includes('logged-period')) {
    out.push({ backgroundColor: '#fce7f3', borderColor: '#f9a8d4' });
  }
  if (classNames.includes('predicted-period')) {
    out.push({ backgroundColor: '#fdf2f8', borderStyle: 'dashed' });
  }
  if (classNames.includes('phase-menstrual')) {
    out.push({ backgroundColor: 'rgba(253, 164, 175, 0.35)' });
  }
  if (classNames.includes('phase-follicular')) out.push({ backgroundColor: '#ecfdf5' });
  if (classNames.includes('phase-ovulation')) out.push({ backgroundColor: '#fef9c3' });
  if (classNames.includes('phase-luteal')) out.push({ backgroundColor: '#ede9fe' });
  if (classNames.includes('has-symptoms')) out.push({ borderColor: colors.partial });
  if (classNames.includes('weight-logged')) out.push({ backgroundColor: '#e0f2fe' });
  if (classNames.includes('weight-meals')) out.push({ backgroundColor: '#f0fdf4' });
  if (classNames.includes('weight-workout')) out.push({ backgroundColor: '#fff7ed' });
  if (classNames.includes('weight-off-schedule')) out.push({ opacity: 0.45 });
  if (classNames.includes('hrt-logged')) out.push({ backgroundColor: '#fae8ff' });
  if (classNames.includes('med-perfect')) {
    out.push({ backgroundColor: colors.streakPerfectBg, borderColor: colors.streakPerfectBorder });
  }
  if (classNames.includes('med-partial')) {
    out.push({ backgroundColor: colors.streakPartialBg, borderColor: colors.streakPartialBorder });
  }
  if (classNames.includes('med-missed')) {
    out.push({ backgroundColor: colors.streakMissedBg, borderColor: colors.streakMissedBorder });
  }
  return out;
}

export function eventToneStyle(tone: TrackingCalendarEventTone): { bg: string; text: string } {
  switch (tone) {
    case 'cycle-period':
      return { bg: '#fce7f3', text: '#9d174d' };
    case 'cycle-phase':
      return { bg: '#ede9fe', text: '#5b21b6' };
    case 'cycle-symptom':
      return { bg: '#fff7ed', text: '#c2410c' };
    case 'weight':
      return { bg: '#e0f2fe', text: '#0369a1' };
    case 'hrt':
      return { bg: '#fae8ff', text: '#86198f' };
    case 'med-perfect':
      return { bg: colors.streakPerfectBg, text: colors.success };
    case 'med-partial':
      return { bg: colors.streakPartialBg, text: colors.partial };
    case 'med-missed':
      return { bg: colors.streakMissedBg, text: colors.error };
    default:
      return { bg: colors.pendingBg, text: colors.text };
  }
}
