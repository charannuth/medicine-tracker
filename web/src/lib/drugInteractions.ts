import interactionData from '../data/drug-interactions.json'
import {
  normalizeToken,
  resolveDrugLocally,
  resolveDrugViaRxNorm,
} from './drugResolver'

export { canonicalDrugName, resolveDrugViaRxNorm as resolveDrugNameViaRxNorm } from './drugResolver'

export type InteractionSeverity = 'major' | 'moderate' | 'minor'

export type FoundInteraction = {
  drugA: string
  drugB: string
  displayA: string
  displayB: string
  severity: InteractionSeverity
  description: string
  management: string
  /** True when matched via a class rule rather than an explicit pair row. */
  fromClassRule?: boolean
}

export type InteractionCheckResult = {
  checkedAt: string
  inputNames: string[]
  resolved: { original: string; canonical: string | null }[]
  interactions: FoundInteraction[]
  pairCount: number
  mappedCount: number
  unmappedCount: number
}

type InteractionPair = {
  a: string
  b: string
  severity: InteractionSeverity
  description: string
  management: string
}

type ClassSide = { class?: string; drug?: string }

type ClassInteractionRule = {
  a: ClassSide
  b: ClassSide
  severity: InteractionSeverity
  description: string
  management: string
}

const PAIRS = interactionData.pairs as InteractionPair[]
const DRUG_CLASSES = (interactionData.drugClasses ?? {}) as Record<string, string[]>
const CLASS_RULES = (interactionData.classRules ?? []) as ClassInteractionRule[]

const pairIndex = new Map<string, InteractionPair>()
const classMembers = new Map<string, Set<string>>()

for (const [classKey, members] of Object.entries(DRUG_CLASSES)) {
  classMembers.set(classKey, new Set(members.map(normalizeToken)))
}

for (const pair of PAIRS) {
  pairIndex.set(pairKey(pair.a, pair.b), pair)
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

function sideMatchesDrug(side: ClassSide, drug: string): boolean {
  if (side.drug && normalizeToken(side.drug) === drug) return true
  if (side.class) {
    const members = classMembers.get(side.class)
    return members?.has(drug) ?? false
  }
  return false
}

function findClassRule(a: string, b: string): ClassInteractionRule | null {
  for (const rule of CLASS_RULES) {
    const forward =
      sideMatchesDrug(rule.a, a) && sideMatchesDrug(rule.b, b)
    const reverse =
      sideMatchesDrug(rule.a, b) && sideMatchesDrug(rule.b, a)
    if (forward || reverse) return rule
  }
  return null
}

function lookupInteraction(a: string, b: string): {
  severity: InteractionSeverity
  description: string
  management: string
  fromClassRule: boolean
} | null {
  const direct = pairIndex.get(pairKey(a, b))
  if (direct) {
    return {
      severity: direct.severity,
      description: direct.description,
      management: direct.management,
      fromClassRule: false,
    }
  }

  const classRule = findClassRule(a, b)
  if (classRule) {
    return {
      severity: classRule.severity,
      description: classRule.description,
      management: classRule.management,
      fromClassRule: true,
    }
  }

  return null
}

export async function resolveDrugNames(names: string[]): Promise<
  { original: string; canonical: string | null }[]
> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  const resolved: { original: string; canonical: string | null }[] = []

  for (const original of unique) {
    const local = resolveDrugLocally(original)
    const canonical = local ?? (await resolveDrugViaRxNorm(original))
    resolved.push({ original, canonical })
  }

  return resolved
}

export function findInteractionsAmongCanonical(
  canonicalNames: string[],
  displayByCanonical: Map<string, string>,
): FoundInteraction[] {
  const unique = [...new Set(canonicalNames.filter(Boolean))]
  const found: FoundInteraction[] = []
  const seen = new Set<string>()

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i]
      const b = unique[j]
      const key = pairKey(a, b)
      if (seen.has(key)) continue

      const match = lookupInteraction(a, b)
      if (!match) continue

      seen.add(key)
      found.push({
        drugA: a,
        drugB: b,
        displayA: displayByCanonical.get(a) ?? a,
        displayB: displayByCanonical.get(b) ?? b,
        severity: match.severity,
        description: match.description,
        management: match.management,
        fromClassRule: match.fromClassRule,
      })
    }
  }

  const severityOrder: Record<InteractionSeverity, number> = {
    major: 0,
    moderate: 1,
    minor: 2,
  }

  return found.sort(
    (x, y) => severityOrder[x.severity] - severityOrder[y.severity],
  )
}

