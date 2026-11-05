// Pulls Canada's monthly retail e-commerce sales from the Statistics Canada
// Web Data Service, checks it, and keeps it with a log of every run. Same
// shape as the forecasting pipeline at work, on public data: fetch, validate,
// compare with what's stored, store, record what happened.

const WDS = 'https://www150.statcan.gc.ca/t1/wds/rest'
export const TABLE = 20100072 // 20-10-0072-01, retail e-commerce sales, unadjusted

export interface Member {
  memberId: number
  memberNameEn: string
}
export interface Dimension {
  dimensionPositionId: number
  dimensionNameEn: string
  member: Member[]
}
export interface Point {
  refPer: string
  value: number | null
  scalarFactorCode: number
  symbolCode: number
  statusCode: number
  releaseTime: string
}

export interface Month {
  month: string // YYYY-MM
  value: number // dollars
}
export interface Check {
  name: string
  ok: boolean
  detail: string
}
export interface Run {
  at: string
  ok: boolean
  rows: number
  checks: Check[]
  revised: { month: string; from: number; to: number }[]
  added: string[]
  error?: string
}
export interface Stored {
  series: { table: string; coordinate: string; picked: string[]; release: string }
  months: Month[]
  runs: Run[]
}

const post = async (method: string, body: unknown) => {
  const r = await fetch(`${WDS}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  if (!r.ok) throw new Error(`${method} answered ${r.status}`)
  const [first] = await r.json()
  if (first?.status !== 'SUCCESS') throw new Error(`${method} returned ${first?.status ?? 'nothing'}`)
  return first.object
}

// Find the series by name instead of hard coding member ids, so a table
// restructure fails loudly here rather than quietly returning the wrong row.
export function coordinate(dims: Dimension[]) {
  const picked: string[] = []
  const ids = [...dims]
    .sort((a, b) => a.dimensionPositionId - b.dimensionPositionId)
    .map((d) => {
      const want = /geograph/i.test(d.dimensionNameEn)
        ? (m: Member) => m.memberNameEn === 'Canada'
        : (m: Member) => /e-commerce sales$/i.test(m.memberNameEn) || /^unadjusted$/i.test(m.memberNameEn)
      const m = d.member.find(want) ?? d.member[0]
      picked.push(`${d.dimensionNameEn}: ${m.memberNameEn}`)
      return m.memberId
    })
  while (ids.length < 10) ids.push(0)
  return { coordinate: ids.join('.'), picked }
}

export async function fetchSeries(latestN = 120) {
  const meta = await post('getCubeMetadata', [{ productId: TABLE }])
  const { coordinate: coord, picked } = coordinate(meta.dimension as Dimension[])
  const data = await post('getDataFromCubePidCoordAndLatestNPeriods', [{ productId: TABLE, coordinate: coord, latestN }])
  return { coordinate: coord, picked, points: data.vectorDataPoint as Point[] }
}

const monthOf = (refPer: string) => refPer.slice(0, 7)
const next = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return mo === 12 ? `${y + 1}-01` : `${y}-${String(mo + 1).padStart(2, '0')}`
}

// The checks that decide whether a fetch is good enough to replace what's stored
export function validate(points: Point[]): { months: Month[]; checks: Check[] } {
  const usable = points.filter((p) => p.value !== null && p.symbolCode === 0)
  const months = usable.map((p) => ({ month: monthOf(p.refPer), value: (p.value as number) * 10 ** p.scalarFactorCode })).sort((a, b) => a.month.localeCompare(b.month))
  const gaps: string[] = []
  for (let i = 1; i < months.length; i++) if (next(months[i - 1].month) !== months[i].month) gaps.push(`${months[i - 1].month} to ${months[i].month}`)
  const dupes = months.length - new Set(months.map((m) => m.month)).size
  const bad = months.filter((m) => !(m.value > 0))
  // a month that moves more than 60% from the same month a year earlier is flagged, not dropped
  const jumps = months.filter((m, i) => i >= 12 && Math.abs(m.value / months[i - 12].value - 1) > 0.6).map((m) => m.month)
  const checks: Check[] = [
    { name: 'Enough history', ok: months.length >= 36, detail: `${months.length} months` },
    { name: 'No missing months', ok: gaps.length === 0, detail: gaps.length ? gaps.join(', ') : 'continuous' },
    { name: 'One value per month', ok: dupes === 0, detail: dupes ? `${dupes} duplicates` : 'no duplicates' },
    { name: 'Values above zero', ok: bad.length === 0, detail: bad.length ? bad.map((m) => m.month).join(', ') : 'all positive' },
    { name: 'Suppressed or missing points', ok: true, detail: `${points.length - usable.length} skipped` },
    { name: 'Year over year jumps', ok: true, detail: jumps.length ? `flagged ${jumps.join(', ')}` : 'none over 60%' },
  ]
  return { months, checks }
}

// what changed since the last stored copy, StatCan revises recent months
export function diff(before: Month[], after: Month[]) {
  const old = new Map(before.map((m) => [m.month, m.value]))
  const revised = after.filter((m) => old.has(m.month) && Math.abs(old.get(m.month)! - m.value) > 0.5).map((m) => ({ month: m.month, from: old.get(m.month)!, to: m.value }))
  const added = after.filter((m) => !old.has(m.month)).map((m) => m.month)
  return { revised, added }
}

// one pipeline run: keep the old data if anything required fails
export async function refresh(previous: Stored | null): Promise<Stored> {
  const at = new Date().toISOString()
  const runs = previous?.runs ?? []
  try {
    const { coordinate: coord, picked, points } = await fetchSeries()
    const { months, checks } = validate(points)
    const ok = checks.every((c) => c.ok)
    const { revised, added } = diff(previous?.months ?? [], months)
    const run: Run = { at, ok, rows: points.length, checks, revised, added }
    const release = points.map((p) => p.releaseTime).sort().pop() ?? ''
    if (!ok && previous) return { ...previous, runs: [run, ...runs].slice(0, 12) }
    return { series: { table: '20-10-0072-01', coordinate: coord, picked, release }, months, runs: [run, ...runs].slice(0, 12) }
  } catch (e) {
    const run: Run = { at, ok: false, rows: 0, checks: [], revised: [], added: [], error: String((e as Error).message ?? e) }
    if (previous) return { ...previous, runs: [run, ...runs].slice(0, 12) }
    throw e
  }
}
