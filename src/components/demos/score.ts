// A toy fraud score: a few readable rules plus a logistic model over a
// handful of features. The weights are made up, the shape is the point.

export interface Txn {
  amount: number
  hour: number
  newMerchant: boolean
  abroad: boolean
  lastHour: number
}

const BIAS = -4.2
const WEIGHTS = { amount: 0.0011, night: 1.1, newMerchant: 1.4, abroad: 1.9, lastHour: 0.4 }

const RULES: [string, (t: Txn) => boolean][] = [
  ['Amount over $2,500', (t) => t.amount >= 2500],
  ['Abroad at a new merchant', (t) => t.abroad && t.newMerchant],
  ['Six or more transactions in an hour', (t) => t.lastHour >= 6],
]

export function score(t: Txn) {
  const parts = {
    amount: WEIGHTS.amount * t.amount,
    night: WEIGHTS.night * (t.hour < 6 ? 1 : 0),
    newMerchant: WEIGHTS.newMerchant * Number(t.newMerchant),
    abroad: WEIGHTS.abroad * Number(t.abroad),
    lastHour: WEIGHTS.lastHour * t.lastHour,
  }
  const z = BIAS + Object.values(parts).reduce((a, b) => a + b, 0)
  const probability = 1 / (1 + Math.exp(-z))
  const fired = RULES.filter(([, test]) => test(t)).map(([name]) => name)
  return { probability, parts, fired }
}

export const decide = (probability: number, fired: string[], threshold: number) =>
  probability >= threshold || fired.length > 0
