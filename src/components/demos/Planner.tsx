import { useState } from 'react'
import {
  applyPercent,
  DAYS,
  editTotal,
  gapCheck,
  normalize,
  splitWeek,
  sumsTo100,
  total,
  type DayCheck,
  type Week,
} from './planner'

const fmt = (n: number) => Math.round(n).toLocaleString('en-CA')

const WEEKS: Week[] = [
  [44, 12880, 5360],
  [45, 13120, 5420],
  [46, 13410, 5510],
  [47, 14020, 5780],
  [48, 16950, 6890],
  [49, 15730, 6410],
  [50, 14240, 5900],
].map(([week, pcl, agent]) => ({ week, pcl, agent, origPcl: pcl, origAgent: agent }))

// the Prophet model's event regressors, from config.py
const EVENT: Record<number, string> = { 48: 'Cyber', 49: 'Catchup' }

// Editing a week's total keeps the PCL and Agent split, and an operation on
// several weeks always starts from the original forecast.
function Weekly() {
  const [weeks, setWeeks] = useState(WEEKS)
  const [pick, setPick] = useState<number[]>([48, 49])
  const [pct, setPct] = useState(5)
  const [log, setLog] = useState<string[]>([])
  const max = Math.max(...weeks.map(total), ...WEEKS.map(total)) * 1.05

  const apply = () => {
    setWeeks(applyPercent(weeks, pick, pct))
    setLog((l) => [`Weeks ${pick.join(', ')} set to ${pct >= 0 ? '+' : ''}${pct}% of the original forecast`, ...l].slice(0, 4))
  }

  return (
    <>
      <p className="demo-lede">
        Terminal 412, delivery pieces. Type a new total for any week, or apply a percentage to several weeks. Run the same
        operation twice and it doesn’t stack.
      </p>
      <div className="table-scroll">
        <table className="plan-table">
          <thead>
            <tr>
              <th>Week</th>
              <th>PCL</th>
              <th>Agent</th>
              <th>Total</th>
              <th>vs original</th>
              <th aria-label="Total, as a bar" />
            </tr>
          </thead>
          <tbody>
            {weeks.map((w, i) => {
              const orig = WEEKS[i]
              const d = total(w) - total(orig)
              return (
                <tr key={w.week} className={d ? 'changed' : ''}>
                  <td>
                    <label className="demo-check tight">
                      <input
                        type="checkbox"
                        checked={pick.includes(w.week)}
                        onChange={() =>
                          setPick(pick.includes(w.week) ? pick.filter((x) => x !== w.week) : [...pick, w.week].sort())
                        }
                        aria-label={`Select week ${w.week}`}
                      />
                      {w.week}
                    </label>
                    {EVENT[w.week] && <span className="plan-event">{EVENT[w.week]}</span>}
                  </td>
                  <td>{fmt(w.pcl)}</td>
                  <td>{fmt(w.agent)}</td>
                  <td>
                    <input
                      className="plan-input"
                      type="number"
                      value={Math.round(total(w))}
                      aria-label={`Total for week ${w.week}`}
                      onChange={(e) => setWeeks(weeks.map((x) => (x.week === w.week ? editTotal(x, +e.target.value) : x)))}
                    />
                  </td>
                  <td className={d > 0 ? 'up' : d < 0 ? 'down' : ''}>{d ? `${d > 0 ? '+' : ''}${fmt(d)}` : '·'}</td>
                  <td className="plan-bar">
                    <i style={{ width: `${(total(orig) / max) * 100}%` }} className="orig" />
                    <i style={{ width: `${(total(w) / max) * 100}%` }} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <div className="demo-actions">
        <label className="demo-field small inline">
          <span>
            Change for the selected weeks{' '}
            <b>
              {pct >= 0 ? '+' : ''}
              {pct}%
            </b>
          </span>
          <input type="range" min={-20} max={20} value={pct} onChange={(e) => setPct(+e.target.value)} />
        </label>
        <button type="button" className="demo-primary" onClick={apply} disabled={!pick.length}>
          Apply
        </button>
        <button type="button" onClick={() => (setWeeks(WEEKS), setLog([]))}>
          Reset
        </button>
      </div>
      <p className="demo-out" aria-live="polite">
        {log[0] ?? 'PCL + Agent always equals Total. Editing Total scales both by the same ratio.'}
      </p>
    </>
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
      <p className="demo-lede">
        Week 45 at terminal 412 is {fmt(WEEKLY)} pieces. Each day gets a share of the week. Make Wednesday a holiday and the
        shares no longer add to 100% until you normalize them.
      </p>
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
          ? `Shares add to ${sum.toFixed(2)}%. The days add up to ${fmt(days.reduce((a, b) => a + b, 0))}, the same as the week.`
          : `Shares add to ${sum.toFixed(2)}%, so the days come to ${fmt(WEEKLY - short)}, ${fmt(short)} short of the week. Sum must be 100% before saving. Use Normalize.`}
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
      <p className="demo-lede">
        Every terminal and day is compared with the same weekday over the last four weeks. A day needs a gap of at least 50% and
        at least 100 pieces to be flagged, so small terminals don’t drown the list.
      </p>
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
        {bug
          ? `${flagged} flagged. With the holiday counted as a zero, both Quebec Wednesday baselines drop by a quarter, and terminal 744 is flagged for a normal week.`
          : `${flagged} flagged. Terminal 412 is a real drop. Terminal 905 is up ${rows[3].r.pct.toFixed(0)}% but only by ${fmt(rows[3].r.diff)} pieces, so it isn’t flagged.`}
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
      <p className="demo-note">Made-up volumes. The rules are the tool’s own, shown in the Code tab as planner.ts.</p>
    </div>
  )
}
