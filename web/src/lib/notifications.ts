import { emitInAppReminder } from './inAppReminder'

const notifiedToday = new Set<string>()

let swRegistration: ServiceWorkerRegistration | null = null
let swInitPromise: Promise<void> | null = null

function notifyKey(today: string, medicationId: string, scheduleTime: string): string {
  return `${today}|${medicationId}|${scheduleTime}`
}

export function clearNotifiedForNewDay(today: string): void {
  for (const key of [...notifiedToday]) {
    const match = key.match(/^(\d{4}-\d{2}-\d{2})\|/)
    if (match && match[1] !== today) {
      notifiedToday.delete(key)
    }
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported'
  return Notification.permission
}

export async function initNotificationService(): Promise<void> {
  if (!('serviceWorker' in navigator)) return
  if (swInitPromise) return swInitPromise

  swInitPromise = (async () => {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      })
      await navigator.serviceWorker.ready
    } catch {
      swRegistration = null
    }
  })()

  return swInitPromise
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false
  await initNotificationService()
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

export function canUseNotifications(): boolean {
  return isNotificationSupported() && Notification.permission === 'granted'
}

export function markNotified(
  today: string,
  medicationId: string,
  scheduleTime: string,
): void {
  notifiedToday.add(notifyKey(today, medicationId, scheduleTime))
}

export function wasNotified(
  today: string,
  medicationId: string,
  scheduleTime: string,
): boolean {
  return notifiedToday.has(notifyKey(today, medicationId, scheduleTime))
}

type ShowNotificationResult = {
  systemShown: boolean
  inAppShown: boolean
  error?: string
}

async function showNotification(
  title: string,
  body: string,
  tag: string,
): Promise<ShowNotificationResult> {
  emitInAppReminder({ title, body })

  if (!canUseNotifications()) {
    return { systemShown: false, inAppShown: true, error: 'Permission not granted' }
  }

  const options: NotificationOptions = {
    body,
    tag,
    icon: '/favicon.svg',
  }

  await initNotificationService()

  if (swRegistration) {
    try {
      await swRegistration.showNotification(title, options)
      return { systemShown: true, inAppShown: true }
    } catch {
      // fall through to constructor
    }
  }

  try {
    new Notification(title, options)
    return { systemShown: true, inAppShown: true }
  } catch (err) {
    return {
      systemShown: false,
      inAppShown: true,
      error: err instanceof Error ? err.message : 'System notification failed',
    }
  }
}

export async function notifyDoseDue(
  today: string,
  medicationId: string,
  scheduleTime: string,
  medicationName: string,
  timeLabel: string,
): Promise<boolean> {
  if (!canUseNotifications()) return false
  if (wasNotified(today, medicationId, scheduleTime)) return false

  const body = `Time to take ${medicationName} (${timeLabel})`
  const result = await showNotification(
    'Dr. Dose',
    body,
    notifyKey(today, medicationId, scheduleTime),
  )

  if (result.systemShown || result.inAppShown) {
    markNotified(today, medicationId, scheduleTime)
    return true
  }
  return false
}

