import { useState } from 'react'
import { DAYS, gapCheck, normalize, OPS, revert, runOp, splitWeek, sumsTo100, total, type Change, type DayCheck, type Op, type Week } from './planner'

const fmt = (n: number) => Math.round(n).toLocaleString('en-CA')

// weeks 36 to 52 at one terminal: last year's actuals and this year's forecast
const BASE = [3300, 3240, 3280, 3310, 3270, 3150, 3290, 3320, 3380, 3460, 3620, 4200, 4480, 4310, 3990, 4500, 3100]
const FC = [3465, 3380, 3410, 3440, 3400, 3200, 3420, 3460, 3520, 3610, 3790, 4550, 4700, 4480, 4150, 4620, 3240]
const WEEKS: Week[] = FC.map((f, i) => {
  const pcl = Math.round(f * 0.71)
  return { week: 36 + i, pcl, agent: f - pcl, origPcl: pcl, origAgent: f - pcl }
})
const EVENT: Record<number, string> = { 36: 'Labour Day', 41: 'Thanksgiving', 45: 'Remembrance', 48: 'Cyber', 49: 'Catchup', 51: 'Christmas', 52: 'Christmas' }
const k = (n: number) => `${Math.round(n).toLocaleString('en-CA')}K`

function Chart({ weeks, pick }: { weeks: Week[]; pick: number[] }) {
  const W = 640
  const H = 190
  const vals = [...BASE, ...weeks.map(total), ...WEEKS.map(total)]
  const lo = Math.min(...vals) * 0.95
  const hi = Math.max(...vals) * 1.03
  const x = (i: number) => 44 + (i * (W - 56)) / (weeks.length - 1)
  const y = (v: number) => H - 22 - ((v - lo) / (hi - lo)) * (H - 34)
  const line = (ys: number[]) => ys.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const changed = weeks.some((w, i) => total(w) !== total(WEEKS[i]))
  return (
    <svg className="pchart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Forecast against last year">
      {weeks.map((w, i) => (pick.includes(w.week) ? <rect key={w.week} className="sel" x={x(i) - 14} y={6} width={28} height={H - 28} /> : null))}
      {[lo, (lo + hi) / 2, hi].map((v) => (
        <text key={v} className="ax" x={0} y={y(v) + 4}>{k(v)}</text>
      ))}
      <path className="base" d={line(BASE)} />
      {changed && <path className="orig" d={line(WEEKS.map(total))} />}
      <path className="fc" d={line(weeks.map(total))} />
      {weeks.map((w, i) => (total(w) !== total(WEEKS[i]) ? <circle key={w.week} className="mod" cx={x(i)} cy={y(total(w))} r={4.5} /> : null))}
      {weeks.map((w, i) => (i % 2 === 0 ? <text key={w.week} className="ax" x={x(i)} y={H - 4} textAnchor="middle">{w.week}</text> : null))}
    </svg>
  )
}

