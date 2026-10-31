import { useMemo, useState } from 'react'
import { useSequence } from '../sim/useSequence'
import { CHANGES, depth, plan, schedule, STACK, summary, type Change } from './terraform'

const SIGN = { create: '+', update: '~', replace: '-/+', none: '' }
const short = (id: string) => id.replace('aws_', '').replace('_definition', '_def').replace('_distribution', '')

// Pick a change, read the plan, then apply it and watch the graph fill in.
export default function Terraform() {
  const [change, setChange] = useState<Change>('fresh')
  const [clock, setClock] = useState<number | null>(null)
  const seq = useSequence()
  const p = useMemo(() => plan(change), [change])
  const s = useMemo(() => schedule(p), [p])

  const pos = useMemo(() => {
    const cols: string[][] = []
    for (const r of STACK) (cols[depth(r.id)] ??= []).push(r.id)
    const out: Record<string, [number, number]> = {}
    cols.forEach((ids, c) => ids.forEach((id, i) => (out[id] = [10 + c * 184, 14 + i * 46 + (3 - ids.length) * 23])))
    return out
  }, [])

  const apply = () => {
    const n = 30
    seq.run(Array.from({ length: n + 1 }, (_, i) => () => setClock((s.total * i) / n)), 120)
  }
  const pick = (c: Change) => {
    seq.stop()
    setClock(null)
    setChange(c)
  }
  const state = (id: string) => {
    if (p[id] === 'none') return 'none'
    if (clock === null) return 'planned'
    if (clock >= s.done[id]) return 'done'
    if (clock >= s.start[id]) return 'running'
    return 'planned'
  }

  return (
    <div className="demo tf">
      <div className="sub-tabs" role="tablist" aria-label="Change">
        {(Object.keys(CHANGES) as Change[]).map((c) => (
          <button key={c} type="button" role="tab" aria-selected={change === c} onClick={() => pick(c)}>{CHANGES[c].label}</button>
        ))}
      </div>
      <div className="demo-actions">
        <code className="net-cmd tf-plan">Plan: {summary(p)}.</code>
        <button type="button" className="demo-primary" onClick={apply} disabled={seq.running}>terraform apply</button>
      </div>
      <div className="seq-scroll">
        <svg className="tfg" viewBox="0 0 1110 170" role="img" aria-label="Resource graph">
          {STACK.flatMap((r) =>
            r.deps.map((d) => {
              const [x1, y1] = pos[d]
              const [x2, y2] = pos[r.id]
              return <path key={d + r.id} className="wire" d={`M${x1 + 170},${y1 + 15} C${x1 + 184},${y1 + 15} ${x2 - 14},${y2 + 15} ${x2},${y2 + 15}`} />
            }),
          )}
          {STACK.map((r) => {
            const [x, y] = pos[r.id]
            return (
              <g key={r.id} className={`res a-${p[r.id]} st-${state(r.id)}`} transform={`translate(${x} ${y})`}>
                <rect width={170} height={30} />
                <text x={8} y={19}>{SIGN[p[r.id]]} {short(r.id)}</text>
              </g>
            )
          })}
        </svg>
      </div>
      {CHANGES[change].note && <p className={`tf-note ${change === 'rename' ? 'bad' : ''}`}>{CHANGES[change].note}</p>}
      <div className="tiles">
        <div><p>Apply time</p><b>{clock === null ? `~${s.total.toFixed(1)} min` : `${clock.toFixed(1)} min`}</b></div>
        <div><p>Slowest path</p><b>{s.total ? short(STACK.filter((r) => p[r.id] !== 'none').reduce((a, r) => (s.done[r.id] > s.done[a.id] ? r : a)).id) : '·'}</b></div>
      </div>
    </div>
  )
}
