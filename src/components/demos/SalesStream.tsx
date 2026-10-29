import { useEffect, useRef, useState } from 'react'
import { checkSale, makeSale, rng, THEATRES, type Sale } from './sales'
import { getSpeed } from '../sim/speed'
import { calm } from '../sim/useSequence'

interface Held {
  sale: Sale
  why: string
}

const money = (n: number) => n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD' })

// Sales arrive on a timer and go through the same checks the ETL ran before
// anything reached the dashboard. Bad rows are held back with a reason
// instead of quietly changing the totals.
export default function SalesStream() {
  const [on, setOn] = useState(false)
  const [bad, setBad] = useState(false)
  const [rows, setRows] = useState<Sale[]>([])
  const [held, setHeld] = useState<Held[]>([])
  const [flash, setFlash] = useState<number | null>(null)
  const id = useRef(1000)
  const seen = useRef(new Set<number>())
  const rand = useRef(rng(7))
  const badRef = useRef(bad)
  badRef.current = bad

  const tick = () => {
    const s = makeSale(id.current++, rand.current, badRef.current)
    const why = checkSale(s, seen.current)
    if (why) setHeld((h) => [{ sale: s, why }, ...h].slice(0, 6))
    else {
      seen.current.add(s.id)
      setRows((r) => [s, ...r].slice(0, 400))
      setFlash(s.id)
    }
  }

  useEffect(() => {
    if (!on) return
    const t = window.setInterval(tick, calm() ? 1500 : 650 / getSpeed())
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])

  const gross = rows.reduce((a, r) => a + r.gross, 0)
  const tickets = rows.reduce((a, r) => a + r.tickets, 0)
  const by = THEATRES.map((t) => ({ t, g: rows.filter((r) => r.theatre === t).reduce((a, r) => a + r.gross, 0) }))
  const top = Math.max(...by.map((b) => b.g), 1)
  const reset = () => {
    setRows([])
    setHeld([])
    seen.current = new Set()
    id.current = 1000
    rand.current = rng(7)
  }

  return (
    <div className="demo sales">
      <p className="demo-lede">
        Start the stream to watch sales flow into the dashboard. Turn on bad rows to see validation hold them back before
        they skew the totals.
      </p>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={() => setOn(!on)} aria-pressed={on}>
          {on ? 'Pause the stream' : rows.length ? 'Resume the stream' : 'Start the stream'}
        </button>
        <button type="button" onClick={tick}>Send one sale</button>
        <label className="demo-check">
          <input type="checkbox" checked={bad} onChange={(e) => setBad(e.target.checked)} /> Mix in bad rows
        </label>
        <button type="button" onClick={reset}>Reset</button>
      </div>

      <div className="tiles">
        <div><p>Gross today</p><b>{money(gross)}</b></div>
        <div><p>Tickets</p><b>{tickets.toLocaleString('en-CA')}</b></div>
        <div><p>Sales</p><b>{rows.length}</b></div>
        <div className={held.length ? 'warn' : ''}><p>Held back</p><b>{held.length}</b></div>
      </div>

      <div className="sales-grid">
        <div>
          <p className="demo-h">Gross by theatre</p>
          <ul className="hbars">
            {by.map((b) => (
              <li key={b.t}>
                <span>{b.t}</span>
                <i style={{ width: `${(b.g / top) * 100}%` }} />
                <b>{money(b.g)}</b>
              </li>
            ))}
          </ul>
          <p className="demo-h">Latest sales</p>
          <ul className="feed">
            {rows.slice(0, 5).map((r) => (
              <li key={r.id} className={r.id === flash ? 'new' : ''}>
                <code>#{r.id}</code> {r.theatre}, show {r.show}, {r.tickets} × <b>{money(r.gross)}</b>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="demo-h">Held back by validation</p>
          <ul className="held" aria-live="polite">
            {held.length === 0 && <li className="none">Nothing held back</li>}
            {held.map((h, i) => (
              <li key={i}>
                <code>#{h.sale.id}</code> {h.why}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="demo-note">Made-up sales, just to show the idea.</p>
    </div>
  )
}
