export type TrackerId =
  | 'cycle'
  | 'hrt'
  | 'med_progress'
  | 'vitals'
  | 'weight'
  | 'pain'
  | 'migraine'
  | 'respiratory'
  | 'custom'

export type TrackerCatalogEntry = {
  id: TrackerId
  label: string
  description: string
  available: boolean
}

export const TRACKER_CATALOG: TrackerCatalogEntry[] = [
  {
    id: 'cycle',
    label: 'Cycle & period',
    description: 'Period start/end, flow, calendar, and predictions',
    available: true,
  },
  {
    id: 'hrt',
    label: 'HRT & hormones',
    description: 'Doses logged on Today sync here automatically',
    available: true,
  },
  {
    id: 'med_progress',
    label: 'Medication progress',
    description: 'Adherence, streaks, and refill status from Today',
    available: true,
  },
  {
    id: 'vitals',
    label: 'Vitals',
    description: 'Blood pressure, glucose, pulse, and more',
    available: false,
  },
  {
    id: 'weight',
    label: 'Weight over time',
    description: 'Weight trends alongside your profile',
    available: false,
  },
  {
    id: 'pain',
    label: 'Pain diary',
    description: 'Pain scale and flare logging',
    available: false,
  },
  {
    id: 'migraine',
    label: 'Migraine',
    description: 'Headache attacks, triggers, and relief meds',
    available: false,
  },
  {
    id: 'respiratory',
    label: 'Respiratory',
    description: 'Peak flow and rescue inhaler use',
    available: false,
  },
  {
    id: 'custom',
    label: 'Custom metric',
    description: 'Name your own number or yes/no tracker',
    available: false,
  },
]

export function trackerCatalogEntry(id: TrackerId): TrackerCatalogEntry | undefined {
  return TRACKER_CATALOG.find((t) => t.id === id)
}
