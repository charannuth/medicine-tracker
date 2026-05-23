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
  known_allergies: string[]
  known_conditions: string[]
  past_surgeries: string
  family_history: string
  emergency_notes: string
  other_notes: string
}

export const emptyMedicalRecordInput = (): MedicalRecordInput => ({
  blood_type: '',
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
    input.known_allergies.length > 0 ||
    input.known_conditions.length > 0 ||
    input.past_surgeries.trim().length > 0 ||
    input.family_history.trim().length > 0 ||
    input.emergency_notes.trim().length > 0 ||
    input.other_notes.trim().length > 0
  )
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
