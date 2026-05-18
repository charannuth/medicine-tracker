export type Theme = 'light' | 'dark'

export type ReminderSettings = {
  enabled: boolean
}

const KEYS = {
  theme: 'mt-theme',
  timezone: 'mt-timezone',
  reminders: 'mt-reminders',
  missedBanner: 'mt-missed-banner-dismiss',
  onboarding: 'mt-onboarding-v1',
  onboardingLegacy: 'mt-onboarding-v1',
} as const

function onboardingKey(userId: string): string {
  return `${KEYS.onboarding}:${userId}`
}

export function getTheme(): Theme {
  const stored = localStorage.getItem(KEYS.theme)
  if (stored === 'dark' || stored === 'light') return stored
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark'
  }
  return 'light'
}

export function toggleTheme(): Theme {
  const next: Theme = getTheme() === 'dark' ? 'light' : 'dark'
  setTheme(next)
  return next
}

export const THEME_CHANGE_EVENT = 'mt-theme-change'

export function setTheme(theme: Theme): void {
  localStorage.setItem(KEYS.theme, theme)
  applyTheme(theme)
  window.dispatchEvent(new CustomEvent(THEME_CHANGE_EVENT, { detail: theme }))
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute('data-theme', theme)
}

export function initTheme(): void {
  applyTheme(getTheme())
}

export function getTimezone(): string {
  const stored = localStorage.getItem(KEYS.timezone)
  if (stored) return stored
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function setTimezone(timezone: string): void {
  localStorage.setItem(KEYS.timezone, timezone)
}

export function getReminders(): ReminderSettings {
  try {
    const raw = localStorage.getItem(KEYS.reminders)
    if (!raw) return { enabled: false }
    return JSON.parse(raw) as ReminderSettings
  } catch {
    return { enabled: false }
  }
}

export function setReminders(settings: ReminderSettings): void {
  localStorage.setItem(KEYS.reminders, JSON.stringify(settings))
}

export function isOnboardingDone(userId: string): boolean {
  if (localStorage.getItem(onboardingKey(userId)) === '1') return true
  if (localStorage.getItem(KEYS.onboardingLegacy) === '1') {
    setOnboardingDone(userId)
    return true
  }
  return false
}

export function setOnboardingDone(userId: string): void {
  localStorage.setItem(onboardingKey(userId), '1')
}

export function isMissedDosesBannerDismissed(forDate: string): boolean {
  return localStorage.getItem(`${KEYS.missedBanner}:${forDate}`) === '1'
}

export function dismissMissedDosesBanner(forDate: string): void {
  localStorage.setItem(`${KEYS.missedBanner}:${forDate}`, '1')
}
