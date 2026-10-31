import { useMemo, useState } from 'react'
import { evaluate, shows, type Fault } from './showtime'

const STEPS: [Fault, string][] = [
  ['missing', 'Drop sales with no showtime'],
  ['dup', 'Dedupe retried batches'],
  ['neg', 'Net refunds into the show'],
]

// Clean the training weeks one step at a time and score the model on a
// clean fourth week it never saw.
export default function Showtime() {
  const all = useMemo(() => shows(), [])
  const [on, setOn] = useState<Set<Fault>>(new Set())
  const { train, model, mae } = evaluate(all, on)
  const base = useMemo(() => evaluate(all, new Set()).mae, [all])
  const test = all.filter((s) => s.week === 4)

  const W = 560
  const H = 260
  const x = (h: number) => 40 + (h / 23) * (W - 56)
  const y = (v: number) => H - 28 - ((v + 120) / 520) * (H - 44)
  const curve = (weekend: boolean) =>
    Array.from({ length: 31 }, (_, i) => 9 + (i * 14) / 30)
      .map((h, i) => `${i ? 'L' : 'M'}${x(h).toFixed(1)},${y(model({ hour: h, weekend })).toFixed(1)}`)
      .join(' ')
  const flip = (f: Fault) =>
    setOn((s) => {
      const n = new Set(s)
      if (n.has(f)) n.delete(f)
      else n.add(f)
      return n
    })

  return (
    <div className="demo showtime">
      <div className="demo-actions checks">
        {STEPS.map(([f, label]) => (
          <label key={f} className={`demo-inline f-${f}`}>
            <input type="checkbox" checked={on.has(f)} onChange={() => flip(f)} />
            {label}
          </label>
        ))}
      </div>
      <svg className="pchart st" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Seats per show by start hour, with the fitted model">
        {[0, 200, 400].map((v) => (
          <g key={v}>
            <line className="grid" x1={x(0)} x2={x(23)} y1={y(v)} y2={y(v)} />
            <text className="ax" x={0} y={y(v) + 4}>{v}</text>
          </g>
        ))}
        {[0, 6, 12, 18, 23].map((h) => (
          <text key={h} className="ax" x={x(h)} y={H - 8} textAnchor="middle">{h}:00</text>
        ))}
        {test.map((s, i) => (
          <circle key={`t${i}`} className="pt test" cx={x(s.hour + (s.weekend ? 0.25 : -0.25))} cy={y(s.seats)} r={2.5} />
        ))}
        {train.map((s, i) => (
          <circle key={i} className={`pt ${s.fault && !on.has(s.fault) ? `bad f-${s.fault}` : ''}`} cx={x(s.hour + (s.weekend ? 0.25 : -0.25))} cy={y(s.seats)} r={s.fault && !on.has(s.fault) ? 4.5 : 3} />
        ))}
        <path className="fit" d={curve(false)} />
        <path className="fit wk" d={curve(true)} />
      </svg>
      <p className="heat-key">
        <i className="k-fit" /> weekday fit <i className="k-wk" /> weekend fit <i className="k-test" /> week 4, held out
      </p>
      <div className="tiles">
        <div className={mae > base * 0.8 ? 'warn' : ''}><p>Error on week 4</p><b>±{mae.toFixed(1)} seats</b></div>
        <div><p>Before cleaning</p><b>±{base.toFixed(1)}</b></div>
        <div><p>Training shows</p><b>{train.length}</b></div>
      </div>
    </div>
  )
}
