import {
  fetchMedicalRecord,
  upsertMedicalRecord,
  type MedicalRecord,
  type MedicalRecordInput,
} from './medicalRecords'
import { ageFromDateOfBirth, formatHeightCm, formatWeightKg } from './profileStats'

export type PhysicalProfileInput = {
  date_of_birth: string
  gender: string
  height_cm: string
  weight_kg: string
}

export function emptyPhysicalProfileInput(): PhysicalProfileInput {
  return {
    date_of_birth: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
  }
}

export function physicalProfileFromRecord(
  record: MedicalRecord | null,
): PhysicalProfileInput {
  if (!record) return emptyPhysicalProfileInput()
  return {
    date_of_birth: record.date_of_birth ?? '',
    gender: record.gender ?? '',
    height_cm: record.height_cm != null ? String(record.height_cm) : '',
    weight_kg: record.weight_kg != null ? String(record.weight_kg) : '',
  }
}

export function isPhysicalProfileFilled(input: PhysicalProfileInput): boolean {
  return (
    Boolean(input.date_of_birth) ||
    Boolean(input.gender) ||
    Boolean(input.height_cm.trim()) ||
    Boolean(input.weight_kg.trim())
  )
}

export function physicalProfileSummary(record: MedicalRecord | null): string | null {
  if (!record) return null
  const parts: string[] = []
  const age = record.date_of_birth
    ? ageFromDateOfBirth(record.date_of_birth)
    : null
  if (age != null) parts.push(`Age ${age}`)
  const height = formatHeightCm(record.height_cm)
  if (height) parts.push(height)
  const weight = formatWeightKg(record.weight_kg)
  if (weight) parts.push(weight)
  return parts.length > 0 ? parts.join(' · ') : null
}

/** Saves physical fields; preserves allergies and other medical record data. */
export async function upsertPhysicalProfile(
  userId: string,
  physical: PhysicalProfileInput,
  existing: MedicalRecord | null,
): Promise<MedicalRecord> {
  const base: MedicalRecordInput = existing
    ? {
        blood_type: existing.blood_type ?? '',
        date_of_birth: physical.date_of_birth,
        gender: physical.gender,
        height_cm: physical.height_cm,
        weight_kg: physical.weight_kg,
        known_allergies: [...existing.known_allergies],
        known_conditions: [...existing.known_conditions],
        past_surgeries: existing.past_surgeries ?? '',
        family_history: existing.family_history ?? '',
        emergency_notes: existing.emergency_notes ?? '',
        other_notes: existing.other_notes ?? '',
      }
    : {
        blood_type: '',
        date_of_birth: physical.date_of_birth,
        gender: physical.gender,
        height_cm: physical.height_cm,
        weight_kg: physical.weight_kg,
        known_allergies: [],
        known_conditions: [],
        past_surgeries: '',
        family_history: '',
        emergency_notes: '',
        other_notes: '',
      }

  return upsertMedicalRecord(userId, base)
}

export { fetchMedicalRecord }
