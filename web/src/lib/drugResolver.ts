import brandMedications from '../data/brand-medications.json'
import interactionData from '../data/drug-interactions.json'
import allergyData from '../data/drug-allergy-crossrefs.json'

type BrandEntry = { name: string; genericName: string }

const JSON_ALIASES = interactionData.aliases as Record<string, string>
const PAIRS = interactionData.pairs as { a: string; b: string }[]
const ALLERGY_DRUGS = (allergyData as { drugs: Record<string, string[]> }).drugs

/** All canonical drug keys used across safety databases. */
export const KNOWN_DRUG_KEYS = new Set<string>()

function registerDrugKey(key: string) {
  const norm = normalizeToken(key)
  if (norm) KNOWN_DRUG_KEYS.add(norm)
}

for (const pair of PAIRS) {
  registerDrugKey(pair.a)
  registerDrugKey(pair.b)
}
for (const members of Object.values(
  (interactionData as { drugClasses?: Record<string, string[]> }).drugClasses ?? {},
)) {
  for (const member of members) {
    registerDrugKey(member)
  }
}
const classRules =
  (interactionData as { classRules?: { a: { drug?: string }; b: { drug?: string } }[] })
    .classRules ?? []
for (const rule of classRules) {
  if (rule.a.drug) registerDrugKey(rule.a.drug)
  if (rule.b.drug) registerDrugKey(rule.b.drug)
}
for (const key of Object.keys(ALLERGY_DRUGS)) {
  registerDrugKey(key)
}
for (const value of Object.values(JSON_ALIASES)) {
  registerDrugKey(value)
}

/** Brand + JSON aliases merged once at module load. */
const ALIAS_TO_CANONICAL = new Map<string, string>()

function registerAlias(alias: string, canonical: string) {
  const a = normalizeToken(alias)
  const c = normalizeToken(canonical)
  if (!a || !c) return
  ALIAS_TO_CANONICAL.set(a, c)
  registerDrugKey(c)
}

for (const [alias, canonical] of Object.entries(JSON_ALIASES)) {
  registerAlias(alias, canonical)
}

for (const entry of brandMedications as BrandEntry[]) {
  registerAlias(entry.name, entry.genericName)
  registerAlias(entry.genericName, entry.genericName)
  const primary = entry.genericName.split(/[-/]/)[0]?.trim()
  if (primary && primary !== entry.genericName) {
    registerAlias(entry.genericName, primary)
  }
}

const FORM_SUFFIXES = [
  ' oral product',
  ' oral tablet',
  ' oral capsule',
  ' extended release',
  ' er tablet',
  ' tablet',
  ' capsule',
  ' solution',
  ' suspension',
  ' injection',
  ' inhalant',
  ' inhalation',
  ' topical',
  ' ophthalmic',
  ' chewable',
  ' pack',
  ' pill',
]

const DOSE_PATTERN =
  /\s+\d+(\.\d+)?\s*(mg|mcg|g|ml|l|units?|iu|meq|%|mcg\/actuation)\b.*$/i

export function normalizeToken(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ')
}

function stripBrandedSuffix(name: string): string {
  return name.replace(/\s*\[[^\]]+\]\s*$/, '').trim()
}

function stripFormAndDose(name: string): string {
  let token = stripBrandedSuffix(normalizeToken(name))
  token = token.replace(DOSE_PATTERN, '').trim()
  for (const suffix of FORM_SUFFIXES) {
    if (token.endsWith(suffix)) {
      token = token.slice(0, -suffix.length).trim()
    }
  }
  return token
}

function candidateTokens(name: string): string[] {
  const raw = normalizeToken(name)
  if (!raw) return []

  const out: string[] = []
  const seen = new Set<string>()
  const push = (value: string) => {
    const v = normalizeToken(value)
    if (!v || seen.has(v)) return
    seen.add(v)
    out.push(v)
  }

  push(raw)
  push(stripBrandedSuffix(raw))
  push(stripFormAndDose(raw))
  push(stripBrandedSuffix(stripFormAndDose(raw)))

  const words = stripFormAndDose(raw).split(/\s+/).filter(Boolean)
  for (let len = words.length; len >= 1; len--) {
    push(words.slice(0, len).join(' '))
  }

  const comboParts = stripFormAndDose(raw).split(/[-/]/).map((p) => p.trim())
  for (const part of comboParts) {
    push(part)
  }

  return out
}

function aliasForToken(token: string): string | null {
  return ALIAS_TO_CANONICAL.get(token) ?? null
}

function knownKeyForToken(token: string): string | null {
  if (KNOWN_DRUG_KEYS.has(token)) return token
  const aliased = aliasForToken(token)
  if (aliased && KNOWN_DRUG_KEYS.has(aliased)) return aliased
  return null
}

/** Resolve a drug name to a canonical key using local aliases and fuzzy token matching. */
export function resolveDrugLocally(name: string): string | null {
  for (const token of candidateTokens(name)) {
    const aliased = aliasForToken(token)
    if (aliased) return aliased

    const known = knownKeyForToken(token)
    if (known) return known
  }

  return null
}

/** @deprecated Use resolveDrugLocally — kept for existing imports. */
export function canonicalDrugName(name: string): string | null {
  return resolveDrugLocally(name)
}

type RxNormRelatedConcept = { tty?: string; name?: string; rxcui?: string }

async function fetchRxNormIngredientNames(rxcui: string): Promise<string[]> {
  const names: string[] = []
  try {
    const relatedRes = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/related.json?tty=IN+BN+SCD+SBD`,
    )
    if (relatedRes.ok) {
      const relatedData = (await relatedRes.json()) as {
        relatedGroup?: {
          conceptGroup?: { tty?: string; conceptProperties?: RxNormRelatedConcept[] }[]
        }
      }
      for (const group of relatedData.relatedGroup?.conceptGroup ?? []) {
        for (const concept of group.conceptProperties ?? []) {
          if (concept.name) names.push(concept.name)
        }
      }
    }

    const propRes = await fetch(
      `https://rxnav.nlm.nih.gov/REST/rxcui/${rxcui}/property.json?propName=RxNorm%20Name`,
    )
    if (propRes.ok) {
      const propData = (await propRes.json()) as {
        propConceptGroup?: { propConcept?: { propValue?: string }[] }
      }
      const rxName = propData.propConceptGroup?.propConcept?.[0]?.propValue
      if (rxName) names.push(rxName)
    }
  } catch {
    return names
  }

  return names
}

function resolveFromNameCandidates(names: string[]): string | null {
  for (const name of names) {
    const local = resolveDrugLocally(name)
    if (local) return local
  }
  return null
}

/** Resolve via local map first, then RxNorm ingredient / name lookup. */
export async function resolveDrugViaRxNorm(name: string): Promise<string | null> {
  const local = resolveDrugLocally(name)
  if (local) return local

  const trimmed = name.trim()
  if (!trimmed) return null

  try {
    const termRes = await fetch(
      `https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=${encodeURIComponent(trimmed)}&maxEntries=5&option=1`,
    )
    if (!termRes.ok) return null

    const termData = (await termRes.json()) as {
      approximateGroup?: { candidate?: { rxcui?: string; name?: string }[] }
    }
    const candidates = termData.approximateGroup?.candidate ?? []

    const rxNames: string[] = []
    for (const candidate of candidates.slice(0, 3)) {
      if (candidate.name) rxNames.push(candidate.name)
      if (candidate.rxcui) {
        rxNames.push(...(await fetchRxNormIngredientNames(candidate.rxcui)))
      }
    }

    return resolveFromNameCandidates(rxNames)
  } catch {
    return null
  }
}
