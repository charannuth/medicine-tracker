import allergyData from '../data/drug-allergy-crossrefs.json'
import { canonicalDrugName, resolveDrugNameViaRxNorm } from './drugInteractions'

export type AllergyWarning = {
  category: string
  allergyLabel: string
  userAllergyText: string
  drugName: string
  severity: 'major' | 'moderate'
  description: string
  management: string
}

type AllergyCategory = {
  label: string
  description: string
  management: string
}

type AllergyDataFile = {
  categories: Record<string, AllergyCategory>
  userAllergyAliases: Record<string, string[]>
  drugs: Record<string, string[]>
}

const DATA = allergyData as AllergyDataFile

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Map free-text allergy entries to internal category keys. */
export function resolveUserAllergyCategories(userAllergies: string[]): Map<string, string> {
  const matched = new Map<string, string>()

  for (const raw of userAllergies) {
    const norm = normalizeToken(raw)
    if (!norm) continue

    for (const [category, aliases] of Object.entries(DATA.userAllergyAliases)) {
      if (matched.has(category)) continue
      const hit = aliases.some(
        (alias) => norm === alias || norm.includes(alias) || alias.includes(norm),
      )
      if (hit || norm === category.replace(/_/g, ' ')) {
        matched.set(category, raw.trim())
      }
    }

    if (DATA.categories[norm.replace(/\s+/g, '_')]) {
      matched.set(norm.replace(/\s+/g, '_'), raw.trim())
    }
  }

  return matched
}

async function resolveDrugCanonical(drugName: string): Promise<string | null> {
  const local = canonicalDrugName(drugName)
  if (local) return local
  return resolveDrugNameViaRxNorm(drugName)
}

export async function checkDrugAllergies(
  drugName: string,
  userAllergies: string[],
): Promise<AllergyWarning[]> {
  const trimmed = drugName.trim()
  if (!trimmed || userAllergies.length === 0) return []

  const userCategories = resolveUserAllergyCategories(userAllergies)
  if (userCategories.size === 0) return []

  const canonical = await resolveDrugCanonical(trimmed)
  if (!canonical) return []

  const drugCategories = DATA.drugs[canonical] ?? []
  if (drugCategories.length === 0) return []

  const warnings: AllergyWarning[] = []

  for (const category of drugCategories) {
    const userText = userCategories.get(category)
    if (!userText) continue

    const meta = DATA.categories[category]
    if (!meta) continue

    warnings.push({
      category,
      allergyLabel: meta.label,
      userAllergyText: userText,
      drugName: trimmed,
      severity: category === 'penicillin' || category === 'sulfa' ? 'major' : 'moderate',
      description: meta.description,
      management: meta.management,
    })
  }

  return warnings
}

export function hasAllergyWarnings(warnings: AllergyWarning[]): boolean {
  return warnings.length > 0
}

export const COMMON_ALLERGY_SUGGESTIONS = [
  'Penicillin',
  'Sulfa drugs',
  'Ibuprofen / NSAIDs',
  'Aspirin',
  'Codeine',
  'Latex',
  'Iodine / contrast dye',
  'Shellfish',
  'Peanuts',
  'Bee stings',
] as const

export const COMMON_CONDITION_SUGGESTIONS = [
  'Diabetes',
  'Hypertension',
  'Asthma',
  'Heart disease',
  'Kidney disease',
  'Liver disease',
  'Thyroid disorder',
  'Depression',
  'Anxiety',
  'GERD',
  'COPD',
  'Epilepsy',
] as const

export const BLOOD_TYPE_OPTIONS = [
  { value: '', label: 'Not specified' },
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A−' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B−' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB−' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O−' },
  { value: 'unknown', label: 'Unknown' },
] as const
