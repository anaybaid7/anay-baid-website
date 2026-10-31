// Evaluating the fraud model the way it would be used: train on earlier
// transactions, test on later ones, then see what each alert threshold
// costs in missed fraud and wasted reviews.
import { score, type Txn } from './score'

// mulberry32, a seeded 32-bit generator
function rng(seed: number) {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 2 ** 32
  }
}

export interface Labeled {
  day: number
  t: Txn
  fraud: boolean
  p: number
}

// 90 days of made-up traffic, about 4% fraud
export function sample(seed = 9, n = 3000): Labeled[] {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => {
    const fraud = r() < 0.04
    // a fifth of fraud looks ordinary and some legit traffic looks risky
    const odd = fraud ? r() < 0.8 : r() < 0.008
    const t: Txn = {
      amount: Math.round(odd ? 150 + r() * 2400 : 5 + r() * 260),
      hour: odd && r() < 0.5 ? Math.floor(r() * 6) : Math.floor(r() * 24),
      newMerchant: r() < (odd ? 0.6 : 0.1),
      abroad: r() < (odd ? 0.45 : 0.03),
      lastHour: Math.floor(r() * (odd ? 6 : 3)),
    }
    return { day: Math.floor((i / n) * 90), t, fraud, p: score(t).probability }
  })
}

// train on the first 80% of days and test on the rest, never shuffled
export function timeSplit(rows: Labeled[], cut = 72) {
  return { train: rows.filter((r) => r.day < cut), test: rows.filter((r) => r.day >= cut) }
}

export function confusion(rows: Labeled[], threshold: number) {
  let tp = 0
  let fp = 0
  let fn = 0
  let tn = 0
  for (const r of rows) {
    const flag = r.p >= threshold
    if (flag && r.fraud) tp++
    else if (flag) fp++
    else if (r.fraud) fn++
    else tn++
  }
  return {
    tp,
    fp,
    fn,
    tn,
    precision: tp + fp ? tp / (tp + fp) : 1,
    recall: tp + fn ? tp / (tp + fn) : 0,
  }
}

// precision and recall at every threshold from 0.05 to 0.95
export const curve = (rows: Labeled[]) =>
  Array.from({ length: 19 }, (_, i) => {
    const th = 0.05 + i * 0.05
    return { th, ...confusion(rows, th) }
  })
