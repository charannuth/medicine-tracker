import { supabase } from './supabase'
import {
  formatScheduleTime,
  normalizeScheduleTimes,
  todayLocalDate,
  currentPrnScheduleTimeToken,
} from './dates'
import { normalizeDoseFields } from './dose'
import { getDoseDeductionAmount } from './inventory'
import {
  filterMedicationsActiveOn,
  getMedicationScheduleStatus,
  isMedicationActiveOn,
  validateMedicationDates,
} from './medicationDates'
import { isAsNeededMed } from './medicationSchedule'
import { syncDoseLogToTracking, removeSyncedDoseLog } from './tracking/doseSync'
import type {
  DoseLog,
  DoseSlotStatus,
  Medication,
  MedicationInput,
  MedicationScheduleType,
  MedicationTrackingSync,
  MedicationWithStatus,
} from './types'

function normalizeScheduleType(value: string | null | undefined): MedicationScheduleType {
  return value === 'as_needed' ? 'as_needed' : 'scheduled'
}

function normalizeTrackingSync(
  value: string | null | undefined,
): MedicationTrackingSync {
  return value === 'hrt' ? 'hrt' : 'none'
}

function buildPrnSlots(logs: DoseLog[]): DoseSlotStatus[] {
  return [...logs]
    .sort((a, b) => a.schedule_time.localeCompare(b.schedule_time))
    .map((log) => ({
      time: log.schedule_time,
      label: formatScheduleTime(log.schedule_time),
      taken: true,
      doseLogId: log.id,
    }))
}

function buildSlots(
  scheduleTimes: string[],
  logs: DoseLog[],
): DoseSlotStatus[] {
  const times = normalizeScheduleTimes(scheduleTimes)
  const logByTime = new Map(logs.map((l) => [l.schedule_time, l]))
  return times.map((time) => {
    const log = logByTime.get(time)
    return {
      time,
      label: formatScheduleTime(time),
      taken: Boolean(log),
      doseLogId: log?.id ?? null,
    }
  })
}

/** When schedule times change, move or remove today's dose logs so slots stay in sync. */
async function reconcileDoseLogsForScheduleChange(
  medicationId: string,
  oldTimes: string[],
  newTimes: string[],
): Promise<void> {
  if (!supabase) return

  const today = todayLocalDate()
  const { data: logs, error } = await supabase
    .from('dose_logs')
    .select('*')
    .eq('medication_id', medicationId)
    .eq('taken_on', today)

  if (error) throw error
  if (!logs?.length) return

  const migrations = new Map<string, string>()
  if (oldTimes.length === newTimes.length) {
    oldTimes.forEach((old, i) => {
      if (old !== newTimes[i]) migrations.set(old, newTimes[i])
    })
  } else if (oldTimes.length === 1 && newTimes.length === 1) {
    migrations.set(oldTimes[0], newTimes[0])
  }

  for (const log of logs as DoseLog[]) {
    const migratedTo = migrations.get(log.schedule_time)
    if (migratedTo) {
      const { error: updateError } = await supabase
        .from('dose_logs')
        .update({ schedule_time: migratedTo })
        .eq('id', log.id)
      if (updateError && updateError.code !== '23505') throw updateError
      if (updateError?.code === '23505') {
        await supabase.from('dose_logs').delete().eq('id', log.id)
      }
      continue
    }

    if (!newTimes.includes(log.schedule_time)) {
      await supabase.from('dose_logs').delete().eq('id', log.id)
    }
  }
}

export type FetchMedicationsOptions = {
  /** Defaults to today in the user's timezone. */
  forDate?: string
  /** When false (default), only meds active on forDate are returned. */
  includeInactive?: boolean
}

