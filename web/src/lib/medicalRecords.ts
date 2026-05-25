import { supabase } from './supabase'

export type BloodType =
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-'
  | 'unknown'
  | null

export type MedicalRecord = {
  user_id: string
  blood_type: BloodType
  date_of_birth: string | null
  gender: string | null
  height_cm: number | null
  weight_kg: number | null
  known_allergies: string[]
  known_conditions: string[]
  past_surgeries: string | null
  family_history: string | null
  emergency_notes: string | null
  other_notes: string | null
  created_at: string
  updated_at: string
}

export type MedicalRecordInput = {
  blood_type: string
  date_of_birth: string
  gender: string
  height_cm: string
  weight_kg: string
  known_allergies: string[]
  known_conditions: string[]
  past_surgeries: string
  family_history: string
  emergency_notes: string
  other_notes: string
}

export const emptyMedicalRecordInput = (): MedicalRecordInput => ({
  blood_type: '',
  date_of_birth: '',
  gender: '',
  height_cm: '',
  weight_kg: '',
  known_allergies: [],
  known_conditions: [],
  past_surgeries: '',
  family_history: '',
  emergency_notes: '',
  other_notes: '',
})

export function recordToInput(record: MedicalRecord | null): MedicalRecordInput {
  if (!record) return emptyMedicalRecordInput()
  return {
    blood_type: record.blood_type ?? '',
    date_of_birth: record.date_of_birth ?? '',
    gender: record.gender ?? '',
    height_cm: record.height_cm != null ? String(record.height_cm) : '',
    weight_kg: record.weight_kg != null ? String(record.weight_kg) : '',
    known_allergies: [...record.known_allergies],
    known_conditions: [...record.known_conditions],
    past_surgeries: record.past_surgeries ?? '',
    family_history: record.family_history ?? '',
    emergency_notes: record.emergency_notes ?? '',
    other_notes: record.other_notes ?? '',
  }
}

export function isMedicalRecordFilled(input: MedicalRecordInput): boolean {
  return (
    Boolean(input.blood_type) ||
    Boolean(input.date_of_birth) ||
    Boolean(input.gender) ||
    Boolean(input.height_cm.trim()) ||
    Boolean(input.weight_kg.trim()) ||
    input.known_allergies.length > 0 ||
    input.known_conditions.length > 0 ||
    input.past_surgeries.trim().length > 0 ||
    input.family_history.trim().length > 0 ||
    input.emergency_notes.trim().length > 0 ||
    input.other_notes.trim().length > 0
  )
}

function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export async function fetchMedicalRecord(
  userId: string,
): Promise<MedicalRecord | null> {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('medical_records')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data as MedicalRecord | null
}

export async function upsertMedicalRecord(
  userId: string,
  input: MedicalRecordInput,
): Promise<MedicalRecord> {
  if (!supabase) throw new Error('Supabase is not configured')

  const payload = {
    user_id: userId,
    blood_type: input.blood_type || null,
    date_of_birth: input.date_of_birth.trim() || null,
    gender: input.gender.trim() || null,
    height_cm: parseOptionalNumber(input.height_cm),
    weight_kg: parseOptionalNumber(input.weight_kg),
    known_allergies: input.known_allergies,
    known_conditions: input.known_conditions,
    past_surgeries: input.past_surgeries.trim() || null,
    family_history: input.family_history.trim() || null,
    emergency_notes: input.emergency_notes.trim() || null,
    other_notes: input.other_notes.trim() || null,
  }

  const { data, error } = await supabase
    .from('medical_records')
    .upsert(payload, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (error) throw error
  return data as MedicalRecord
}
