import type { MedicationScheduleStatus } from './medicationDates'

export type Medication = {
  id: string
  user_id: string
  name: string
  dose_pills: string | null
  dose_mg: string | null
  schedule_times: string[]
  notes: string | null
  pills_remaining: number | null
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
}

export type DoseLog = {
  id: string
  medication_id: string
  user_id: string
  taken_on: string
  schedule_time: string
  taken_at: string
}

export type MedicationInput = {
  name: string
  dose_pills: string
  dose_mg: string
  schedule_times: string[]
  notes: string
  pills_remaining: number | null
  start_date: string
  end_date: string | null
}

export type DoseSlotStatus = {
  time: string
  label: string
  taken: boolean
  doseLogId: string | null
}

export type MedicationWithStatus = Medication & {
  slots: DoseSlotStatus[]
  dosesTakenToday: number
  dosesTotalToday: number
  allDosesTakenToday: boolean
  scheduleStatus: MedicationScheduleStatus
}
