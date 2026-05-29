import { Platform } from 'react-native';
import { supabase } from './supabase';
import {
  formatScheduleTime,
  normalizeScheduleTimes,
  scheduleTimeToMinutes,
  todayLocalDate,
  currentMinutesSinceMidnight,
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
    throw new Error('Notifications are not available in this build.');
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

const TEST_NEXT_DOSE_ID = 'drdose-test-next-dose';

/** Fire a one-off dose-style alert for the next untaken slot today (simulator-friendly). */
export async function scheduleTestNextDoseReminder(
  userId: string,
  secondsFromNow = 60,
): Promise<{ ok: true; label: string } | { ok: false; reason: string }> {
  const Notifications = await getExpoNotifications();
  if (!Notifications) {
    return { ok: false, reason: 'Notifications module unavailable.' };
  }

  const { enabled } = await getReminders();
  if (!enabled) {
    return { ok: false, reason: 'Turn on dose reminders first.' };
  }

  if (!supabase) {
    return { ok: false, reason: 'Supabase is not configured.' };
  }

  await ensureNotificationInfrastructure();

  const today = todayLocalDate();
  const { data, error } = await supabase.from('medications').select('*').eq('user_id', userId);
  if (error) return { ok: false, reason: error.message };

  const active = filterMedicationsActiveOn((data ?? []) as Medication[], today);
  const nowMins = currentMinutesSinceMidnight();

  type Candidate = { med: Medication; time: string; mins: number };
  const candidates: Candidate[] = [];
  for (const med of active) {
    if (isAsNeededMed(med)) continue;
    for (const time of normalizeScheduleTimes(med.schedule_times ?? [])) {
      const mins = scheduleTimeToMinutes(time);
      if (!Number.isFinite(mins)) continue;
      candidates.push({ med, time, mins });
    }
  }

  candidates.sort((a, b) => a.mins - b.mins);
  const next =
    candidates.find((c) => c.mins >= nowMins) ?? candidates[0];

  if (!next) {
    return { ok: false, reason: 'Add a daily medication with dose times first.' };
  }

  await Notifications.cancelScheduledNotificationAsync(TEST_NEXT_DOSE_ID);

  const seconds = Math.max(10, Math.round(secondsFromNow));
  await Notifications.scheduleNotificationAsync({
    identifier: TEST_NEXT_DOSE_ID,
    content: {
      title: 'Dose due',
      body: `Time for ${next.med.name} (${formatScheduleTime(next.time)})`,
      sound: 'default',
      data: { medicationId: next.med.id, scheduleTime: next.time, screen: 'today' },
      ...(Platform.OS === 'android' ? { channelId: DOSE_REMINDER_CHANNEL_ID } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
      repeats: false,
    },
  });

  return {
    ok: true,
    label: `${next.med.name} at ${formatScheduleTime(next.time)}`,
  };
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
