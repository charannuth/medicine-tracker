export type BodyMetricUnit = 'metric' | 'imperial'

export function normalizeBodyMetricUnit(value: string | null | undefined): BodyMetricUnit {
  return value === 'imperial' ? 'imperial' : 'metric'
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

