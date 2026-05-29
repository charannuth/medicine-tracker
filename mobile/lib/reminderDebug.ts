import { fetchMedicationsWithStatus } from './medications';
import {
  currentMinutesSinceMidnight,
  formatScheduleTime,
  formatTimeInTimezone,
  scheduleTimeToMinutes,
  todayLocalDate,
} from './dates';
import { getExpoNotifications } from './expoNotifications';
import { getReminders, getTimezone } from './settings';

export type ReminderSlotDebug = {
  medicationName: string;
  scheduleTime: string;
  scheduleLabel: string;
  taken: boolean;
  pastDue: boolean;
  scheduledNotification: boolean;
  skipReason?: string;
};

export type ReminderCheckResult = {
  ranAt: string;
  today: string;
  timezone: string;
  nowLabel: string;
  nowMinutes: number;
  enabled: boolean;
  permissionGranted: boolean;
  pendingNotificationCount: number;
  doseNotificationCount: number;
  visitNotificationCount: number;
  refillNotificationCount: number;
  slots: ReminderSlotDebug[];
  summary: string;
};

let lastReminderCheck: ReminderCheckResult | null = null;

export function getLastReminderCheck(): ReminderCheckResult | null {
  return lastReminderCheck;
}

export async function runReminderCheck(userId: string): Promise<ReminderCheckResult> {
  const { enabled } = await getReminders();
  const Notifications = await getExpoNotifications();
  const permissionGranted = Notifications
    ? (await Notifications.getPermissionsAsync()).status === 'granted'
    : false;

  const today = todayLocalDate();
  const timezone = getTimezone();
  const nowMins = currentMinutesSinceMidnight();
  const nowLabel = formatTimeInTimezone();

  const scheduledIds = new Set<string>();
  let doseNotificationCount = 0;
  let visitNotificationCount = 0;
  let refillNotificationCount = 0;
  if (Notifications) {
    const pending = await Notifications.getAllScheduledNotificationsAsync();
    for (const n of pending) {
      if (n.identifier.startsWith('dose-reminder:')) {
        scheduledIds.add(n.identifier);
        doseNotificationCount += 1;
      } else if (
        n.identifier.startsWith('doctor-visit-reminder:') ||
        n.identifier.startsWith('doctor-followup-reminder:')
      ) {
        visitNotificationCount += 1;
      } else if (n.identifier.startsWith('refill-reminder:')) {
        refillNotificationCount += 1;
      }
    }
  }

  const slots: ReminderSlotDebug[] = [];

  if (enabled) {
    const medications = await fetchMedicationsWithStatus(userId);

    for (const med of medications) {
      for (const slot of med.slots) {
        const slotMins = scheduleTimeToMinutes(slot.time);
        const pastDue = Number.isFinite(slotMins) && slotMins <= nowMins;
        const notifId = `dose-reminder:${med.id}:${slot.time}`;
        const scheduledNotification = scheduledIds.has(notifId);

        let skipReason: string | undefined;
        if (slot.taken) skipReason = 'Already marked taken';
        else if (!Number.isFinite(slotMins)) skipReason = 'Invalid schedule time';
        else if (!pastDue) skipReason = 'Not due yet (later today)';
        else if (!scheduledNotification) skipReason = 'No pending local notification';

        slots.push({
          medicationName: med.name,
          scheduleTime: slot.time,
          scheduleLabel: formatScheduleTime(slot.time),
          taken: slot.taken,
          pastDue,
          scheduledNotification,
          skipReason,
        });
      }
    }
  }

  let summary: string;
  if (!enabled) {
    summary = 'Reminders are off in settings.';
  } else if (!permissionGranted) {
    summary = 'Notification permission is not granted.';
  } else if (!Notifications) {
    summary = 'Notifications module unavailable in this build.';
  } else if (slots.length === 0 && visitNotificationCount === 0 && refillNotificationCount === 0) {
    summary = 'No dose, visit, or refill reminders scheduled.';
  } else {
    const pending = slots.filter((s) => s.scheduledNotification && !s.taken).length;
    const pastDueUntaken = slots.filter((s) => s.pastDue && !s.taken).length;
    const visitPart =
      visitNotificationCount > 0
        ? ` · ${visitNotificationCount} visit reminder${visitNotificationCount === 1 ? '' : 's'}`
        : '';
    const refillPart =
      refillNotificationCount > 0
        ? ` · ${refillNotificationCount} refill reminder${refillNotificationCount === 1 ? '' : 's'}`
        : '';
    summary = `${doseNotificationCount} dose notification${doseNotificationCount === 1 ? '' : 's'} scheduled · ${pastDueUntaken} past-due slot${pastDueUntaken === 1 ? '' : 's'} today · ${pending} still armed${visitPart}${refillPart}.`;
  }

  const result: ReminderCheckResult = {
    ranAt: new Date().toISOString(),
    today,
    timezone,
    nowLabel,
    nowMinutes: nowMins,
    enabled,
    permissionGranted,
    pendingNotificationCount: doseNotificationCount + visitNotificationCount + refillNotificationCount,
    doseNotificationCount,
    visitNotificationCount,
    refillNotificationCount,
    slots,
    summary,
  };

  lastReminderCheck = result;
  return result;
}
