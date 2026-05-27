import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayLocalDate } from './dates';

export const STREAK_CELEBRATION_MILESTONE_DAYS = 7;

function celebrationKey(userId: string, date: string): string {
  return `mt-streak-celebrated:${userId}:${date}`;
}

export async function wasStreakCelebratedToday(
  userId: string,
  date = todayLocalDate(),
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(celebrationKey(userId, date))) === '1';
  } catch {
    return false;
  }
}

export async function markStreakCelebratedToday(
  userId: string,
  date = todayLocalDate(),
): Promise<void> {
  try {
    await AsyncStorage.setItem(celebrationKey(userId, date), '1');
  } catch {
    // ignore
  }
}
