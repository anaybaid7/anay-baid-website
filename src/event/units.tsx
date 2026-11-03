import { useEffect, useRef, useState } from 'react'
import { units } from './content'

// Pieces per stop: the ratio as a fraction, and what moving it does to one
// terminal's day. Mock numbers from content.ts.

const fmt = (n: number) => Math.round(n).toLocaleString('en-CA')
const { pieces, perRoute, pps: start } = units
const routesAt = (pps: number) => Math.ceil(pieces / pps / perRoute)
const MOST = routesAt(1)

// counts a number toward its new value instead of jumping
function useTween(target: number) {
  const [shown, setShown] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    const a = from.current, t0 = performance.now()
    let id = 0
    const tick = (now: number) => {
      const k = Math.min(1, (now - t0) / 400)
      const v = a + (target - a) * (1 - (1 - k) ** 3)
      from.current = v
      setShown(v)
      if (k < 1) id = requestAnimationFrame(tick)
    }
    id = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(id)
  }, [target])
  return shown
}

export default function Units() {
  const [pps, setPps] = useState(start)
  const stops = useTween(pieces / pps)
  const routes = routesAt(pps)
  const shownRoutes = useTween(routes)
  const diff = routes - routesAt(start)

  return (
    <div className="units" onClick={(e) => e.stopPropagation()}>
      <div className="units-ratio" aria-live="polite">
        <div className="units-frac">
          <span><b>{fmt(pieces)}</b> pieces</span>
          <span><b>{fmt(stops)}</b> stops</span>
        </div>
        <span className="units-eq">=</span>
        <p className="units-pps"><b>{pps.toFixed(2)}</b> pieces per stop</p>
      </div>

      <div className="units-routes">
        <p>
          <span>Routes needed</span>
          <b>{Math.round(shownRoutes)}</b>
        </p>
        <div className="units-bar"><i style={{ width: `${(routes / MOST) * 100}%` }} /></div>
        <p className={`units-verdict${diff < 0 ? ' good' : diff > 0 ? ' bad' : ''}`}>
          {diff === 0 ? `About ${fmt(pieces / routes)} pieces on each route` : `Same parcels, ${Math.abs(diff)} ${diff < 0 ? 'fewer' : 'more'} routes`}
        </p>
      </div>

      <label className="units-slider">
        <input
          type="range"
          min={1}
          max={2}
          step={0.05}
          value={pps}
          onChange={(e) => setPps(Number(e.target.value))}
          aria-label="Pieces per stop"
        />
        <span className="units-ends"><span>Spread out</span><span>Dense</span></span>
      </label>
      <p className="units-note">One terminal on one day, a route fits about {perRoute} stops, mock numbers</p>
    </div>
  )
}
