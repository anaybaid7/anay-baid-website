import { useMemo, useState } from 'react'
import { useSequence } from '../sim/useSequence'
import { at, BASE, CHANGES, drift, HOSTS, ITEMS, WEEKS } from './drift'

// Play a quarter of hand patching, then switch to one image and play it again.
export default function Drift() {
  const [week, setWeek] = useState(0)
  const [imaged, setImaged] = useState<number | null>(null)
  const seq = useSequence()
  const cfg = useMemo(() => at(week, imaged), [week, imaged])
  const series = useMemo(() => Array.from({ length: WEEKS + 1 }, (_, w) => drift(at(w, imaged))), [imaged])
  const now = CHANGES.filter(([w]) => w === week)

  const play = () => {
    seq.run(Array.from({ length: WEEKS + 1 }, (_, w) => () => setWeek(w)), 450)
  }
  const switchToImage = () => {
    setImaged(week)
  }
  const max = Math.max(...series, 1)

  return (
    <div className="demo drift">
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={play} disabled={seq.running}>Play 12 weeks</button>
        <button type="button" onClick={switchToImage} disabled={seq.running || imaged !== null}>Rebuild every host from one image</button>
        <button type="button" onClick={() => (setImaged(null), setWeek(0))} disabled={seq.running}>Reset</button>
      </div>
      <label className="demo-field">
        <span>Week <b>{week}</b></span>
        <input type="range" min={0} max={WEEKS} value={week} onChange={(e) => setWeek(+e.target.value)} />
      </label>

      <div className="drift-wrap">
        <table className="drift-grid" aria-label={`Host settings in week ${week}`}>
          <thead>
            <tr>
              <th>Host</th>
              {ITEMS.map((i) => <th key={i.key}>{i.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {HOSTS.map((h, r) => (
              <tr key={h}>
                <th>{h}</th>
                {ITEMS.map(({ key }) => {
                  const v = cfg[r][key]
                  const odd = cfg.filter((c) => c[key] === v).length <= cfg.length / 2
                  const fresh = imaged === null && now.some(([, hi, k]) => hi === r && k === key)
                  return (
                    <td key={key} className={[v !== BASE[key] ? 'changed' : '', odd ? 'odd' : '', fresh ? 'fresh' : ''].join(' ')}>{v}</td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="drift-foot">
        <svg className="spark" viewBox="0 0 260 60" role="img" aria-label="Settings out of step, per week">
          <polyline points={series.map((v, w) => `${10 + w * 20},${52 - (v / max) * 42}`).join(' ')} />
          <line className="now" x1={10 + week * 20} x2={10 + week * 20} y1={4} y2={56} />
          {imaged !== null && <line className="cut" x1={10 + imaged * 20} x2={10 + imaged * 20} y1={4} y2={56} />}
        </svg>
        <div className="tiles">
          <div className={series[week] ? 'warn' : ''}><p>Settings out of step</p><b>{series[week]}</b></div>
          <div><p>Hosts on {imaged === null ? 'their own builds' : 'one image'}</p><b>{imaged === null ? new Set(cfg.map((c) => JSON.stringify(c))).size : 1}</b></div>
        </div>
      </div>
    </div>
  )
}
