export type InventoryUnit = {
  singular: string
  plural: string
}

type MedForInventory = {
  dose_pills: string | null
  medication_form?: string | null
  medication_route?: string | null
}

const KNOWN_UNITS: Record<string, InventoryUnit> = {
  puff: { singular: 'puff', plural: 'puffs' },
  puffs: { singular: 'puff', plural: 'puffs' },
  spray: { singular: 'spray', plural: 'sprays' },
  sprays: { singular: 'spray', plural: 'sprays' },
  pill: { singular: 'pill', plural: 'pills' },
  pills: { singular: 'pill', plural: 'pills' },
  tablet: { singular: 'tablet', plural: 'tablets' },
  tablets: { singular: 'tablet', plural: 'tablets' },
  capsule: { singular: 'capsule', plural: 'capsules' },
  capsules: { singular: 'capsule', plural: 'capsules' },
  chewable: { singular: 'chewable', plural: 'chewables' },
  chewables: { singular: 'chewable', plural: 'chewables' },
  patch: { singular: 'patch', plural: 'patches' },
  patches: { singular: 'patch', plural: 'patches' },
  application: { singular: 'application', plural: 'applications' },
  applications: { singular: 'application', plural: 'applications' },
  dose: { singular: 'dose', plural: 'doses' },
  doses: { singular: 'dose', plural: 'doses' },
  unit: { singular: 'unit', plural: 'units' },
  units: { singular: 'unit', plural: 'units' },
  drop: { singular: 'drop', plural: 'drops' },
  drops: { singular: 'drop', plural: 'drops' },
  injection: { singular: 'injection', plural: 'injections' },
  injections: { singular: 'injection', plural: 'injections' },
  pen: { singular: 'pen', plural: 'pens' },
  pens: { singular: 'pen', plural: 'pens' },
}

const FORM_DEFAULT_UNITS: Record<string, InventoryUnit> = {
  pill: KNOWN_UNITS.pill,
  capsule: KNOWN_UNITS.capsule,
  tablet: KNOWN_UNITS.tablet,
  chewable: KNOWN_UNITS.chewable,
  'spray-oral': KNOWN_UNITS.spray,
  'spray-topical': KNOWN_UNITS.spray,
  patch: KNOWN_UNITS.patch,
  'prefilled-pen': KNOWN_UNITS.dose,
  'auto-injector': KNOWN_UNITS.dose,
  subcutaneous: KNOWN_UNITS.injection,
  intramuscular: KNOWN_UNITS.injection,
  intravenous: KNOWN_UNITS.injection,
}

/** Units taken per “mark taken” — from dose_pills (e.g. "2 puffs" → 2). */
export function getDoseDeductionAmount(dosePills: string | null | undefined): number {
  const trimmed = dosePills?.trim() ?? ''
  if (!trimmed) return 1

  const match = trimmed.match(/^(\d+(?:\.\d+)?)/)
  if (!match) return 1

  const n = parseFloat(match[1])
  if (!Number.isFinite(n) || n <= 0) return 1
  return n
}

function unitFromDosePillsText(dosePills: string | null | undefined): InventoryUnit | null {
  const trimmed = dosePills?.trim() ?? ''
  const match = trimmed.match(/^\d+(?:\.\d+)?\s+(.+)$/i)
  if (!match) return null

  const raw = match[1].trim().toLowerCase()
  if (KNOWN_UNITS[raw]) return KNOWN_UNITS[raw]

  if (raw.endsWith('s') && KNOWN_UNITS[raw.slice(0, -1)]) {
    return KNOWN_UNITS[raw.slice(0, -1)]
  }

  if (raw.endsWith('s')) {
    return { singular: raw.slice(0, -1), plural: raw }
  }
  return { singular: raw, plural: `${raw}s` }
}

export function getInventoryUnit(med: MedForInventory): InventoryUnit {
  const fromDose = unitFromDosePillsText(med.dose_pills)
  if (fromDose) return fromDose

  const form = med.medication_form?.trim()
  if (form && FORM_DEFAULT_UNITS[form]) {
    return FORM_DEFAULT_UNITS[form]
  }

  if (med.medication_route === 'injection') {
    return KNOWN_UNITS.dose
  }

  return KNOWN_UNITS.pill
}

export function formatInventoryCount(
  count: number,
  med: MedForInventory,
): string {
  const unit = getInventoryUnit(med)
  const word = count === 1 ? unit.singular : unit.plural
  const display = Number.isInteger(count) ? String(count) : count.toFixed(1)
  return `${display} ${word}`
}

export function formatInventoryRemaining(
  count: number,
  med: MedForInventory,
): string {
  return `${formatInventoryCount(count, med)} remaining`
}

export function inventoryUnitLabel(med: MedForInventory, plural = true): string {
  const unit = getInventoryUnit(med)
  return plural ? unit.plural : unit.singular
}
