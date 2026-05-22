/**
 * NIH RxNorm (RxNav) — free, no API key. Used for drug name autocomplete.
 * @see https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html
 */

const RXNORM_APPROXIMATE_URL = 'https://rxnav.nlm.nih.gov/REST/approximateTerm.json'

const NOISE_SUFFIXES = [
  ' pill',
  ' oral product',
  ' oral tablet',
  ' oral capsule',
  ' pack',
  ' inhalant',
  ' injectable',
  ' chewing gum',
  ' topical',
  ' ophthalmic',
]

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

function isSimpleConsumerName(name: string): boolean {
  const lower = name.toLowerCase()
  if (NOISE_SUFFIXES.some((suffix) => lower.endsWith(suffix))) return false
  if (lower.includes(' / ')) return false
  if (name.length > 48) return false
  return true
}

/** Pull brand from strings like "escitalopram Oral Tablet [Lexapro]". */
function extractDisplayNames(rxName: string): string[] {
  const trimmed = rxName.trim()
  const out: string[] = []
  const bracket = /\[([^\]]+)\]\s*$/.exec(trimmed)
  if (bracket?.[1]) {
    out.push(bracket[1].trim())
  }
  if (isSimpleConsumerName(trimmed) && !trimmed.includes('[')) {
    out.push(trimmed)
  }
  return out
}

function rankName(name: string, query: string): number {
  const q = query.toLowerCase()
  const n = name.toLowerCase()
  if (n === q) return 0
  if (n.startsWith(q)) return 1
  if (n.includes(q)) return 2
  return 3
}

/** Search RxNorm for ingredient, brand, and synonym names matching the query. */
export async function searchRxNormDrugNames(
  query: string,
  maxEntries = 12,
  signal?: AbortSignal,
): Promise<string[]> {
  const term = query.trim()
  if (term.length < 2) return []

  const url = new URL(RXNORM_APPROXIMATE_URL)
  url.searchParams.set('term', term)
  url.searchParams.set('maxEntries', '25')
  url.searchParams.set('option', '1')

  const res = await fetch(url.toString(), { signal })
  if (!res.ok) return []

  const data = (await res.json()) as ApproximateTermResponse
  const candidates = normalizeCandidates(data.approximateGroup?.candidate)

  const scored: { name: string; rank: number }[] = []
  const seen = new Set<string>()

  for (const candidate of candidates) {
    const rawName = candidate.name?.trim()
    if (!rawName) continue

    for (const display of extractDisplayNames(rawName)) {
      const key = display.toLowerCase()
      if (seen.has(key)) continue
      seen.add(key)
      scored.push({ name: display, rank: rankName(display, term) })
    }
  }

  scored.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))

  return scored.slice(0, maxEntries).map((s) => s.name)
}
