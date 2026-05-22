/**
 * NIH RxNorm (RxNav) — free, no API key. Used for drug name autocomplete.
 * @see https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html
 */

const RXNORM_APPROXIMATE_URL = 'https://rxnav.nlm.nih.gov/REST/approximateTerm.json'

type ApproximateCandidate = {
  name?: string
  rxcui?: string
}

type ApproximateTermResponse = {
  approximateGroup?: {
    candidate?: ApproximateCandidate | ApproximateCandidate[]
  }
}

function normalizeCandidates(
  raw: ApproximateCandidate | ApproximateCandidate[] | undefined,
): ApproximateCandidate[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw : [raw]
}

/** Search RxNorm for ingredient, brand, and synonym names matching the query. */
export async function searchRxNormDrugNames(
  query: string,
  maxEntries = 10,
  signal?: AbortSignal,
): Promise<string[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const url = new URL(RXNORM_APPROXIMATE_URL)
  url.searchParams.set('term', term)
  url.searchParams.set('maxEntries', String(Math.min(100, Math.max(1, maxEntries))))
  // Active concepts only (ingredients, brands, synonyms in current RxNorm)
  url.searchParams.set('option', '1')

  const res = await fetch(url.toString(), { signal })
  if (!res.ok) return []

  const data = (await res.json()) as ApproximateTermResponse
  const candidates = normalizeCandidates(data.approximateGroup?.candidate)

  const names: string[] = []
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const name = candidate.name?.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
    if (names.length >= maxEntries) break
  }

  return names
}
