import { formatInventoryCount } from './inventory'
import type { MedicationWithStatus } from './types'

const REFILL_THRESHOLD = 7

export type RefillAlert = {
  medicationId: string
  name: string
  remaining: number
  remainingLabel: string
}

export function getRefillAlerts(medications: MedicationWithStatus[]): RefillAlert[] {
  return medications
    .filter(
      (m) => m.pills_remaining != null && m.pills_remaining <= REFILL_THRESHOLD,
    )
    .map((m) => ({
      medicationId: m.id,
      name: m.name,
      remaining: m.pills_remaining!,
      remainingLabel: formatInventoryCount(m.pills_remaining!, m),
    }))
}
