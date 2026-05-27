import safetyData from '../data/drug-safety.json'
import { checkDrugAllergies, type AllergyWarning } from './allergyCheck'
import { checkDrugConditions, type ConditionWarning } from './conditionCheck'
import {
  checkMedicationInteractions,
  interactionsInvolvingDrug,
  type FoundInteraction,
} from './drugInteractions'
import { resolveDrugLocally, resolveDrugViaRxNorm } from './drugResolver'

const SUBSTANCE_KEYS = ['alcohol', 'cannabis', 'tobacco'] as const
export type SubstanceKey = (typeof SUBSTANCE_KEYS)[number]

type DrugSafetyProfile = {
  sideEffects: string[]
  pregnancy: string
  substances: Partial<Record<SubstanceKey, string>>
}

type SafetyDataFile = {
  substanceLabels: Record<SubstanceKey, string>
  defaultPregnancy: string
  defaultSideEffects: string
  defaultSubstance: string
  drugs: Record<string, DrugSafetyProfile>
}

const DATA = safetyData as SafetyDataFile

export type SubstanceWarning = {
  substance: SubstanceKey
  label: string
  severity: FoundInteraction['severity'] | 'info'
  description: string
  management: string
}

export type MedicationSafetyReview = {
  drugName: string
  canonical: string | null
  existingMedInteractions: FoundInteraction[]
  allergyWarnings: AllergyWarning[]
  conditionWarnings: ConditionWarning[]
  substanceWarnings: SubstanceWarning[]
  sideEffects: string[]
  pregnancy: string
  checkedExistingCount: number
}

function profileForCanonical(canonical: string | null): DrugSafetyProfile | null {
  if (!canonical) return null
  return DATA.drugs[canonical] ?? null
}

function substanceWarningsForDrug(
  drugName: string,
  canonical: string | null,
  interactions: FoundInteraction[],
): SubstanceWarning[] {
  const profile = profileForCanonical(canonical)
  const warnings: SubstanceWarning[] = []

  for (const key of SUBSTANCE_KEYS) {
    const fromPair = interactions.find((i) => {
      if (i.drugA !== key && i.drugB !== key) return false
      const other = i.drugA === key ? i.drugB : i.drugA
      if (canonical) return other === canonical
      return (
        i.displayA.toLowerCase() === drugName.toLowerCase() ||
        i.displayB.toLowerCase() === drugName.toLowerCase()
      )
    })

    if (fromPair) {
      warnings.push({
        substance: key,
        label: DATA.substanceLabels[key],
        severity: fromPair.severity,
        description: fromPair.description,
        management: fromPair.management,
      })
      continue
    }

    const custom = profile?.substances?.[key]
    if (custom) {
      warnings.push({
        substance: key,
        label: DATA.substanceLabels[key],
        severity: 'info',
        description: custom,
        management: 'Discuss use with your clinician or pharmacist.',
      })
    }
  }

  return warnings
}

export async function buildMedicationSafetyReview(
  drugName: string,
  existingMedicationNames: string[],
  userAllergies: string[] = [],
  userConditions: string[] = [],
): Promise<MedicationSafetyReview> {
  const trimmed = drugName.trim()
  const others = existingMedicationNames
    .map((n) => n.trim())
    .filter((n) => n && n.toLowerCase() !== trimmed.toLowerCase())

  const allForCheck = trimmed ? [...others, trimmed] : others
  const substanceCheck = trimmed
    ? await checkMedicationInteractions([trimmed, ...SUBSTANCE_KEYS])
  : await checkMedicationInteractions([...SUBSTANCE_KEYS])

  const medListCheck =
    allForCheck.length >= 2
      ? await checkMedicationInteractions(allForCheck)
      : null

  const resolvedNew =
    resolveDrugLocally(trimmed) ?? (await resolveDrugViaRxNorm(trimmed))
  const canonical = resolvedNew

  const profile = profileForCanonical(canonical)

  const existingMedInteractions =
    medListCheck && trimmed
      ? interactionsInvolvingDrug(
          medListCheck.interactions,
          trimmed,
          medListCheck.resolved,
        )
      : []

  const [allergyWarnings, conditionWarnings] = await Promise.all([
    checkDrugAllergies(trimmed, userAllergies),
    checkDrugConditions(trimmed, userConditions),
  ])

  return {
    drugName: trimmed,
    canonical,
    existingMedInteractions,
    allergyWarnings,
    conditionWarnings,
    substanceWarnings: substanceWarningsForDrug(
      trimmed,
      canonical,
      substanceCheck.interactions,
    ),
    sideEffects: profile?.sideEffects ?? [DATA.defaultSideEffects],
    pregnancy: profile?.pregnancy ?? DATA.defaultPregnancy,
    checkedExistingCount: others.length,
  }
}

export function hasSafetyAlerts(review: MedicationSafetyReview): boolean {
  return (
    review.allergyWarnings.length > 0 ||
    review.conditionWarnings.length > 0 ||
    review.existingMedInteractions.length > 0 ||
    review.substanceWarnings.some((w) => w.severity === 'major' || w.severity === 'moderate')
  )
}
