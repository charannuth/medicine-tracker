import type { MedicationWithStatus } from './types'

const REFILL_THRESHOLD = 7

export type RefillAlert = {
  medicationId: string
  name: string
  pillsRemaining: number
}

export function getRefillAlerts(medications: MedicationWithStatus[]): RefillAlert[] {
  return medications
    .filter(
      (m) => m.pills_remaining != null && m.pills_remaining <= REFILL_THRESHOLD,
    )
    .map((m) => ({
      medicationId: m.id,
      name: m.name,
      pillsRemaining: m.pills_remaining!,
    }))
}