export async function userHasMedications(userId: string): Promise<boolean> {
  if (!supabase) return false
  const { count, error } = await supabase
    .from('medications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
  if (error) throw error
  return (count ?? 0) > 0
}

export async function fetchMedicationsWithStatus(
  userId: string,
  options: FetchMedicationsOptions = {},
): Promise<MedicationWithStatus[]> {
  if (!supabase) return []

  const forDate = options.forDate ?? todayLocalDate()
  const includeInactive = options.includeInactive ?? false

  const [medsResult, logsResult] = await Promise.all([
    supabase
      .from('medications')
      .select('*')
      .eq('user_id', userId)
      .order('name'),
    supabase
      .from('dose_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('taken_on', forDate),
  ])

  if (medsResult.error) throw medsResult.error
  if (logsResult.error) throw logsResult.error

  let meds = (medsResult.data ?? []) as Medication[]
  if (!includeInactive) {
    meds = filterMedicationsActiveOn(meds, forDate)
  }
  for (const med of meds) {
    const cleaned = normalizeScheduleTimes(med.schedule_times ?? [])
    if (cleaned.length !== (med.schedule_times ?? []).length) {
      med.schedule_times = cleaned
      void supabase
        .from('medications')
        .update({ schedule_times: cleaned })
        .eq('id', med.id)
    }
  }

  const logsByMed = new Map<string, DoseLog[]>()
  for (const log of (logsResult.data ?? []) as DoseLog[]) {
    const list = logsByMed.get(log.medication_id) ?? []
    list.push(log)
    logsByMed.set(log.medication_id, list)
  }

  return meds.map((med) => {
    const schedule_type = normalizeScheduleType(med.schedule_type)
    const schedule_times = normalizeScheduleTimes(med.schedule_times ?? [])
    const activeToday = getMedicationScheduleStatus(med, forDate) === 'active'
    const medLogs = logsByMed.get(med.id) ?? []

    if (isAsNeededMed({ schedule_type })) {
      const prnSlots = activeToday ? buildPrnSlots(medLogs) : []
      return {
        ...med,
        schedule_type,
        tracking_sync: normalizeTrackingSync(med.tracking_sync),
        schedule_times: [],
        slots: prnSlots,
        dosesTakenToday: prnSlots.length,
        dosesTotalToday: 0,
        allDosesTakenToday: false,
        scheduleStatus: getMedicationScheduleStatus(med, forDate),
      }
    }

    const slots = activeToday ? buildSlots(schedule_times, medLogs) : []
    const dosesTakenToday = slots.filter((s) => s.taken).length
    return {
      ...med,
      schedule_type,
      tracking_sync: normalizeTrackingSync(med.tracking_sync),
      schedule_times,
      slots,
      dosesTakenToday,
      dosesTotalToday: slots.length,
      allDosesTakenToday:
        slots.length > 0 && dosesTakenToday === slots.length,
      scheduleStatus: getMedicationScheduleStatus(med, forDate),
    }
  })
}

export function todayDoseTotals(medications: MedicationWithStatus[]) {
  const scheduled = medications.filter((m) => !isAsNeededMed(m))
  const taken = scheduled.reduce((sum, m) => sum + m.dosesTakenToday, 0)
  const total = scheduled.reduce((sum, m) => sum + m.dosesTotalToday, 0)
  return { taken, total }
}

export async function createMedication(
  userId: string,
  input: MedicationInput,
): Promise<void> {
  if (!supabase) return

  const { dose_pills, dose_mg } = normalizeDoseFields(
    input.dose_pills,
    input.dose_mg,
  )

  const schedule_type = input.schedule_type ?? 'scheduled'
  const schedule_times =
    schedule_type === 'as_needed'
      ? []
      : normalizeScheduleTimes(input.schedule_times)
  validateMedicationDates(input.start_date, input.end_date)

  const { error } = await supabase.from('medications').insert({
    user_id: userId,
    name: input.name.trim(),
    medication_route: input.medication_route,
    medication_form: input.medication_form,
    dose_pills,
    dose_mg,
    schedule_type,
    schedule_times,
    tracking_sync: input.tracking_sync ?? 'none',
    notes: input.notes.trim() || null,
    pills_remaining: input.pills_remaining,
    start_date: input.start_date,
    end_date: input.end_date,
  })

  if (error) throw error
}

export async function updateMedication(
  id: string,
  input: MedicationInput,
): Promise<void> {
  if (!supabase) return

  const { dose_pills, dose_mg } = normalizeDoseFields(
    input.dose_pills,
    input.dose_mg,
  )

  const schedule_type = input.schedule_type ?? 'scheduled'
  const newTimes =
    schedule_type === 'as_needed'
      ? []
      : normalizeScheduleTimes(input.schedule_times)
  validateMedicationDates(input.start_date, input.end_date)

  const { data: existing, error: fetchError } = await supabase
    .from('medications')
    .select('schedule_times, schedule_type')
    .eq('id', id)
    .single()

  if (fetchError) throw fetchError

  const oldTimes = normalizeScheduleTimes(existing?.schedule_times ?? [])

  const { error } = await supabase
    .from('medications')
    .update({
      name: input.name.trim(),
      medication_route: input.medication_route,
      medication_form: input.medication_form,
      dose_pills,
      dose_mg,
      schedule_type,
      schedule_times: newTimes,
      tracking_sync: input.tracking_sync ?? 'none',
      notes: input.notes.trim() || null,
      pills_remaining: input.pills_remaining,
      start_date: input.start_date,
      end_date: input.end_date,
    })
    .eq('id', id)

  if (error) throw error

  const scheduleChanged =
    schedule_type !== normalizeScheduleType(existing?.schedule_type) ||
    oldTimes.length !== newTimes.length ||
    oldTimes.some((t, i) => t !== newTimes[i])

  if (scheduleChanged) {
    await reconcileDoseLogsForScheduleChange(id, oldTimes, newTimes)
  }
}

export async function deleteMedication(id: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('medications').delete().eq('id', id)
  if (error) throw error
}

async function adjustInventoryRemaining(
  medicationId: string,
  dosePills: string | null,
  direction: 'take' | 'undo',
): Promise<void> {
  if (!supabase) return

  const { data: med } = await supabase
    .from('medications')
    .select('pills_remaining')
    .eq('id', medicationId)
    .single()

  if (med?.pills_remaining == null) return

  const amount = getDoseDeductionAmount(dosePills)
  const delta = direction === 'take' ? -amount : amount
  const next = Math.max(0, Math.round(med.pills_remaining + delta))
  await supabase
    .from('medications')
    .update({ pills_remaining: next })
    .eq('id', medicationId)
}

export async function markPrnDoseTaken(
  userId: string,
  medicationId: string,
): Promise<void> {
  if (!supabase) return

  const today = todayLocalDate()
  const { data: med, error: medError } = await supabase
    .from('medications')
    .select(
      'name, start_date, end_date, dose_pills, dose_mg, schedule_type, tracking_sync',
    )
    .eq('id', medicationId)
    .single()

  if (medError) throw medError
  if (!med || !isMedicationActiveOn(med, today)) {
    throw new Error('This medication is not active today.')
  }
  if (!isAsNeededMed(med)) {
    throw new Error('This medication uses a fixed daily schedule.')
  }

  const scheduleTime = currentPrnScheduleTimeToken()

  const { data: log, error } = await supabase
    .from('dose_logs')
    .insert({
      user_id: userId,
      medication_id: medicationId,
      taken_on: today,
      schedule_time: scheduleTime,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('Try again in a second — dose already logged.')
    }
    throw error
  }

  await adjustInventoryRemaining(medicationId, med.dose_pills, 'take')

  if (log?.id) {
    await syncDoseLogToTracking({
      userId,
      medicationId,
      doseLogId: log.id,
      trackingSync: normalizeTrackingSync(med.tracking_sync),
      takenOn: today,
      scheduleTime,
      medicationName: med.name,
      dosePills: med.dose_pills,
      doseMg: med.dose_mg,
    })
  }
}

export async function markDoseTaken(
  userId: string,
  medicationId: string,
  scheduleTime: string,
): Promise<void> {
  if (!supabase) return

  const today = todayLocalDate()
  const { data: med, error: medError } = await supabase
    .from('medications')
    .select(
      'name, start_date, end_date, dose_pills, dose_mg, schedule_type, tracking_sync',
    )
    .eq('id', medicationId)
    .single()

  if (medError) throw medError
  if (!med || !isMedicationActiveOn(med, today)) {
    throw new Error('This medication is not active today.')
  }
  if (isAsNeededMed(med)) {
    throw new Error('Use Log dose for as-needed medications.')
  }

  const { data: log, error } = await supabase
    .from('dose_logs')
    .insert({
      user_id: userId,
      medication_id: medicationId,
      taken_on: today,
      schedule_time: scheduleTime,
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new Error('This dose is already marked as taken.')
    }
    throw error
  }

  await adjustInventoryRemaining(medicationId, med.dose_pills, 'take')

  if (log?.id) {
    await syncDoseLogToTracking({
      userId,
      medicationId,
      doseLogId: log.id,
      trackingSync: normalizeTrackingSync(med.tracking_sync),
      takenOn: today,
      scheduleTime,
      medicationName: med.name,
      dosePills: med.dose_pills,
      doseMg: med.dose_mg,
    })
  }
}

export async function undoDose(doseLogId: string, medicationId: string): Promise<void> {
  if (!supabase) return

  const { data: med, error: medError } = await supabase
    .from('medications')
    .select('dose_pills')
    .eq('id', medicationId)
    .single()

  if (medError) throw medError

  const { error } = await supabase.from('dose_logs').delete().eq('id', doseLogId)
  if (error) throw error

  await removeSyncedDoseLog(doseLogId)
  await adjustInventoryRemaining(medicationId, med?.dose_pills ?? null, 'undo')
}

/** One-time cleanup: dedupe schedule_times in DB for a medication. */
export async function repairMedicationSchedule(medicationId: string): Promise<void> {
  if (!supabase) return

  const { data: med, error } = await supabase
    .from('medications')
    .select('schedule_times')
    .eq('id', medicationId)
    .single()

  if (error) throw error

  const cleaned = normalizeScheduleTimes(med?.schedule_times ?? [])
  if (cleaned.length === (med?.schedule_times ?? []).length) return

  await supabase
    .from('medications')
    .update({ schedule_times: cleaned })
    .eq('id', medicationId)
}
