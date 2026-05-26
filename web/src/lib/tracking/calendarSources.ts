import type { TrackerId } from './catalog'
import { trackerCatalogEntry } from './catalog'

export type CalendarSupport = 'full' | 'planned' | 'none'

export type CalendarSourceMeta = {
  id: TrackerId
  label: string
  support: CalendarSupport
}

const CALENDAR_SUPPORT: Partial<Record<TrackerId, CalendarSupport>> = {
  cycle: 'full',
  weight: 'full',
  vitals: 'planned',
  pain: 'planned',
  migraine: 'planned',
  respiratory: 'planned',
  med_progress: 'planned',
  hrt: 'full',
  custom: 'planned',
}

export function calendarSupportFor(id: TrackerId): CalendarSupport {
  return CALENDAR_SUPPORT[id] ?? 'none'
}

export function calendarSourceOptions(
  enabledTrackerIds: TrackerId[],
): CalendarSourceMeta[] {
  return enabledTrackerIds
    .map((id) => {
      const entry = trackerCatalogEntry(id)
      return {
        id,
        label: entry?.label ?? id,
        support: calendarSupportFor(id),
      }
    })
    .filter((s) => s.support !== 'none')
}

export function defaultCalendarSource(
  enabledTrackerIds: TrackerId[],
  preferred?: TrackerId | null,
): TrackerId | null {
  const options = calendarSourceOptions(enabledTrackerIds)
  const full = options.filter((o) => o.support === 'full')
  if (preferred && full.some((o) => o.id === preferred)) return preferred
  return full[0]?.id ?? options[0]?.id ?? null
}
