/** Parse YYYY-MM-DD into a Date at local noon. */
export function parseYmd(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d, 12, 0, 0)
}

export function formatYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function addDaysToYmd(dateStr: string, days: number): string {
  const d = parseYmd(dateStr)
  d.setDate(d.getDate() + days)
  return formatYmd(d)
}

export function daysBetweenYmd(startStr: string, endStr: string): number {
  const start = parseYmd(startStr).getTime()
  const end = parseYmd(endStr).getTime()
  return Math.round((end - start) / (24 * 60 * 60 * 1000))
}

