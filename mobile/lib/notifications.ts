import { Linking, Platform } from 'react-native';
import { getExpoNotifications } from './expoNotifications';
import {
  DOSE_REMINDER_CHANNEL_ID,
  ensureNotificationInfrastructure,
} from './notificationSetup';

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getNotificationPermission(): Promise<NotificationPermissionStatus> {
  const Notifications = await getExpoNotifications();
  if (!Notifications) return 'undetermined';
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

export async function requestNotificationPermission(): Promise<boolean> {
  const Notifications = await getExpoNotifications();
  if (!Notifications) return false;

  await ensureNotificationInfrastructure();

  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return true;
  if (existing.status === 'denied') return false;

  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return status === 'granted';
}

export async function canUseNotifications(): Promise<boolean> {
  const Notifications = await getExpoNotifications();
  if (!Notifications) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

export async function notificationsAvailable(): Promise<boolean> {
  const Notifications = await getExpoNotifications();
  return Notifications != null;
}

export function openNotificationSettings(): void {
  void Linking.openSettings();
}

export function notificationPermissionHint(status: NotificationPermissionStatus): string {
  if (status === 'granted') {
    return 'You will get lock-screen alerts at each dose time, even when the app is closed.';
  }
  if (status === 'denied') {
    return 'Notifications are off in iPhone Settings. Tap “Open Settings” to allow alerts.';
  }
  return 'Turn on reminders below — iOS will ask for permission to show alerts.';
}

export function simulatorReminderNote(): string | null {
  return Platform.OS === 'ios' && __DEV__
    ? 'The iOS Simulator often does not show lock-screen alerts. Test on a physical iPhone for real reminders.'
    : null;
}

const TEST_REMINDER_ID = 'drdose-test-reminder';

/** Fire a one-off local notification (dev builds only). Lock the phone after tapping. */
export async function scheduleTestReminder(
  secondsFromNow = 15,
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const Notifications = await getExpoNotifications();
  if (!Notifications) {
    return {
      ok: false,
      reason:
        'Native notifications module is missing. Rebuild with Xcode or `npx expo run:ios` (not Expo Go).',
    };
  }

  const permitted = await requestNotificationPermission();
  if (!permitted) {
    return { ok: false, reason: 'Notification permission was not granted.' };
  }

  await ensureNotificationInfrastructure();
  await Notifications.cancelScheduledNotificationAsync(TEST_REMINDER_ID);

  const seconds = Math.max(5, Math.round(secondsFromNow));
  await Notifications.scheduleNotificationAsync({
    identifier: TEST_REMINDER_ID,
    content: {
      title: 'Dr. Dose test reminder',
      body: 'If you see this on your lock screen, dose reminders are working.',
      sound: 'default',
      ...(Platform.OS === 'android'
        ? { channelId: DOSE_REMINDER_CHANNEL_ID }
        : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });

  return { ok: true };
}
