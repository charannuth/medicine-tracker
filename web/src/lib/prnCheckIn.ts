export type PrnDoseLogPayload = {
  amount: string
  symptoms: string[]
  reason: string
  notes: string
}

export function emptyPrnDoseLogPayload(): PrnDoseLogPayload {
  return {
    amount: '',
    symptoms: [],
    reason: '',
    notes: '',
  }
}

export function isPrnLogReady(payload: PrnDoseLogPayload): boolean {
  return Boolean(payload.amount.trim())
}

export function formatPrnDoseSummary(log: {
  logged_amount: string | null
  prn_symptoms?: string[] | null
  prn_reason?: string | null
}): string {
  const parts: string[] = []
  const amount = log.logged_amount?.trim()
  if (amount) parts.push(amount)
  if (log.prn_reason?.trim()) parts.push(log.prn_reason.trim())
  const symptoms = log.prn_symptoms ?? []
  if (symptoms.length > 0) {
    const shown = symptoms.slice(0, 2).join(', ')
    parts.push(symptoms.length > 2 ? `${shown}…` : shown)
  }
  return parts.join(' · ')
}
