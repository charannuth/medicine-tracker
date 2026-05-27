export type StreakBadge = {
  id: string
  minDays: number
  label: string
  description: string
}

export const STREAK_BADGES: StreakBadge[] = [
  {
    id: 'bloom-1',
    minDays: 1,
    label: 'First bloom',
    description: 'Completed your first perfect adherence day',
  },
  {
    id: 'bloom-3',
    minDays: 3,
    label: '3-day roots',
    description: 'Three perfect days in a row',
  },
  {
    id: 'bloom-7',
    minDays: 7,
    label: 'Week in bloom',
    description: 'Seven-day streak',
  },
  {
    id: 'bloom-14',
    minDays: 14,
    label: 'Fortnight',
    description: 'Fourteen-day streak',
  },
  {
    id: 'bloom-30',
    minDays: 30,
    label: 'Garden keeper',
    description: 'Thirty-day streak',
  },
  {
    id: 'bloom-60',
    minDays: 60,
    label: 'Steady growth',
    description: 'Sixty-day streak',
  },
  {
    id: 'bloom-100',
    minDays: 100,
    label: 'Century bloom',
    description: 'One hundred perfect days',
  },
]

export function getEarnedStreakBadges(longestStreak: number): StreakBadge[] {
  return STREAK_BADGES.filter((b) => longestStreak >= b.minDays)
}

export function getNextStreakBadge(longestStreak: number): StreakBadge | null {
  return STREAK_BADGES.find((b) => longestStreak < b.minDays) ?? null
}
