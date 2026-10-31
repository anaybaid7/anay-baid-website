import { useMemo, useState } from 'react'
import { simulate, type Trace } from './observer'

const ROWS = ['DOM changes', 'Debounce 500 ms', 'initialize', 'KEYS watch', 'Buttons']
const sec = (ms: number) => `${(ms / 1000).toFixed(1)}s`

function Timeline({ tr }: { tr: Trace }) {
  const L = 118
  const W = 760
  const x = (t: number) => L + (t / tr.end) * (W - L - 10)
  const y = (r: number) => 22 + r * 34
  const ticks = Array.from({ length: Math.floor(tr.end / 1000) + 1 }, (_, i) => i * 1000).filter((t, _, a) => a.length < 16 || t % 5000 === 0)
  return (
    <svg className="obs" viewBox={`0 0 ${W} ${y(ROWS.length) + 18}`} role="img" aria-label="Timeline of the content script on one profile load">
      {ROWS.map((r, i) => (
        <g key={r}>
          <line className="row" x1={L} x2={W - 10} y1={y(i) + 8} y2={y(i) + 8} />
          <text className="lbl" x={0} y={y(i) + 12}>{r}</text>
        </g>
      ))}
      {ticks.map((t) => (
        <text key={t} className="ax" x={x(t)} y={y(ROWS.length) + 14} textAnchor="middle">{sec(t)}</text>
      ))}
      {tr.dom.map((d, i) =>
        d.part ? (
          <g key={i}>
            <rect className={`part p-${d.part}`} x={x(d.t) - 5} y={y(0) + 3} width={10} height={10} />
            <text className="tag" x={x(d.t) + (d.t > tr.end * 0.85 ? -8 : 8)} y={y(0) + 2} textAnchor={d.t > tr.end * 0.85 ? 'end' : 'start'}>{{ crumb: 'breadcrumb', entry: 'EntryID', keys: 'KEYS' }[d.part]}</text>
          </g>
        ) : (
          <line key={i} className="tick" x1={x(d.t)} x2={x(d.t)} y1={y(0) + 2} y2={y(0) + 14} />
        ),
      )}
      {tr.debounce.map((d, i) => (
        <rect key={i} className={d.fired ? 'deb fired' : 'deb'} x={x(d.from)} y={y(1) + 3} width={Math.max(1, x(d.to) - x(d.from))} height={10} />
      ))}
      {tr.init.map((n, i) => (
        <circle key={i} className={n.retry ? 'init retry' : 'init build'} cx={x(n.t)} cy={y(2) + 8} r={n.retry ? 3.5 : 5.5} />
      ))}
      {tr.watch.map((w, i) => (
        <g key={i}>
          <rect className={`watch ${w.end}`} x={x(w.from)} y={y(3) + 3} width={Math.max(1, x(w.to) - x(w.from))} height={10} />
          {w.end === 'timeout' && <text className="xmark" x={x(w.to)} y={y(3) + 13} textAnchor="middle">✕</text>}
        </g>
      ))}
      {tr.buttons.map((b, i) => (
        <g key={b.name}>
          <rect className="btn-mark" x={x(b.t) - 4} y={y(4) + 4} width={8} height={8} />
          <text className="tag" x={x(b.t) + (b.t > tr.end * 0.8 ? -8 : 8)} y={y(4) + 2 + (i % 3) * 13} textAnchor={b.t > tr.end * 0.8 ? 'end' : 'start'}>{b.name}</text>
        </g>
      ))}
    </svg>
  )
}

// Slow the profile down and watch when each button shows up.
export default function Observer() {
  const [entry, setEntry] = useState(600)
  const [keys, setKeys] = useState(2500)
  const tr = useMemo(() => simulate(entry, keys), [entry, keys])
  const when = (n: string) => tr.buttons.find((b) => b.name === n)?.t
  const retries = tr.init.filter((i) => i.retry).length
  const restarts = tr.watch.filter((w) => w.end === 'restart').length

  return (
    <div className="demo observer">
      <p className="demo-hint">Drag the load times. The timings are content.js’s own.</p>
      <div className="obs-sliders">
        <label className="demo-field">
          <span>Main panel with EntryID <b>{sec(entry)}</b></span>
          <input type="range" min={200} max={22000} step={100} value={entry} onChange={(e) => setEntry(+e.target.value)} />
        </label>
        <label className="demo-field">
          <span>Rez 360 sidebar with KEYS <b>{sec(keys)}</b></span>
          <input type="range" min={500} max={30000} step={100} value={keys} onChange={(e) => setKeys(+e.target.value)} />
        </label>
      </div>
      <Timeline tr={tr} />
      <div className="tiles">
        <div><p>Copy Log</p><b>{sec(when('Copy Log')!)}</b></div>
        <div><p>Copy Lockout</p><b>{sec(when('Copy Lockout')!)}</b></div>
        <div className={retries >= 20 ? 'warn' : ''}><p>Retries</p><b>{retries}</b></div>
        <div><p>Watch restarts</p><b>{restarts}</b></div>
      </div>
    </div>
  )
}
