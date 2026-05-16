export function formatDoseDisplay(med: {
  dose_pills: string | null
  dose_mg: string | null
}): string {
  const pills = med.dose_pills?.trim() ?? ''
  const mg = med.dose_mg?.trim() ?? ''
  if (pills && mg) return `${pills} · ${mg}`
  return pills || mg
}

export function normalizeDoseFields(pills: string, mg: string) {
  const dose_pills = pills.trim() || null
  const dose_mg = mg.trim() || null
  if (!dose_pills && !dose_mg) {
    throw new Error('Enter an amount in pills, mg, or both.')
  }
  return { dose_pills, dose_mg }
}
