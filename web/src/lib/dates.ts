import { getTimezone } from './settings'

/** YYYY-MM-DD in the user's chosen timezone */
export function localDateString(date: Date = new Date(), timeZone?: string): string {
  const tz = timeZone ?? getTimezone()
  return date.toLocaleDateString('en-CA', { timeZone: tz })
}

export function todayLocalDate(): string {
  return localDateString()
}

export function nowInTimezone(timeZone?: string): Date {
  const tz = timeZone ?? getTimezone()
  const str = new Date().toLocaleString('en-US', { timeZone: tz })
  return new Date(str)
}

export function currentMinutesSinceMidnight(timeZone?: string): number {
  const tz = timeZone ?? getTimezone()
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 0)
  const minute = Number(parts.find((p) => p.type === 'minute')?.value ?? 0)
  return hour * 60 + minute
}

/** 24h schedule value → minutes since midnight (NaN if invalid). */
export function scheduleTimeToMinutes(time: string): number {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim())
  if (!match) return Number.NaN
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return Number.NaN
  return hour * 60 + minute
}

export function formatTimeInTimezone(timeZone?: string): string {
  const tz = timeZone ?? getTimezone()
  return new Date().toLocaleTimeString(undefined, {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  })
}

export type Meridiem = 'AM' | 'PM'

export type TwelveHourTime = {
  time12: string
  period: Meridiem
}

export function scheduleTimeToTwelveHour(time24: string): TwelveHourTime {
  const [h, m] = time24.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) {
    return { time12: '8:00', period: 'AM' }
  }
  const period: Meridiem = h >= 12 ? 'PM' : 'AM'
  const hour12 = h % 12 || 12
  return {
    time12: `${hour12}:${String(m).padStart(2, '0')}`,
    period,
  }
}

export function twelveHourToScheduleTime(
  time12: string,
  period: Meridiem,
): string {
  const trimmed = time12.trim()
  const match = /^(\d{1,2}):(\d{2})$/.exec(trimmed)
  if (!match) {
    throw new Error(`Use hours:minutes (e.g. 8:00 or 10:30)`)
  }

  let hour = Number(match[1])
  const minute = Number(match[2])

  if (hour < 1 || hour > 12) {
    throw new Error('Hour must be between 1 and 12')
  }
  if (minute < 0 || minute > 59) {
    throw new Error('Minutes must be between 0 and 59')
  }

  if (period === 'AM') {
    if (hour === 12) hour = 0
  } else if (hour !== 12) {
    hour += 12
  }

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

export function normalizeScheduleTimes(times: string[]): string[] {
  const seen = new Set<string>()
  const unique: string[] = []
  for (const raw of times) {
    const t = raw?.trim()
    if (!t || seen.has(t)) continue
    seen.add(t)
    unique.push(t)
  }
  return unique.sort()
}

export function formatScheduleTime(time: string): string {
  const { time12, period } = scheduleTimeToTwelveHour(time)
  return `${time12} ${period}`
}

export function lastNDays(count: number, timeZone?: string): string[] {
  const tz = timeZone ?? getTimezone()
  const days: string[] = []
  const anchor = localDateString(new Date(), tz)
  const [y, m, d] = anchor.split('-').map(Number)
  const base = new Date(y, m - 1, d)

  for (let i = 0; i < count; i++) {
    const copy = new Date(base)
    copy.setDate(base.getDate() - i)
    const ys = copy.getFullYear()
    const ms = String(copy.getMonth() + 1).padStart(2, '0')
    const ds = String(copy.getDate()).padStart(2, '0')
    days.push(`${ys}-${ms}-${ds}`)
  }
  return days
}

export function addDaysToDateString(dateStr: string, delta: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + delta)
  return localDateString(date)
}

export function formatDisplayDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = todayLocalDate()
  const yesterday = addDaysToDateString(today, -1)

  if (dateStr === today) return 'Today'
  if (dateStr === yesterday) return 'Yesterday'

  return date.toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function formatTakenTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  })
}
