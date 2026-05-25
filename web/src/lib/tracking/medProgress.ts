import { fetchMedicationsWithStatus, todayDoseTotals } from '../medications'
import { fetchStreakStats, type StreakStats } from '../streaks'
import { getRefillAlerts, type RefillAlert } from '../refills'
import type { MedicationWithStatus } from '../types'

export type MedProgressSnapshot = {
  medications: MedicationWithStatus[]
  dosesTaken: number
  dosesTotal: number
  streak: StreakStats | null
  refillAlerts: RefillAlert[]
}

export async function fetchMedProgressSnapshot(
  userId: string,
): Promise<MedProgressSnapshot> {
  const [medications, streak] = await Promise.all([
    fetchMedicationsWithStatus(userId),
    fetchStreakStats(userId).catch(() => null),
  ])
  const { taken, total } = todayDoseTotals(medications)
  return {
    medications,
    dosesTaken: taken,
    dosesTotal: total,
    streak,
    refillAlerts: getRefillAlerts(medications),
  }
}