function warningSignature(item: FoundInteraction): string {
  return `${item.severity}|${item.description}|${item.management}`
}

/** Merge identical class-rule warnings (e.g. albuterol + 3 beta blockers → one card). */
export function collapseDuplicateClassWarnings(
  interactions: FoundInteraction[],
): FoundInteraction[] {
  const standalone: FoundInteraction[] = []
  const classGroups = new Map<string, FoundInteraction[]>()

  for (const item of interactions) {
    if (!item.fromClassRule) {
      standalone.push(item)
      continue
    }
    const sig = warningSignature(item)
    const group = classGroups.get(sig) ?? []
    group.push(item)
    classGroups.set(sig, group)
  }

  const collapsed: FoundInteraction[] = [...standalone]

  for (const items of classGroups.values()) {
    if (items.length === 1) {
      collapsed.push(items[0])
      continue
    }

    const first = items[0]
    const anchorCanonical =
      items.every((i) => i.drugA === first.drugA) ? first.drugA : first.drugB
    const anchorDisplay =
      anchorCanonical === first.drugA ? first.displayA : first.displayB

    const partnerDisplays = [
      ...new Set(
        items.flatMap((i) =>
          i.drugA === anchorCanonical ? [i.displayB] : [i.displayA],
        ),
      ),
    ].sort((a, b) => a.localeCompare(b))

    const partnerCanonicals = [
      ...new Set(
        items.flatMap((i) =>
          i.drugA === anchorCanonical ? [i.drugB] : [i.drugA],
        ),
      ),
    ]

    collapsed.push({
      ...first,
      drugA: anchorCanonical,
      drugB: partnerCanonicals.join('+'),
      displayA: anchorDisplay,
      displayB: partnerDisplays.join(', '),
    })
  }

  const severityOrder: Record<InteractionSeverity, number> = {
    major: 0,
    moderate: 1,
    minor: 2,
  }

  return collapsed.sort(
    (x, y) => severityOrder[x.severity] - severityOrder[y.severity],
  )
}

/** Interactions involving a specific drug (by original or canonical name). */
export function interactionsInvolvingDrug(
  interactions: FoundInteraction[],
  drugName: string,
  resolved: { original: string; canonical: string | null }[],
): FoundInteraction[] {
  const norm = normalizeToken(drugName)
  const row = resolved.find((r) => normalizeToken(r.original) === norm)
  const canonical = row?.canonical

  return interactions.filter((item) => {
    if (canonical && (item.drugA === canonical || item.drugB === canonical)) {
      return true
    }
    return (
      normalizeToken(item.displayA) === norm || normalizeToken(item.displayB) === norm
    )
  })
}

export async function checkMedicationInteractions(
  medicationNames: string[],
): Promise<InteractionCheckResult> {
  const resolved = await resolveDrugNames(medicationNames)
  const displayByCanonical = new Map<string, string>()

  for (const row of resolved) {
    if (!row.canonical) continue
    if (!displayByCanonical.has(row.canonical)) {
      displayByCanonical.set(row.canonical, row.original)
    }
  }

  const canonicalList = [...displayByCanonical.keys()]
  const interactions = collapseDuplicateClassWarnings(
    findInteractionsAmongCanonical(canonicalList, displayByCanonical),
  )

  const pairCount =
    canonicalList.length < 2
      ? 0
      : (canonicalList.length * (canonicalList.length - 1)) / 2

  const mappedCount = resolved.filter((r) => r.canonical).length
  const unmappedCount = resolved.length - mappedCount

  return {
    checkedAt: new Date().toISOString(),
    inputNames: medicationNames,
    resolved,
    interactions,
    pairCount,
    mappedCount,
    unmappedCount,
  }
}

export function severityLabel(severity: InteractionSeverity): string {
  switch (severity) {
    case 'major':
      return 'Major'
    case 'moderate':
      return 'Moderate'
    case 'minor':
      return 'Minor'
  }
}
