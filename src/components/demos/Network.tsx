import { useState } from 'react'
import { useSequence } from '../sim/useSequence'
import { RULES, walk, type Hop, type Src, type Try } from './network'

const POS = { laptop: [60, 150], igw: [210, 150], bastion: [360, 90], db: [560, 200] } as const

// Try to reach the database directly or through the bastion, from the office
// or from somewhere else, and see which boundary stops it.
export default function Network() {
  const [src, setSrc] = useState<Src>('office')
  const [hops, setHops] = useState<Hop[]>([])
  const [tried, setTried] = useState<Try | null>(null)
  const seq = useSequence()

  const go = (t: Try) => {
    const path = walk(t, src)
    setTried(t)
    setHops([])
    seq.run(path.map((_, i) => () => setHops(path.slice(0, i + 1))), 650)
  }

  const last = hops[hops.length - 1]
  const done = !seq.running && hops.length > 0
  const at = (id: Hop['at']) => hops.find((h) => h.at === id)
  const cmd = tried === 'tunnel' ? 'ssh -N -L 5433:db.internal:5432 ops@bastion' : 'psql -h db.internal -p 5432 appraisals'

  return (
    <div className="demo net">
      <p className="demo-hint">Pick where you are, then try to reach the database.</p>
      <div className="demo-actions">
        <div className="mode" role="radiogroup" aria-label="Where you are">
          {(['office', 'cafe'] as Src[]).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={src === s} onClick={() => setSrc(s)} disabled={seq.running}>
              {s === 'office' ? 'Office' : 'Cafe wifi'}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => go('direct')} disabled={seq.running}>Connect directly</button>
        <button type="button" className="demo-primary" onClick={() => go('tunnel')} disabled={seq.running}>Open the tunnel</button>
      </div>

      <svg className="topo" viewBox="0 0 640 280" role="img" aria-label="Network path">
        <rect className="vpc" x={290} y={20} width={340} height={250} />
        <text className="zone" x={300} y={40}>VPC 10.0.0.0/16</text>
        <rect className="subnet pub" x={300} y={52} width={130} height={96} />
        <text className="zone" x={308} y={140}>public 10.0.1.0/24</text>
        <rect className="subnet priv" x={450} y={130} width={170} height={130} />
        <text className="zone" x={458} y={252}>private 10.0.2.0/24</text>

        {hops.slice(1).map((h, i) => {
          const [x1, y1] = POS[hops[i].at]
          const [x2, y2] = POS[h.at]
          return <line key={h.at} className={`hop ${h.ok ? 'ok' : 'bad'}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        })}

        {(Object.keys(POS) as Hop['at'][]).map((id) => {
          const [x, y] = POS[id]
          const h = at(id)
          const label = { laptop: 'Laptop', igw: 'Gateway', bastion: 'Bastion', db: 'SQL db' }[id]
          return (
            <g key={id} className={`tn ${h ? (h.ok ? 'ok' : 'bad') : ''}`}>
              <rect x={x - 42} y={y - 20} width={84} height={40} />
              <text x={x} y={y + 5} textAnchor="middle">{label}</text>
            </g>
          )
        })}
        {last && !last.ok && (
          <text className="x" x={POS[last.at][0]} y={POS[last.at][1] - 28} textAnchor="middle">✕</text>
        )}
      </svg>

      <div className="net-grid">
        <div>
          <code className="net-cmd">$ {tried ? cmd : 'not connected'}</code>
          <ol className="hops" aria-live="polite">
            {hops.map((h) => (
              <li key={h.at} className={h.ok ? '' : 'bad'}>{h.text}</li>
            ))}
          </ol>
          {done && <p className={`net-verdict ${last.ok ? 'ok' : 'bad'}`}>{last.ok ? 'localhost:5433 now reaches the database' : 'Refused'}</p>}
        </div>
        <table className="rules" aria-label="Inbound rules">
          <thead><tr><th>On</th><th>Port</th><th>Allow from</th></tr></thead>
          <tbody>
            {RULES.map((r) => {
              const hit = hops.find((h) => h.rule === r.id)
              return (
                <tr key={r.id} className={hit ? (hit.ok ? 'ok' : 'bad') : ''}>
                  <td>{r.on}</td><td>{r.port}</td><td>{r.from}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