// The weekly review screen: pick weeks, run operations one after another,
// step back with Revert, and every change lands in the log.
function Weekly() {
  const [weeks, setWeeks] = useState(WEEKS)
  const [stacks, setStacks] = useState<Record<number, number[]>>({})
  const [pick, setPick] = useState<number[]>([48, 49])
  const [anchor, setAnchor] = useState(48)
  const [op, setOp] = useState<Op>('%+')
  const [val, setVal] = useState(5)
  const [log, setLog] = useState<Change[]>([])

  const select = (wk: number, shift: boolean, ctrl: boolean) => {
    if (shift) {
      const [a, b] = [Math.min(anchor, wk), Math.max(anchor, wk)]
      setPick(weeks.filter((w) => w.week >= a && w.week <= b).map((w) => w.week))
      return
    }
    setPick(ctrl ? (pick.includes(wk) ? pick.filter((x) => x !== wk) : [...pick, wk]) : [wk])
    setAnchor(wk)
  }
  const apply = () => {
    const r = runOp(weeks, stacks, pick, op, val)
    setWeeks(r.weeks)
    setStacks(r.stacks)
    setLog([...r.log, ...log].slice(0, 30))
  }
  const back = (all: boolean) => {
    if (all) {
      setWeeks(WEEKS)
      setStacks({})
      setLog([])
      return
    }
    const r = revert(weeks, stacks, pick)
    setWeeks(r.weeks)
    setStacks(r.stacks)
  }
  const sel = weeks.map((w, i) => ({ w, i })).filter(({ w }) => pick.includes(w.week))
  const selTotal = sel.reduce((a, { w }) => a + total(w), 0)
  const selBase = sel.reduce((a, { i }) => a + BASE[i], 0)

  return (
    <div className="plan-grid">
      <div>
        <Chart weeks={weeks} pick={pick} />
        <p className="demo-legend">
          <i className="k-base" /> 2025 actual <i className="k-fc" /> forecast <i className="k-orig" /> original <i className="k-mod" /> changed
        </p>
        <div className="plan-ops" onKeyDown={(e) => e.key === 'Enter' && pick.length && apply()}>
          <span className="plan-kpi">
            <b>{pick.length}</b> wk · <b>{k(selTotal)}</b> · YoY{' '}
            <b>{selBase ? `${selTotal >= selBase ? '+' : ''}${(((selTotal - selBase) / selBase) * 100).toFixed(1)}%` : '·'}</b>
          </span>
          <select value={op} onChange={(e) => setOp(e.target.value as Op)} aria-label="Operation">
            {(Object.keys(OPS) as Op[]).map((o) => <option key={o} value={o}>{OPS[o]}</option>)}
          </select>
          <input type="number" value={val} onChange={(e) => setVal(+e.target.value)} aria-label="Value" />
          <button type="button" className="demo-primary" onClick={apply} disabled={!pick.length}>Apply</button>
          <button type="button" onClick={() => back(false)} disabled={!pick.some((p) => stacks[p]?.length)}>Revert</button>
          <button type="button" onClick={() => back(true)} disabled={!log.length}>Revert all</button>
        </div>
        <div className="table-scroll">
          <table className="plan-table">
            <thead>
              <tr><th>Wk</th><th>2025</th><th>Forecast</th><th>PCL / Agent</th><th>YoY</th><th /></tr>
            </thead>
            <tbody>
              {weeks.map((w, i) => {
                const yoy = ((total(w) - BASE[i]) / BASE[i]) * 100
                const n = stacks[w.week]?.length ?? 0
                return (
                  <tr key={w.week} className={[pick.includes(w.week) ? 'picked' : '', n ? 'changed' : ''].join(' ')} onClick={(e) => select(w.week, e.shiftKey, e.ctrlKey || e.metaKey)}>
                    <td>
                      <button
                        type="button"
                        className="wk"
                        aria-pressed={pick.includes(w.week)}
                        onClick={(e) => {
                          e.stopPropagation()
                          select(w.week, e.shiftKey, e.ctrlKey || e.metaKey)
                        }}
                      >
                        {w.week}
                      </button>
                      {EVENT[w.week] && <span className="plan-event">{EVENT[w.week]}</span>}
                    </td>
                    <td>{k(BASE[i])}</td>
                    <td><b>{k(total(w))}</b></td>
                    <td className="split">{k(w.pcl)} / {k(w.agent)}</td>
                    <td className={yoy >= 0 ? 'up' : 'down'}>{`${yoy >= 0 ? '+' : ''}${yoy.toFixed(1)}%`}</td>
                    <td className="mods">{n ? `${n} op${n > 1 ? 's' : ''}` : ''}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <aside className="plan-log">
        <p className="demo-h">Change log</p>
        <ol>
          {log.length === 0 && <li className="none">Nothing yet</li>}
          {log.map((c, i) => (
            <li key={i}>
              <b>W{c.week}</b> {c.op} {c.val}
              <span>{k(c.before)} → {k(c.after)}</span>
            </li>
          ))}
        </ol>
      </aside>
    </div>
  )
}

const SHARES = [0.4, 20.6, 20.1, 19.8, 19.7, 18.9, 0.5]
const WEEKLY = 18240

// One week turned into days by weekday share, the way the Daily tab does it.
function Daily() {
  const [shares, setShares] = useState(SHARES)
  const ok = sumsTo100(shares)
  // until the shares add to 100%, the days don't add back to the week
  const days = ok ? splitWeek(WEEKLY, shares) : shares.map((x) => Math.round((WEEKLY * x) / 100))
  const short = WEEKLY - days.reduce((a, b) => a + b, 0)
  const sum = shares.reduce((a, b) => a + b, 0)
  const top = Math.max(...days, 1)

  return (
    <>
      <p className="demo-hint">Make Wednesday a holiday, then normalize.</p>
      <div className="daily">
        {DAYS.map((d, i) => (
          <div key={d} className="daily-col">
            <span className="daily-bar">
              <i style={{ height: `${(days[i] / top) * 100}%` }} />
            </span>
            <b>{fmt(days[i])}</b>
            <label>
              <span>{d}</span>
              <input
                type="number"
                step="0.01"
                value={shares[i]}
                aria-label={`${d} share`}
                onChange={(e) => setShares(shares.map((s, j) => (j === i ? +e.target.value : s)))}
              />
            </label>
          </div>
        ))}
      </div>
      <div className="demo-actions">
        <button type="button" onClick={() => setShares(shares.map((s, i) => (i === 3 ? 0 : s)))}>
          Make Wednesday a holiday
        </button>
        <button type="button" className="demo-primary" onClick={() => setShares(normalize(shares))}>
          Normalize
        </button>
        <button type="button" onClick={() => setShares(SHARES)}>
          Reset
        </button>
      </div>
      <p className={`demo-out ${ok ? '' : 'warn'}`} aria-live="polite">
        {ok
          ? `${sum.toFixed(2)}%. Days add back to ${fmt(days.reduce((a, b) => a + b, 0))}.`
          : `${sum.toFixed(2)}%. ${fmt(short)} pieces missing. Can’t save until it’s 100%.`}
      </p>
    </>
  )
}

const CHECKS: DayCheck[] = [
  { terminal: 412, day: 'Mon', forecast: 980, history: [{ value: 2100 }, { value: 2050 }, { value: 2150 }, { value: 2080 }] },
  {
    terminal: 731,
    day: 'Wed',
    forecast: 525,
    history: [{ value: 520 }, { value: 505 }, { value: 0, holiday: 'Saint-Jean-Baptiste' }, { value: 530 }],
  },
  {
    terminal: 744,
    day: 'Wed',
    forecast: 720,
    history: [{ value: 600 }, { value: 620 }, { value: 0, holiday: 'Saint-Jean-Baptiste' }, { value: 580 }],
  },
  { terminal: 905, day: 'Fri', forecast: 140, history: [{ value: 80 }, { value: 90 }, { value: 70 }, { value: 85 }] },
]

// Each day against the same weekday over the last four weeks. Leaving the
// holiday in the baseline is the bug that made Quebec Wednesdays look wrong.
function Gaps() {
  const [bug, setBug] = useState(false)
  const rows = CHECKS.map((c) => ({ c, r: gapCheck(c, !bug) }))
  const flagged = rows.filter((x) => x.r.check).length

  return (
    <>
      <p className="demo-hint">Toggle the holiday list.</p>
      <div className="table-scroll">
        <table className="plan-table gaps">
          <thead>
            <tr>
              <th>Terminal</th>
              <th>Day</th>
              <th>Last 4 weeks</th>
              <th>Baseline</th>
              <th>Forecast</th>
              <th>Gap</th>
              <th>Check</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ c, r }) => (
              <tr key={`${c.terminal}${c.day}`} className={r.check ? 'flag' : ''}>
                <td>{c.terminal}</td>
                <td>{c.day}</td>
                <td className="hist">
                  {c.history.map((h, i) => (
                    <span key={i} className={h.holiday ? (bug ? 'hol in' : 'hol') : ''} title={h.holiday}>
                      {fmt(h.value)}
                    </span>
                  ))}
                </td>
                <td>{fmt(r.baseline)}</td>
                <td>{fmt(c.forecast)}</td>
                <td>{`${r.pct > 0 ? '+' : ''}${r.pct.toFixed(0)}%, ${r.diff > 0 ? '+' : ''}${fmt(r.diff)}`}</td>
                <td>{r.check ? 'CHECK' : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <label className="demo-check">
        <input type="checkbox" checked={bug} onChange={(e) => setBug(e.target.checked)} /> Run without the holiday list
      </label>
      <p className={`demo-out ${bug ? 'warn' : ''}`} aria-live="polite">
        {bug ? `${flagged} flagged. The holiday zero drags the baseline down.` : `${flagged} flagged. 905 is +${rows[3].r.pct.toFixed(0)}% but only ${fmt(rows[3].r.diff)} pieces.`}
      </p>
    </>
  )
}

const PARTS = [
  ['weekly', 'Edit the weekly forecast'],
  ['daily', 'Split a week into days'],
  ['gaps', 'Check for gaps'],
] as const

export default function Planner() {
  const [part, setPart] = useState<(typeof PARTS)[number][0]>('weekly')
  return (
    <div className="demo planner">
      <div className="sub-tabs" role="tablist" aria-label="Planning steps">
        {PARTS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={part === k} onClick={() => setPart(k)}>
            {label}
          </button>
        ))}
      </div>
      {part === 'weekly' && <Weekly />}
      {part === 'daily' && <Daily />}
      {part === 'gaps' && <Gaps />}
    </div>
  )
}
