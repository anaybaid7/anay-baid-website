import { useMemo, useState } from 'react'
import { allocate, type Site } from './allocate'

const START: Site[] = [
  { name: 'Terminal A', share: 35, capacity: 3600 },
  { name: 'Terminal B', share: 30, capacity: 3200 },
  { name: 'Terminal C', share: 20, capacity: 2600 },
  { name: 'Terminal D', share: 15, capacity: 2400 },
]
const fmt = (n: number) => n.toLocaleString('en-CA')
const list = (items: string[]) => new Intl.ListFormat('en-CA', { type: 'conjunction' }).format(items)

// The idea behind the allocation work at Purolator, on four made-up terminals:
// split a week's volume by forecast share, respect each terminal's capacity,
// move the overflow somewhere with room, and say where it doesn't fit.
export default function Allocation() {
  const [volume, setVolume] = useState(10000)
  const [sites, setSites] = useState(START)
  const result = useMemo(() => allocate(volume, sites), [volume, sites])
  const max = Math.max(...sites.map((s) => s.capacity), ...result.placed) * 1.08
  const total = result.placed.reduce((a, b) => a + b, 0)
  const full = sites.filter((_, i) => result.capped[i]).map((s) => s.name)

  return (
    <div className="demo alloc">
      <p className="demo-lede">
        Split a week's parcels across terminals by forecast share without going over capacity. Drag the sliders.
      </p>
      <label className="demo-field">
        <span>Weekly volume <b>{fmt(volume)}</b></span>
        <input type="range" min={4000} max={14000} step={250} value={volume} onChange={(e) => setVolume(+e.target.value)} />
      </label>
      <ul className="alloc-rows">
        {sites.map((s, i) => {
          const target = (volume * s.share) / sites.reduce((a, b) => a + b.share, 0)
          return (
            <li key={s.name} className={result.capped[i] ? 'full' : ''}>
              <div className="alloc-head">
                <b>{s.name}</b>
                <span>{s.share}% share</span>
                <span className="alloc-num">{fmt(result.placed[i])} placed</span>
              </div>
              <div className="alloc-bar" aria-hidden="true">
                <i className="alloc-fill" style={{ width: `${(result.placed[i] / max) * 100}%` }} />
                <i className="alloc-target" style={{ left: `${(target / max) * 100}%` }} title="Share of the volume" />
                <i className="alloc-cap" style={{ left: `${(s.capacity / max) * 100}%` }} />
              </div>
              <label className="demo-field small">
                <span>Capacity {fmt(s.capacity)}</span>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={s.capacity}
                  aria-label={`${s.name} capacity`}
                  onChange={(e) => setSites(sites.map((x, j) => (j === i ? { ...x, capacity: +e.target.value } : x)))}
                />
              </label>
            </li>
          )
        })}
      </ul>
      <p className={result.short ? 'demo-out warn' : 'demo-out'} aria-live="polite">
        {result.short
          ? `Bottleneck. ${fmt(result.short)} parcels don't fit anywhere, every terminal is full.`
          : full.length
            ? `${list(full)} ${full.length === 1 ? 'is' : 'are'} at capacity, the overflow moved to terminals with room. All ${fmt(total)} placed.`
            : `Everything fits on share alone. All ${fmt(total)} placed.`}
      </p>
      <p className="demo-legend">
        <i className="k-fill" /> placed <i className="k-target" /> share of the volume <i className="k-cap" /> capacity
      </p>
      <p className="demo-note">Made-up terminals and numbers, just to show the idea.</p>
    </div>
  )
}
