import interactionData from '../data/drug-interactions.json'

export type InteractionSeverity = 'major' | 'moderate' | 'minor'

export type FoundInteraction = {
  drugA: string
  drugB: string
  displayA: string
  displayB: string
  severity: InteractionSeverity
  description: string
  management: string
}

export type InteractionCheckResult = {
  checkedAt: string
  inputNames: string[]
  resolved: { original: string; canonical: string | null }[]
  interactions: FoundInteraction[]
  pairCount: number
}

type InteractionPair = {
  a: string
  b: string
  severity: InteractionSeverity
  description: string
  management: string
}

const ALIASES = interactionData.aliases as Record<string, string>
const PAIRS = interactionData.pairs as InteractionPair[]

const pairIndex = new Map<string, InteractionPair>()

for (const pair of PAIRS) {
  const key = pairKey(pair.a, pair.b)
  pairIndex.set(key, pair)
}

function pairKey(a: string, b: string): string {
  return [a, b].sort().join('|')
}

function normalizeToken(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

export function canonicalDrugName(name: string): string | null {
  const token = normalizeToken(name)
  if (!token) return null
  if (ALIASES[token]) return ALIASES[token]
  if (pairIndexHasDrug(token)) return token
  return null
}

function pairIndexHasDrug(drug: string): boolean {
  for (const pair of PAIRS) {
    if (pair.a === drug || pair.b === drug) return true
  }
  return false
}

export async function resolveDrugNameViaRxNorm(name: string): Promise<string | null> {
  const local = canonicalDrugName(name)
  if (local) return local

  try {
    const termRes = await fetch(
      `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(name.trim())}&maxEntries=1`,
    )
    if (!termRes.ok) return null

    const termData = (await termRes.json()) as {
      approximateGroup?: { candidate?: { rxcui?: string }[] }
    }
    const rxcui = termData.approximateGroup?.candidate?.[0]?.rxcui
    if (!rxcui) return null

    const propRes = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/property.json?propName=RxNorm%20Name`,
    )
    if (!propRes.ok) return null

    const propData = (await propRes.json()) as {
      propConceptGroup?: { propConcept?: { propValue?: string }[] }
    }
    const rxName = propData.propConceptGroup?.propConcept?.[0]?.propValue
    if (!rxName) return null

    return canonicalDrugName(rxName) ?? normalizeToken(rxName)
  } catch {
    return null
  }
}

export async function resolveDrugNames(names: string[]): Promise<
  { original: string; canonical: string | null }[]
> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))]
  const resolved: { original: string; canonical: string | null }[] = []

  for (const original of unique) {
    const canonical = await resolveDrugNameViaRxNorm(original)
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

  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const a = unique[i]
      const b = unique[j]
      const pair = pairIndex.get(pairKey(a, b))
      if (!pair) continue

      found.push({
        drugA: a,
        drugB: b,
        displayA: displayByCanonical.get(a) ?? a,
        displayB: displayByCanonical.get(b) ?? b,
        severity: pair.severity,
        description: pair.description,
        management: pair.management,
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
  const interactions = findInteractionsAmongCanonical(
    canonicalList,
    displayByCanonical,
  )

  const pairCount =
    canonicalList.length < 2
      ? 0
      : (canonicalList.length * (canonicalList.length - 1)) / 2

  return {
    checkedAt: new Date().toISOString(),
    inputNames: medicationNames,
    resolved,
    interactions,
    pairCount,
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
