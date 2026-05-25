/** Age in whole years from YYYY-MM-DD date of birth. */
export function ageFromDateOfBirth(dob: string, today = new Date()): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob.trim())
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  let age = today.getFullYear() - year
  const monthDiff = today.getMonth() + 1 - month
  const dayDiff = today.getDate() - day
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) age--
  return age >= 0 ? age : null
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches - feet * 12)
  return { feet, inches: inches === 12 ? 0 : inches }
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round(((feet * 12 + inches) * 2.54 + Number.EPSILON) * 10) / 10
}

export function kgToLb(kg: number): number {
  return Math.round((kg * 2.2046226218 + Number.EPSILON) * 10) / 10
}

export function lbToKg(lb: number): number {
  return Math.round((lb / 2.2046226218 + Number.EPSILON) * 100) / 100
}

export function formatHeightCm(cm: number | null | undefined): string | null {
  if (cm == null || !Number.isFinite(cm) || cm <= 0) return null
  const { feet, inches } = cmToFeetInches(cm)
  return `${Math.round(cm)} cm (${feet}'${inches}")`
}

export function formatWeightKg(kg: number | null | undefined): string | null {
  if (kg == null || !Number.isFinite(kg) || kg <= 0) return null
  return `${kg} kg (${kgToLb(kg)} lb)`
}

export const GENDER_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'woman', label: 'Woman' },
  { value: 'man', label: 'Man' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'other', label: 'Other / self-describe' },
] as const

export function genderLabel(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const hit = GENDER_OPTIONS.find((o) => o.value === value)
  return hit?.label ?? value
}
