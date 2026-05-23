import { fetchMedicationsWithStatus } from './medications'
import {
  currentMinutesSinceMidnight,
  formatScheduleTime,
  formatTimeInTimezone,
  scheduleTimeToMinutes,
  todayLocalDate,
} from './dates'
import {
  canUseNotifications,
  clearNotifiedForNewDay,
  notifyDoseDue,
  wasNotified,
} from './notifications'
import { getReminders, getTimezone } from './settings'

export type ReminderSlotDebug = {
  medicationName: string
  scheduleTime: string
  scheduleLabel: string
  taken: boolean
  pastDue: boolean
  alreadyNotified: boolean
  notifiedNow: boolean
  skipReason?: string
}

export type ReminderCheckResult = {
  ranAt: string
  today: string
  timezone: string
  nowLabel: string
  nowMinutes: number
  enabled: boolean
  permissionGranted: boolean
  notifiedCount: number
  slots: ReminderSlotDebug[]
  summary: string
}

let lastReminderCheck: ReminderCheckResult | null = null

export function getLastReminderCheck(): ReminderCheckResult | null {
  return lastReminderCheck
}

export async function runReminderCheck(userId: string): Promise<ReminderCheckResult> {
  const { enabled } = getReminders()
  const permissionGranted = canUseNotifications()
  const today = todayLocalDate()
  const timezone = getTimezone()
  const nowMins = currentMinutesSinceMidnight()
  const nowLabel = formatTimeInTimezone()

  clearNotifiedForNewDay(today)

  const slots: ReminderSlotDebug[] = []
  let notifiedCount = 0

  if (enabled && permissionGranted) {
    const medications = await fetchMedicationsWithStatus(userId)

    for (const med of medications) {
      for (const slot of med.slots) {
        const slotMins = scheduleTimeToMinutes(slot.time)
        const pastDue = Number.isFinite(slotMins) && slotMins <= nowMins
        const alreadyNotified = wasNotified(today, med.id, slot.time)

        let skipReason: string | undefined
        if (slot.taken) skipReason = 'Already marked taken'
        else if (!Number.isFinite(slotMins)) skipReason = 'Invalid schedule time'
        else if (!pastDue) skipReason = 'Not due yet (later today)'
        else if (alreadyNotified) skipReason = 'Already reminded today'

        let notifiedNow = false
        if (!skipReason) {
          notifiedNow = await notifyDoseDue(
            today,
            med.id,
            slot.time,
            med.name,
            formatScheduleTime(slot.time),
          )
          if (notifiedNow) {
            notifiedCount++
          } else {
            skipReason = 'Could not show reminder (see in-app banner if enabled)'
          }
        }

        slots.push({
          medicationName: med.name,
          scheduleTime: slot.time,
          scheduleLabel: formatScheduleTime(slot.time),
          taken: slot.taken,
          pastDue,
          alreadyNotified,
          notifiedNow,
          skipReason,
        })
      }
    }
  }

  let summary: string
  if (!enabled) {
    summary = 'Reminders are off in settings.'
  } else if (!permissionGranted) {
    summary = 'Notification permission is not granted.'
  } else if (slots.length === 0) {
    summary = 'No active medications with dose times for today.'
  } else if (notifiedCount > 0) {
    summary = `Sent ${notifiedCount} reminder${notifiedCount === 1 ? '' : 's'} — look for the banner at the bottom of the screen and Notification Center (Mac top right).`
  } else {
    const waiting = slots.filter((s) => s.skipReason === 'Not due yet (later today)').length
    const taken = slots.filter((s) => s.taken).length
    summary = `No new reminders (${taken} taken, ${waiting} not due yet). See slot details below.`
  }

  const result: ReminderCheckResult = {
    ranAt: new Date().toISOString(),
    today,
    timezone,
    nowLabel,
    nowMinutes: nowMins,
    enabled,
    permissionGranted,
    notifiedCount,
    slots,
    summary,
  }

  lastReminderCheck = result
  return result
}
