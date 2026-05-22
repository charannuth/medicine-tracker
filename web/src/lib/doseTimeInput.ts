import type { Meridiem } from './dates'
import { scheduleTimeToTwelveHour, twelveHourToScheduleTime } from './dates'

/** Strip to up to 4 digits for HHMM-style entry. */
export function extractTimeDigits(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4)
}

/** Live mask while typing (e.g. 830 → 8:30, 1030 → 10:30). */
export function formatTime12MaskFromDigits(digits: string): string {
  const d = extractTimeDigits(digits)
  if (!d) return ''

  if (d.length === 1) return d

  if (d.length === 2) {
    const asHour = Number(d)
    if (asHour >= 1 && asHour <= 12) return d
    return `${d[0]}:${d[1]}`
  }

  if (d.length === 3) {
    const oneHour = Number(d[0])
    const twoMin = Number(d.slice(1))
    if (oneHour >= 1 && oneHour <= 12 && twoMin <= 59) {
      return `${d[0]}:${d.slice(1)}`
    }
    const twoHour = Number(d.slice(0, 2))
    if (twoHour >= 1 && twoHour <= 12) {
      return `${d.slice(0, 2)}:${d[2]}`
    }
    return `${d[0]}:${d.slice(1)}`
  }

  const twoHour = Number(d.slice(0, 2))
  if (twoHour >= 1 && twoHour <= 12) {
    return `${d.slice(0, 2)}:${d.slice(2)}`
  }
  return `${d[0]}:${d.slice(1, 3)}`
}

/** Finalize display on blur / before save (e.g. 8 → 8:00). */
export function normalizeTime12Display(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed) return ''

  const colonMatch = /^(\d{1,2}):(\d{1,2})$/.exec(trimmed)
  if (colonMatch) {
    const hour = Number(colonMatch[1])
    const minute = Number(colonMatch[2])
    if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
      return `${hour}:${String(minute).padStart(2, '0')}`
    }
  }

  const digits = extractTimeDigits(trimmed)
  if (!digits) {
    throw new Error('Enter a time (e.g. 8:00)')
  }

  if (digits.length === 1) {
    const hour = Number(digits)
    if (hour >= 1 && hour <= 12) return `${hour}:00`
  }

  if (digits.length === 2) {
    const hour = Number(digits)
    if (hour >= 1 && hour <= 12) return `${hour}:00`
    const h = Number(digits[0])
    const m = Number(digits[1])
    if (h >= 1 && h <= 12) return `${h}:${String(m).padStart(2, '0')}`
  }

  if (digits.length === 3) {
    const h = Number(digits[0])
    const m = Number(digits.slice(1))
    if (h >= 1 && h <= 12 && m <= 59) {
      return `${h}:${String(m).padStart(2, '0')}`
    }
    const h2 = Number(digits.slice(0, 2))
    const m2 = Number(digits[2])
    if (h2 >= 1 && h2 <= 12) return `${h2}:0${m2}`
  }

  if (digits.length === 4) {
    const h2 = Number(digits.slice(0, 2))
    const m2 = Number(digits.slice(2))
    if (h2 >= 1 && h2 <= 12 && m2 <= 59) {
      return `${h2}:${String(m2).padStart(2, '0')}`
    }
    const h1 = Number(digits[0])
    const m3 = Number(digits.slice(1))
    if (h1 >= 1 && h1 <= 12 && m3 <= 59) {
      return `${h1}:${String(m3).padStart(2, '0')}`
    }
  }

  throw new Error('Use hours:minutes (e.g. 8:00 or 10:30)')
}

export function tryScheduleTime24(time12: string, period: Meridiem): string | null {
  try {
    const normalized = normalizeTime12Display(time12)
    return twelveHourToScheduleTime(normalized, period)
  } catch {
    return null
  }
}

export function time12FromSchedule24(time24: string): { time12: string; period: Meridiem } {
  return scheduleTimeToTwelveHour(time24)
}
