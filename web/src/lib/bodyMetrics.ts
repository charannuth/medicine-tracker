import {
  cmToFeetInches,
  feetInchesToCm,
  kgToLb,
  lbToKg,
} from './profileStats'

export type BodyMetricUnit = 'metric' | 'imperial'

export function normalizeBodyMetricUnit(
  value: string | null | undefined,
): BodyMetricUnit {
  return value === 'imperial' ? 'imperial' : 'metric'
}

export function parsePositiveNumber(value: string): number | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  const n = Number(trimmed)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

export function cmToStorageString(cm: number): string {
  return String(Math.round((cm + Number.EPSILON) * 10) / 10)
}

export function kgToStorageString(kg: number): string {
  return String(Math.round((kg + Number.EPSILON) * 100) / 100)
}

export function heightCmToFeetInchStrings(heightCm: string): {
  feet: string
  inches: string
} {
  const cm = parsePositiveNumber(heightCm)
  if (cm == null) return { feet: '', inches: '' }
  const { feet, inches } = cmToFeetInches(cm)
  return { feet: String(feet), inches: String(inches) }
}

export function feetInchStringsToHeightCm(feet: string, inches: string): string {
  const f = parsePositiveNumber(feet) ?? 0
  const i = parsePositiveNumber(inches) ?? 0
  if (f === 0 && i === 0 && !feet.trim() && !inches.trim()) return ''
  const cm = feetInchesToCm(f, i)
  return cmToStorageString(cm)
}

export function kgToLbString(weightKg: string): string {
  const kg = parsePositiveNumber(weightKg)
  if (kg == null) return ''
  return String(kgToLb(kg))
}

export function lbStringToKg(lb: string): string {
  const n = parsePositiveNumber(lb)
  if (n == null) return ''
  return kgToStorageString(lbToKg(n))
}

export function formatHeightForUnit(
  cm: number | null | undefined,
  unit: BodyMetricUnit,
): string | null {
  if (cm == null || !Number.isFinite(cm) || cm <= 0) return null
  if (unit === 'metric') return `${Math.round(cm)} cm`
  const { feet, inches } = cmToFeetInches(cm)
  return `${feet}'${inches}"`
}

export function formatWeightForUnit(
  kg: number | null | undefined,
  unit: BodyMetricUnit,
): string | null {
  if (kg == null || !Number.isFinite(kg) || kg <= 0) return null
  if (unit === 'metric') return `${kg} kg`
  return `${kgToLb(kg)} lb`
}
