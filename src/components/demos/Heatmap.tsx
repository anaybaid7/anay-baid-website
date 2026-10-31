import { useMemo, useState } from 'react'
import { CAUSE, DAYS, FAULTS, grid, THEATRES } from './heatmap'

const shade = (d: number) => {
  if (!d) return undefined
  const k = Math.min(1, 0.25 + Math.log10(Math.abs(d)) / 4)
  return `color-mix(in srgb, var(${d > 0 ? '--warn' : '--bad'}) ${Math.round(k * 100)}%, transparent)`
}

// Every theatre and day of a month, Azure count minus on-prem count. Click
// a cell to see why it's off and fix it.
export default function Heatmap() {
  const [fixed, setFixed] = useState<Set<string>>(new Set())
  const [pick, setPick] = useState<string | null>(null)
  const { g, owner } = useMemo(() => grid(fixed), [fixed])
  const f = FAULTS.find((x) => x.id === pick)
  const left = FAULTS.length - fixed.size

  const fix = (id: string) => {
    setFixed((s) => new Set(s).add(id))
    setPick(null)
  }

  return (
    <div className="demo heat">
      <p className="demo-hint">Click a coloured cell.</p>
      <div className="heat-scroll">
        <table className="heat-grid" aria-label="Row count difference, Azure minus on-prem">
          <thead>
            <tr>
              <th>Theatre</th>
              {Array.from({ length: DAYS / 7 }, (_, w) => (
                <th key={w} colSpan={7}>Feb {w * 7 + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {THEATRES.map((t, r) => (
              <tr key={t}>
                <th>{t}</th>
                {g[r].map((d, c) => (
                  <td key={c}>
                    {d ? (
                      <button
                        type="button"
                        className={owner[r][c] === pick ? 'on' : ''}
                        style={{ background: shade(d) }}
                        aria-label={`Theatre ${t}, Feb ${c + 1}, ${d > 0 ? '+' : ''}${d} rows`}
                        onClick={() => setPick(owner[r][c])}
                      />
                    ) : (
                      <i />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="heat-key">
        <i style={{ background: shade(400) }} /> extra on Azure <i style={{ background: shade(-400) }} /> missing on-prem
        <span>{left ? `${left} faults left` : 'Both copies agree'}</span>
      </p>

      {f && (
        <div className="heat-drill">
          <h4>{CAUSE[f.cause].title}</h4>
          <p>
            Theatre {THEATRES[f.theatre]}, {f.cells.map(([o, d]) => `Feb ${f.day + o + 1} ${d > 0 ? '+' : ''}${d}`).join(', ')}
          </p>
          <pre>{CAUSE[f.cause].sql}</pre>
          <div className="demo-actions">
            <button type="button" className="demo-primary" onClick={() => fix(f.id)}>{CAUSE[f.cause].fix}</button>
          </div>
        </div>
      )}
    </div>
  )
}
