import conditionData from '../data/drug-condition-crossrefs.json'
import allergyData from '../data/drug-allergy-crossrefs.json'
import { canonicalDrugName, resolveDrugNameViaRxNorm } from './drugInteractions'

export type ConditionWarning = {
  conditionKey: string
  conditionLabel: string
  userConditionText: string
  drugName: string
  severity: 'major' | 'moderate'
  description: string
  management: string
}

type ConditionDef = {
  label: string
  aliases: string[]
  drugCategories: string[]
  severity: 'major' | 'moderate'
  description: string
  management: string
}

type ConditionDataFile = {
  conditions: Record<string, ConditionDef>
}

const CONDITIONS = (conditionData as ConditionDataFile).conditions
const DRUG_CATEGORIES = (allergyData as { drugs: Record<string, string[]> }).drugs

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function resolveUserConditionKeys(
  userConditions: string[],
): Map<string, { key: string; label: string; userText: string }> {
  const matched = new Map<string, { key: string; label: string; userText: string }>()

  for (const raw of userConditions) {
    const norm = normalizeToken(raw)
    if (!norm) continue

    for (const [key, def] of Object.entries(CONDITIONS)) {
      if (matched.has(key)) continue
      const hit = def.aliases.some(
        (alias) => norm === alias || norm.includes(alias) || alias.includes(norm),
      )
      if (hit) {
        matched.set(key, { key, label: def.label, userText: raw.trim() })
      }
    }
  }

  return matched
}

async function resolveDrugCanonical(drugName: string): Promise<string | null> {
  const local = canonicalDrugName(drugName)
  if (local) return local
  return resolveDrugNameViaRxNorm(drugName)
}

export async function checkDrugConditions(
  drugName: string,
  userConditions: string[],
): Promise<ConditionWarning[]> {
  const trimmed = drugName.trim()
  if (!trimmed || userConditions.length === 0) return []

  const userConditionMap = resolveUserConditionKeys(userConditions)
  if (userConditionMap.size === 0) return []

  const canonical = await resolveDrugCanonical(trimmed)
  if (!canonical) return []

  const drugCategories = DRUG_CATEGORIES[canonical] ?? []
  if (drugCategories.length === 0) return []

  const warnings: ConditionWarning[] = []

  for (const { key, label, userText } of userConditionMap.values()) {
    const def = CONDITIONS[key]
    if (!def) continue

    const overlap = def.drugCategories.some((cat) => drugCategories.includes(cat))
    if (!overlap) continue

    warnings.push({
      conditionKey: key,
      conditionLabel: label,
      userConditionText: userText,
      drugName: trimmed,
      severity: def.severity,
      description: def.description,
      management: def.management,
    })
  }

  return warnings
}
