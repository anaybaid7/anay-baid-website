// POST /api/v1/transactions, the write route the generator listed against
// the IMS transaction processor. Writes are where retries hurt: if IMS
// commits but the reply is lost, the connector's retry posts it again. An
// Idempotency-Key lets the bridge answer the retry with the first result.

export interface Posting {
  id: string
  account: string
  amount: number // cents, negative is a debit
  key: string | null
}

export interface Ledger {
  balance: number // cents
  postings: Posting[]
  // Idempotency-Key -> the response the first attempt produced
  seen: Record<string, { status: 201; id: string; balance: number }>
}

export interface Attempt {
  n: number
  key: string | null
  committed: boolean
  replayed: boolean
  replyLost: boolean
}

const id = (n: number) => `TXN${String(n).padStart(6, '0')}`

// one call from the bridge to IMS
function post(l: Ledger, account: string, amount: number, key: string | null): { ledger: Ledger; id: string; replayed: boolean } {
  if (key && l.seen[key]) return { ledger: l, id: l.seen[key].id, replayed: true }
  const txn = id(l.postings.length + 1)
  const balance = l.balance + amount
  const postings = [...l.postings, { id: txn, account, amount, key }]
  const seen = key ? { ...l.seen, [key]: { status: 201 as const, id: txn, balance } } : l.seen
  return { ledger: { balance, postings, seen }, id: txn, replayed: false }
}

// A payment as the client sees it. lostReplies is how many times IMS commits
// but the answer never makes it back, so the connector tries again, up to
// its 2 retries.
export function pay(l: Ledger, account: string, amount: number, key: string | null, lostReplies: number) {
  const attempts: Attempt[] = []
  let ledger = l
  for (let n = 0; n <= Math.min(lostReplies, 2); n++) {
    const r = post(ledger, account, amount, key)
    ledger = r.ledger
    const replyLost = n < lostReplies
    attempts.push({ n: n + 1, key, committed: !r.replayed, replayed: r.replayed, replyLost })
    if (!replyLost) break
  }
  return { ledger, attempts, answered: attempts.some((a) => !a.replyLost) }
}

export const money = (cents: number) =>
  `${cents < 0 ? '−' : ''}$${(Math.abs(cents) / 100).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
