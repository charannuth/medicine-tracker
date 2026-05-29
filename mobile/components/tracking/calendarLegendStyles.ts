import type { TextStyle, ViewStyle } from 'react-native';
import type { ColorPalette } from '../../constants/theme';

function legendTints(isDark: boolean) {
  if (isDark) {
    return {
      period: { bg: 'rgba(244, 63, 94, 0.35)', border: '#fb7185' },
      periodPredicted: { bg: 'rgba(244, 63, 94, 0.18)', border: '#fb7185' },
      follicular: { bg: '#064e3b', border: '#34d399' },
      ovulation: { bg: '#0c4a6e', border: '#38bdf8' },
      luteal: { bg: '#831843', border: '#f472b6' },
      menstrual: { bg: '#881337', border: '#fb7185' },
      weight: { bg: 'rgba(34, 197, 94, 0.45)', border: '#4ade80' },
      weightMeals: { bg: 'rgba(22, 163, 74, 0.35)', border: '#22c55e' },
      hrt: { bg: 'rgba(168, 85, 247, 0.45)', border: '#e879f9' },
      doctorUpcoming: { bg: 'rgba(96, 165, 250, 0.45)', border: '#60a5fa' },
      doctorLogged: { bg: 'rgba(52, 211, 153, 0.4)', border: '#34d399' },
      doctorNeedsNotes: { bg: 'rgba(251, 191, 36, 0.45)', border: '#fbbf24' },
      doctorFollowup: { bg: 'rgba(196, 181, 253, 0.45)', border: '#a78bfa' },
      dot: '#c084fc',
      heart: '#f472b6',
    };
  }
  return {
    period: { bg: 'rgba(225, 29, 72, 0.25)', border: '#e11d48' },
    periodPredicted: { bg: 'rgba(225, 29, 72, 0.12)', border: '#e11d48' },
    follicular: { bg: '#c7d2fe', border: '#6366f1' },
    ovulation: { bg: '#bae6fd', border: '#0ea5e9' },
    luteal: { bg: '#fbcfe8', border: '#ec4899' },
    menstrual: { bg: '#fecdd3', border: '#f43f5e' },
    weight: { bg: 'rgba(34, 197, 94, 0.45)', border: '#16a34a' },
    weightMeals: { bg: 'rgba(22, 163, 74, 0.28)', border: '#22c55e' },
    hrt: { bg: 'rgba(168, 85, 247, 0.4)', border: '#d946ef' },
    doctorUpcoming: { bg: 'rgba(96, 165, 250, 0.35)', border: '#3b82f6' },
    doctorLogged: { bg: 'rgba(34, 197, 94, 0.35)', border: '#22c55e' },
    doctorNeedsNotes: { bg: 'rgba(251, 191, 36, 0.4)', border: '#f59e0b' },
    doctorFollowup: { bg: 'rgba(167, 139, 250, 0.4)', border: '#8b5cf6' },
    dot: '#9333ea',
    heart: '#ec4899',
  };
}

/** Legend + day-cell swatch styles aligned with web tracking calendar. */
export function legendSwatchStyle(
  swatchClass: string,
  colors: ColorPalette,
  isDark: boolean,
): ViewStyle {
  const t = legendTints(isDark);
  const base: ViewStyle = {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  };

  switch (swatchClass) {
    case 'logged-period':
      return { ...base, borderWidth: 2, borderColor: t.period.border, backgroundColor: t.period.bg };
    case 'predicted-period':
      return {
        ...base,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: t.periodPredicted.border,
        backgroundColor: t.periodPredicted.bg,
      };
    case 'phase-follicular':
      return { ...base, backgroundColor: t.follicular.bg, borderColor: t.follicular.border };
    case 'phase-ovulation':
      return { ...base, backgroundColor: t.ovulation.bg, borderColor: t.ovulation.border };
    case 'phase-luteal':
      return { ...base, backgroundColor: t.luteal.bg, borderColor: t.luteal.border };
    case 'phase-menstrual':
      return { ...base, backgroundColor: t.menstrual.bg, borderColor: t.menstrual.border };
    case 'weight-logged':
      return {
        ...base,
        backgroundColor: t.weight.bg,
        borderColor: t.weight.border,
        borderWidth: 2,
      };
    case 'weight-meals':
      return {
        ...base,
        backgroundColor: t.weightMeals.bg,
        borderColor: t.weightMeals.border,
      };
    case 'hrt-logged':
      return { ...base, backgroundColor: t.hrt.bg, borderColor: t.hrt.border, borderWidth: 2 };
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
    case 'doctor-visit-upcoming':
      return {
        ...base,
        backgroundColor: t.doctorUpcoming.bg,
        borderColor: t.doctorUpcoming.border,
        borderWidth: 2,
      };
    case 'doctor-visit-logged':
      return {
        ...base,
        backgroundColor: t.doctorLogged.bg,
        borderColor: t.doctorLogged.border,
        borderWidth: 2,
      };
    case 'doctor-visit-needs-notes':
      return {
        ...base,
        backgroundColor: t.doctorNeedsNotes.bg,
        borderColor: t.doctorNeedsNotes.border,
        borderWidth: 2,
      };
    case 'doctor-visit-followup':
      return {
        ...base,
        backgroundColor: t.doctorFollowup.bg,
        borderColor: t.doctorFollowup.border,
        borderWidth: 2,
      };
    default:
      return base;
  }
}

export function legendDotStyle(isDark: boolean): ViewStyle {
  return {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: legendTints(isDark).dot,
  };
}

export function legendHeartStyle(isDark: boolean): TextStyle {
  return {
    color: legendTints(isDark).heart,
    fontSize: 14,
    lineHeight: 16,
  };
}
