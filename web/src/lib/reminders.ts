import { fetchMedicationsWithStatus } from './medications'
import {
  currentMinutesSinceMidnight,
  formatScheduleTime,
  scheduleTimeToMinutes,
  todayLocalDate,
} from './dates'
import {
  canUseNotifications,
  clearNotifiedForNewDay,
  notifyDoseDue,
  wasNotified,
} from './notifications'
import { getReminders } from './settings'

export async function runReminderCheck(userId: string): Promise<void> {
  const { enabled } = getReminders()
  if (!enabled || !canUseNotifications()) return

  const today = todayLocalDate()
  clearNotifiedForNewDay(today)

  const medications = await fetchMedicationsWithStatus(userId)
  const nowMins = currentMinutesSinceMidnight()

  for (const med of medications) {
    for (const slot of med.slots) {
      if (slot.taken) continue
      if (scheduleTimeToMinutes(slot.time) > nowMins) continue
      if (wasNotified(today, med.id, slot.time)) continue

      notifyDoseDue(med.name, formatScheduleTime(slot.time))
    }
  }
}
