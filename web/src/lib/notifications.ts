const notifiedToday = new Set<string>()

export function clearNotifiedForNewDay(today: string): void {
  for (const key of notifiedToday) {
    if (!key.startsWith(`${today}|`)) {
      notifiedToday.delete(key)
    }
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function canUseNotifications(): boolean {
  return 'Notification' in window && Notification.permission === 'granted'
}

export function notifyDoseDue(medicationName: string, timeLabel: string): void {
  if (!canUseNotifications()) return

  const key = `dose-${medicationName}-${timeLabel}`
  if (notifiedToday.has(key)) return
  notifiedToday.add(key)

  new Notification('Medicine Tracker', {
    body: `Time to take ${medicationName} (${timeLabel})`,
    tag: key,
  })
}

export function markNotified(today: string, medicationId: string, scheduleTime: string): void {
  notifiedToday.add(`${today}|${medicationId}|${scheduleTime}`)
}

export function wasNotified(today: string, medicationId: string, scheduleTime: string): boolean {
  return notifiedToday.has(`${today}|${medicationId}|${scheduleTime}`)
}
