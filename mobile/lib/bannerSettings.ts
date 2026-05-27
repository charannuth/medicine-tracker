import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayLocalDate } from './dates';

const KEY = 'mt-missed-banner-dismiss';

function keyForDate(forDate: string) {
  return `${KEY}:${forDate}`;
}

export async function isMissedDosesBannerDismissed(
  forDate: string = todayLocalDate(),
): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(keyForDate(forDate))) === '1';
  } catch {
    return false;
  }
}

export async function dismissMissedDosesBanner(
  forDate: string = todayLocalDate(),
): Promise<void> {
  try {
    await AsyncStorage.setItem(keyForDate(forDate), '1');
  } catch {
    // ignore
  }
}

