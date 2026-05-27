import { Platform } from 'react-native';
import { supabase } from './supabase';
import {
  formatScheduleTime,
  normalizeScheduleTimes,
  scheduleTimeToMinutes,
  todayLocalDate,
} from './dates';
import { filterMedicationsActiveOn } from './medicationDates';
import { isAsNeededMed } from './medicationSchedule';
import { getExpoNotifications } from './expoNotifications';
import { DOSE_REMINDER_CHANNEL_ID, ensureNotificationInfrastructure } from './notificationSetup';
import { getReminders } from './settings';
import type { Medication } from './types';

const REMINDER_PREFIX = 'dose-reminder';

/** iOS allows at most 64 pending local notifications per app. */
const IOS_SCHEDULE_LIMIT = 64;

type NotificationsModule = NonNullable<Awaited<ReturnType<typeof getExpoNotifications>>>;

type SlotToSchedule = {
  med: Medication;
  time: string;
  hour: number;
  minute: number;
};

function buildDailyTrigger(Notifications: NotificationsModule, hour: number, minute: number) {
  // Calendar + repeats is the reliable iOS pattern for “every day at this time”.
  if (Platform.OS === 'ios') {
    return {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour,
      minute,
      repeats: true,
    } as const;
  }

  return {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour,
    minute,
    channelId: DOSE_REMINDER_CHANNEL_ID,
  } as const;
}

export async function cancelAllDoseReminders(): Promise<void> {
  const Notifications = await getExpoNotifications();
  if (!Notifications) return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter((n) => n.identifier.startsWith(REMINDER_PREFIX))
      .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
  );
}

function collectSlots(medications: Medication[]): SlotToSchedule[] {
  const slots: SlotToSchedule[] = [];
  for (const med of medications) {
    if (isAsNeededMed(med)) continue;
    for (const time of normalizeScheduleTimes(med.schedule_times ?? [])) {
      const mins = scheduleTimeToMinutes(time);
      if (!Number.isFinite(mins)) continue;
      slots.push({
        med,
        time,
        hour: Math.floor(mins / 60),
        minute: mins % 60,
      });
    }
  }
  return slots;
}

export type ReminderScheduleSummary = {
  scheduled: number;
  skippedOverLimit: number;
};

/**
 * Schedules repeating local notifications for each active scheduled dose time.
 * Works when the app is backgrounded or the phone is locked (no server push required).
 */
export async function rescheduleDoseReminders(
  userId: string,
): Promise<ReminderScheduleSummary> {
  const Notifications = await getExpoNotifications();
  if (!Notifications) {
    throw new Error(
      'Notifications are not available. Rebuild the app with npx expo run:ios after installing expo-notifications.',
    );
  }

  const { enabled } = await getReminders();
  await cancelAllDoseReminders();

  if (!enabled) {
    return { scheduled: 0, skippedOverLimit: 0 };
  }

  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  await ensureNotificationInfrastructure();

  const today = todayLocalDate();
  const { data, error } = await supabase
    .from('medications')
    .select('*')
    .eq('user_id', userId);
  if (error) throw error;

  const active = filterMedicationsActiveOn((data ?? []) as Medication[], today);
  const slots = collectSlots(active);

  let toSchedule = slots;
  let skippedOverLimit = 0;
  if (Platform.OS === 'ios' && slots.length > IOS_SCHEDULE_LIMIT) {
    skippedOverLimit = slots.length - IOS_SCHEDULE_LIMIT;
    toSchedule = slots.slice(0, IOS_SCHEDULE_LIMIT);
  }

  for (const { med, time, hour, minute } of toSchedule) {
    const id = `${REMINDER_PREFIX}:${med.id}:${time}`;
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: 'Dose due',
        body: `Time for ${med.name} (${formatScheduleTime(time)})`,
        sound: 'default',
        priority: Notifications.AndroidNotificationPriority.HIGH,
        data: { medicationId: med.id, scheduleTime: time, screen: 'today' },
        ...(Platform.OS === 'android'
          ? { channelId: DOSE_REMINDER_CHANNEL_ID }
          : {}),
      },
      trigger: buildDailyTrigger(Notifications, hour, minute),
    });
  }

  return { scheduled: toSchedule.length, skippedOverLimit };
}

/** For debugging in Account — next fire time for a sample identifier. */
export async function getNextReminderFireDate(
  hour: number,
  minute: number,
): Promise<Date | null> {
  const Notifications = await getExpoNotifications();
  if (!Notifications) return null;
  await ensureNotificationInfrastructure();
  const next = await Notifications.getNextTriggerDateAsync(
    buildDailyTrigger(Notifications, hour, minute),
  );
  return next ? new Date(next) : null;
}
