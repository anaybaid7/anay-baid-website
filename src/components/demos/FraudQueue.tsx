import { useEffect, useRef, useState } from 'react'
import { decide, score, type Txn } from './score'
import { rng } from './sales'
import { getSpeed } from '../sim/speed'
import { calm } from '../sim/useSequence'

const MERCHANTS = ['Grocer', 'Transit', 'Coffee', 'Electronics', 'Airline', 'Pharmacy', 'Gift cards', 'Fuel']
const FEATURES: [keyof ReturnType<typeof score>['parts'], string][] = [
  ['amount', 'Amount'],
  ['night', 'Night time'],
  ['newMerchant', 'New merchant'],
  ['abroad', 'Abroad'],
  ['lastHour', 'Recent activity'],
]

interface Item {
  id: number
  merchant: string
  t: Txn
  p: number
  fired: string[]
  status: 'passed' | 'open' | 'confirmed' | 'dismissed'
}

function makeTxn(id: number, rand: () => number, threshold: number): Item {
  const risky = rand() < 0.18
  const t: Txn = {
    amount: Math.round(risky ? 600 + rand() * 3200 : 5 + rand() * 180),
    hour: risky && rand() < 0.6 ? Math.floor(rand() * 6) : 8 + Math.floor(rand() * 14),
    newMerchant: risky ? rand() < 0.8 : rand() < 0.1,
    abroad: risky ? rand() < 0.6 : rand() < 0.03,
    lastHour: risky ? 2 + Math.floor(rand() * 6) : Math.floor(rand() * 2),
  }
  const s = score(t)
  return {
    id,
    merchant: MERCHANTS[Math.floor(rand() * MERCHANTS.length)],
    t,
    p: s.probability,
    fired: s.fired,
    status: decide(s.probability, s.fired, threshold) ? 'open' : 'passed',
  }
}

// Transactions stream through the rules and the model. Anything that trips
// either lands in the review queue with its reasons, and every decision is
// kept as a label for the next round of training.
export default function FraudQueue() {
  const [on, setOn] = useState(false)
  const [threshold, setThreshold] = useState(0.5)
  const [items, setItems] = useState<Item[]>([])
  const [pick, setPick] = useState<number | null>(null)
  const id = useRef(90200)
  const rand = useRef(rng(11))
  const th = useRef(threshold)
  th.current = threshold

  const tick = () => setItems((xs) => [makeTxn(id.current++, rand.current, th.current), ...xs].slice(0, 200))

  useEffect(() => {
    if (!on) return
    const t = window.setInterval(tick, calm() ? 1500 : 700 / getSpeed())
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])

  const decideOn = (i: number, status: 'confirmed' | 'dismissed') => {
    setItems((xs) => xs.map((x) => (x.id === i ? { ...x, status } : x)))
    const nextOpen = items.find((x) => x.status === 'open' && x.id !== i)
    setPick(nextOpen?.id ?? null)
  }

  const open = items.filter((x) => x.status === 'open')
  const sel = items.find((x) => x.id === pick)
  const parts = sel ? score(sel.t).parts : null
  const maxPart = parts ? Math.max(...Object.values(parts), 0.5) : 1
  const count = (s: Item['status']) => items.filter((x) => x.status === s).length

  return (
    <div className="demo fraud">
      <p className="demo-lede">
        Start the feed. Each transaction is scored by the rules and the model together, and anything flagged lands in the
        review queue with its reasons. Confirm or dismiss to label it.
      </p>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={() => setOn(!on)} aria-pressed={on}>
          {on ? 'Pause the feed' : items.length ? 'Resume the feed' : 'Start the feed'}
        </button>
        <button type="button" onClick={tick}>Score one</button>
        <label className="demo-field small inline">
          <span>Model threshold <b>{threshold.toFixed(2)}</b></span>
          <input type="range" min={0.2} max={0.9} step={0.05} value={threshold} onChange={(e) => setThreshold(+e.target.value)} />
        </label>
      </div>

      <div className="tiles">
        <div><p>Scored</p><b>{items.length}</b></div>
        <div className={open.length ? 'warn' : ''}><p>In review</p><b>{open.length}</b></div>
        <div><p>Confirmed</p><b>{count('confirmed')}</b></div>
        <div><p>Dismissed</p><b>{count('dismissed')}</b></div>
      </div>

      <div className="fraud-grid">
        <div>
          <p className="demo-h">Incoming</p>
          <ul className="txns">
            {items.slice(0, 8).map((x) => (
              <li key={x.id} className={x.status === 'passed' ? '' : 'flag'}>
                <code>tx_{x.id}</code>
                <span>{x.merchant}</span>
                <span className="amt">${x.t.amount.toLocaleString('en-CA')}</span>
                <span className="bar" aria-hidden="true"><i style={{ width: `${x.p * 100}%` }} /><em style={{ left: `${threshold * 100}%` }} /></span>
                <span className="p">{x.p.toFixed(2)}</span>
              </li>
            ))}
            {!items.length && <li className="none">Waiting for transactions</li>}
          </ul>
        </div>
        <div>
          <p className="demo-h">Review queue</p>
          <ul className="queue">
            {open.slice(0, 6).map((x) => (
              <li key={x.id}>
                <button type="button" aria-pressed={pick === x.id} onClick={() => setPick(x.id)}>
                  <code>tx_{x.id}</code> {x.merchant}, ${x.t.amount.toLocaleString('en-CA')}
                  <span>{x.fired.length ? x.fired[0] : `score ${x.p.toFixed(2)}`}</span>
                </button>
              </li>
            ))}
            {!open.length && <li className="none">Queue is clear</li>}
          </ul>
          {sel && parts && (
            <div className="alert-card">
              <p className="demo-h">Why tx_{sel.id} was flagged</p>
              <p>
                Model score <b>{sel.p.toFixed(2)}</b>
                {sel.fired.length > 0 && <>, rules fired: {sel.fired.join(', ')}</>}
              </p>
              <ul className="contrib">
                {FEATURES.map(([k, label]) => (
                  <li key={k}>
                    <span>{label}</span>
                    <i style={{ width: `${(parts[k] / maxPart) * 100}%` }} />
                  </li>
                ))}
              </ul>
              {sel.status === 'open' ? (
                <p className="demo-actions">
                  <button type="button" className="demo-primary" onClick={() => decideOn(sel.id, 'confirmed')}>Confirm fraud</button>
                  <button type="button" onClick={() => decideOn(sel.id, 'dismissed')}>Dismiss</button>
                </p>
              ) : (
                <p className="demo-out">Marked {sel.status}, stored as a training label.</p>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="demo-note">Made-up transactions, rules and weights, just to show the idea.</p>
    </div>
  )
}
