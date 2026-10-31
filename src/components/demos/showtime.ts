// Why cleaner input data made the showtime models better. Attendance per
// show is fit from its start hour and whether it's a weekend, trained on
// three weeks and scored on a fourth, clean week. Turning on each cleaning
// step removes one kind of bad row from the training data.

export type Fault = 'dup' | 'neg' | 'missing'

export interface Show {
  week: number
  hour: number
  weekend: boolean
  seats: number
  fault?: Fault
  // what the dirty data said, when it was wrong
  raw?: number
}

function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
}

// evenings peak around 7 pm and weekends run fuller
export const truth = (hour: number, weekend: boolean) => Math.max(4, 150 - 2.6 * (hour - 19.5) ** 2 + (weekend ? 45 : 0))

export function shows(seed = 4): Show[] {
  const r = rng(seed)
  const out: Show[] = []
  for (let week = 1; week <= 4; week++)
    for (let day = 0; day < 7; day++)
      for (const hour of [11, 13, 15, 17, 19, 20, 22]) {
        const weekend = day >= 5
        const seats = Math.round(truth(hour, weekend) + (r() - 0.5) * 40)
        const x = week < 4 ? r() : NaN
        // retried batches double a busy evening show's total, refunds posted
        // as negative tickets sink weekend matinees, and a sale with no
        // showtime lands at hour 0
        if (x < 0.2 && hour >= 19) out.push({ week, hour, weekend, seats, fault: 'dup', raw: seats * 2 })
        else if (x < 0.45 && weekend && hour <= 15) out.push({ week, hour, weekend, seats, fault: 'neg', raw: -Math.round(seats * 0.5) })
        else if (x > 0.975) out.push({ week, hour: 0, weekend, seats, fault: 'missing', raw: seats })
        else out.push({ week, hour, weekend, seats })
      }
  return out
}

const features = (s: Pick<Show, 'hour' | 'weekend'>) => [1, s.hour, s.hour * s.hour, s.weekend ? 1 : 0]

// least squares by the normal equations, small enough to solve directly
export function fit(rows: Show[]) {
  const n = 4
  const A = Array.from({ length: n }, () => Array(n + 1).fill(0))
  for (const s of rows) {
    const f = features(s)
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) A[i][j] += f[i] * f[j]
      A[i][n] += f[i] * s.seats
    }
  }
  for (let c = 0; c < n; c++) {
    const p = A.slice(c).reduce((best, row, i) => (Math.abs(row[c]) > Math.abs(A[best][c]) ? c + i : best), c)
    ;[A[c], A[p]] = [A[p], A[c]]
    for (let r = 0; r < n; r++) {
      if (r === c) continue
      const k = A[r][c] / A[c][c]
      for (let j = c; j <= n; j++) A[r][j] -= k * A[c][j]
    }
  }
  const w = A.map((row, i) => row[n] / row[i])
  return (s: Pick<Show, 'hour' | 'weekend'>) => features(s).reduce((a, f, i) => a + f * w[i], 0)
}

// cleaning fixes duplicates and refunds back to the real total and drops
// rows that have no showtime at all
export function trainingRows(all: Show[], cleaned: Set<Fault>): Show[] {
  return all
    .filter((s) => s.week < 4 && !(s.fault === 'missing' && cleaned.has('missing')))
    .map((s) => (s.fault && !cleaned.has(s.fault) ? { ...s, seats: s.raw! } : s))
}

export function evaluate(all: Show[], cleaned: Set<Fault>) {
  const train = trainingRows(all, cleaned)
  const test = all.filter((s) => s.week === 4)
  const model = fit(train)
  const mae = test.reduce((a, s) => a + Math.abs(model(s) - s.seats), 0) / test.length
  return { train, model, mae }
}
