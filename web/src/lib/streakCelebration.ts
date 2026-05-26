import { todayLocalDate } from './dates'

/** Full-screen bloom + butterfly celebration when this streak day is reached. */
export const STREAK_CELEBRATION_MILESTONE_DAYS = 7

function celebrationKey(userId: string, date: string): string {
  return `mt-streak-celebrated:${userId}:${date}`
}

export function wasStreakCelebratedToday(userId: string, date = todayLocalDate()): boolean {
  return localStorage.getItem(celebrationKey(userId, date)) === '1'
}

export function markStreakCelebratedToday(userId: string, date = todayLocalDate()): void {
  localStorage.setItem(celebrationKey(userId, date), '1')
}
