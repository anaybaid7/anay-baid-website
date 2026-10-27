// Turns the free-text periods in data.ts ("May 2025 to August 2025",
// "Spring 2026 to Present") into month indexes so the career timeline can
// draw them to scale. Waterloo terms: Winter Jan-Apr, Spring May-Aug,
// Fall Sep-Dec.

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
const TERMS: Record<string, number> = { winter: 0, spring: 4, summer: 4, fall: 8, autumn: 8 }

// months since Jan 2000, so ranges are easy to subtract
export function monthIndex(year: number, month: number) {
  return (year - 2000) * 12 + month
}

function parsePoint(text: string, end: boolean, now: Date): number | null {
  const t = text.trim().toLowerCase()
  if (t === 'present' || t === 'now') return monthIndex(now.getFullYear(), now.getMonth())
  const year = Number(t.match(/\d{4}/)?.[0])
  if (!year) return null
  const word = t.replace(/\d{4}/, '').trim()
  const m = MONTHS.indexOf(word)
  if (m >= 0) return monthIndex(year, m)
  if (word in TERMS) return monthIndex(year, TERMS[word] + (end ? 3 : 0))
  // free text around the date, like "uOttaHack 5, March 2023" or "Let's Connect, Summer 2026"
  const words = word.split(/[^a-z]+/)
  const inner = MONTHS.findIndex((name) => words.includes(name))
  if (inner >= 0) return monthIndex(year, inner)
  const term = words.find((w) => w in TERMS)
  if (term) return monthIndex(year, TERMS[term] + (end ? 3 : 0))
  return monthIndex(year, end ? 11 : 0)
}

export function parsePeriod(period: string, now = new Date()): { start: number; end: number } | null {
  const [a, b = a] = period.split(/\s+to\s+/i)
  const start = parsePoint(a, false, now)
  const end = parsePoint(b, true, now)
  if (start === null || end === null || end < start) return null
  return { start, end }
}

export function monthLabel(index: number) {
  const year = 2000 + Math.floor(index / 12)
  return `${MONTHS[index % 12].slice(0, 3).replace(/^./, (c) => c.toUpperCase())} ${year}`
}
