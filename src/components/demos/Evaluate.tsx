import { useMemo, useState } from 'react'
import { confusion, curve, sample, timeSplit } from './evaluate'

const pct = (x: number) => `${Math.round(x * 100)}%`

// Drag the threshold. The curve, the confusion matrix and the review load
// all come from scoring a held-out month the model never trained on.
export default function Evaluate() {
  const [th, setTh] = useState(0.5)
  const rows = useMemo(() => sample(), [])
  const { train, test } = useMemo(() => timeSplit(rows), [rows])
  const pts = useMemo(() => curve(test), [test])
  const c = confusion(test, th)
  const W = 320
  const H = 220
  const x = (v: number) => 34 + v * (W - 44)
  const y = (v: number) => H - 26 - v * (H - 38)
  const path = pts.map((p, i) => `${i ? 'L' : 'M'}${x(p.recall).toFixed(1)},${y(p.precision).toFixed(1)}`).join(' ')
  const days = Array.from({ length: 90 }, (_, d) => d)

  return (
    <div className="demo eval">
      <p className="demo-hint">Drag the threshold.</p>
      <div className="split-bar" aria-label="Time split">
        {days.map((d) => (
          <i key={d} className={d < 72 ? 'tr' : 'te'} />
        ))}
        <span className="sb-l">train · {train.length} txns, day 1 to 72</span>
        <span className="sb-r">test · {test.length}</span>
      </div>

      <label className="demo-field">
        <span>Alert threshold <b>{th.toFixed(2)}</b></span>
        <input type="range" min={0.05} max={0.95} step={0.05} value={th} onChange={(e) => setTh(+e.target.value)} />
      </label>

      <div className="eval-grid">
        <svg className="pchart pr" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Precision against recall">
          {[0, 0.5, 1].map((v) => (
            <g key={v}>
              <line className="grid" x1={x(0)} x2={x(1)} y1={y(v)} y2={y(v)} />
              <text className="ax" x={0} y={y(v) + 4}>{pct(v)}</text>
              <text className="ax" x={x(v)} y={H - 6} textAnchor="middle">{pct(v)}</text>
            </g>
          ))}
          <text className="ax" x={x(1)} y={H - 16} textAnchor="end">recall</text>
          <text className="ax" x={x(0) + 4} y={y(1) - 4}>precision</text>
          <path className="fc" d={path} />
          <circle className="mod big" cx={x(c.recall)} cy={y(c.precision)} r={7} />
        </svg>

        <div>
          <table className="cm" aria-label="Confusion matrix">
            <thead>
              <tr><th><span className="sr-only">Decision</span></th><th>Fraud</th><th>Legit</th></tr>
            </thead>
            <tbody>
              <tr><th>Flagged</th><td className="tp">{c.tp}</td><td className="fp">{c.fp}</td></tr>
              <tr><th>Passed</th><td className="fn">{c.fn}</td><td className="tn">{c.tn}</td></tr>
            </tbody>
          </table>
          <div className="tiles two">
            <div><p>Precision</p><b>{pct(c.precision)}</b></div>
            <div><p>Recall</p><b>{pct(c.recall)}</b></div>
            <div className={c.fn ? 'warn' : ''}><p>Fraud missed</p><b>{c.fn}</b></div>
            <div><p>Reviews</p><b>{c.tp + c.fp}</b></div>
          </div>
        </div>
      </div>
    </div>
  )
}
