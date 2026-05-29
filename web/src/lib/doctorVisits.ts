import { formatDisplayDate, todayLocalDate } from './dates'
import { supabase } from './supabase'

export type DoctorVisit = {
  id: string
  user_id: string
  visit_date: string
  visit_time: string | null
  provider_name: string | null
  specialty: string | null
  location: string | null
  reason: string | null
  notes: string | null
  follow_up_date: string | null
  created_at: string
  updated_at: string
}

export type DoctorVisitInput = {
  visit_date: string
  visit_time: string
  provider_name: string
  specialty: string
  location: string
  reason: string
  notes: string
  follow_up_date: string
}

export const emptyDoctorVisitInput = (visitDate = todayLocalDate()): DoctorVisitInput => ({
  visit_date: visitDate,
  visit_time: '',
  provider_name: '',
  specialty: '',
  location: '',
  reason: '',
  notes: '',
  follow_up_date: '',
})

export function visitToInput(visit: DoctorVisit): DoctorVisitInput {
  return {
    visit_date: visit.visit_date,
    visit_time: visit.visit_time ?? '',
    provider_name: visit.provider_name ?? '',
    specialty: visit.specialty ?? '',
    location: visit.location ?? '',
    reason: visit.reason ?? '',
    notes: visit.notes ?? '',
    follow_up_date: visit.follow_up_date ?? '',
  }
}

export function isDoctorVisitScheduled(input: DoctorVisitInput): boolean {
  return Boolean(
    input.visit_date.trim() &&
      (input.provider_name.trim() ||
        input.reason.trim() ||
        input.specialty.trim() ||
        input.location.trim()),
  )
}

export function isUpcomingVisit(visitDate: string, today = todayLocalDate()): boolean {
  return visitDate > today
}

export function visitNeedsNotes(visit: DoctorVisit, today = todayLocalDate()): boolean {
  return visit.visit_date <= today && !visit.notes?.trim()
}

export function splitDoctorVisits(visits: DoctorVisit[], today = todayLocalDate()) {
  const upcoming: DoctorVisit[] = []
  const past: DoctorVisit[] = []

  for (const visit of visits) {
    if (isUpcomingVisit(visit.visit_date, today)) {
      upcoming.push(visit)
    } else {
      past.push(visit)
    }
  }

  upcoming.sort((a, b) => a.visit_date.localeCompare(b.visit_date))
  past.sort((a, b) => b.visit_date.localeCompare(a.visit_date))

  return { upcoming, past }
}

export function formatVisitWhen(visit: DoctorVisit): string {
  const dateLabel = formatDisplayDate(visit.visit_date)
  if (visit.visit_time?.trim()) {
    return `${dateLabel} · ${visit.visit_time.trim()}`
  }
  return dateLabel
}

export function visitProviderLabel(visit: DoctorVisit): string {
  if (visit.provider_name?.trim()) return visit.provider_name.trim()
  if (visit.specialty?.trim()) return visit.specialty.trim()
  return 'Doctor visit'
}

export async function fetchDoctorVisits(userId: string, limit = 48): Promise<DoctorVisit[]> {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('doctor_visits')
    .select('*')
    .eq('user_id', userId)
    .order('visit_date', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as DoctorVisit[]
}

export async function insertDoctorVisit(
  userId: string,
  input: DoctorVisitInput,
): Promise<DoctorVisit> {
  if (!supabase) throw new Error('Supabase is not configured')
  if (!input.visit_date.trim()) throw new Error('Visit date is required.')

  const payload = {
    user_id: userId,
    visit_date: input.visit_date.trim(),
    visit_time: input.visit_time.trim() || null,
    provider_name: input.provider_name.trim() || null,
    specialty: input.specialty.trim() || null,
    location: input.location.trim() || null,
    reason: input.reason.trim() || null,
    notes: input.notes.trim() || null,
    follow_up_date: input.follow_up_date.trim() || null,
  }

  const { data, error } = await supabase
    .from('doctor_visits')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data as DoctorVisit
}

export async function updateDoctorVisit(
  userId: string,
  visitId: string,
  input: DoctorVisitInput,
): Promise<DoctorVisit> {
  if (!supabase) throw new Error('Supabase is not configured')
  if (!input.visit_date.trim()) throw new Error('Visit date is required.')

  const payload = {
    visit_date: input.visit_date.trim(),
    visit_time: input.visit_time.trim() || null,
    provider_name: input.provider_name.trim() || null,
    specialty: input.specialty.trim() || null,
    location: input.location.trim() || null,
    reason: input.reason.trim() || null,
    notes: input.notes.trim() || null,
    follow_up_date: input.follow_up_date.trim() || null,
  }

  const { data, error } = await supabase
    .from('doctor_visits')
    .update(payload)
    .eq('id', visitId)
    .eq('user_id', userId)
    .select('*')
    .single()

  if (error) throw error
  return data as DoctorVisit
}

export async function deleteDoctorVisit(userId: string, visitId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured')
  const { error } = await supabase
    .from('doctor_visits')
    .delete()
    .eq('id', visitId)
    .eq('user_id', userId)
  if (error) throw error
}
