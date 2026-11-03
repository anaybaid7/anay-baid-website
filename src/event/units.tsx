import { useState } from 'react'
import { units, type Building } from './content'

// Pieces per stop: one short street shows what a piece and a stop are, then
// one terminal's day shows what density does to the number of routes. Mock
// numbers from content.ts.

type Mode = 'pieces' | 'stops' | null

const W = 660, H = 290, ROAD = 232, BOX = 13

// a plain outline for each kind of building, standing on the road
function shape(kind: Building, x: number) {
  const base = ROAD - 14
  if (kind === 'house') return `M${x},${base} v-44 l30,-26 l30,26 v44 z`
  if (kind === 'shop') return `M${x},${base} v-56 h70 v56 z M${x - 4},${base - 56} h78 v-10 h-78 z`
  if (kind === 'apartments') return `M${x},${base} v-112 h58 v112 z`
  return `M${x},${base} v-150 h64 v150 z`
}
const width = (kind: Building) => (kind === 'house' ? 60 : kind === 'shop' ? 70 : kind === 'apartments' ? 58 : 64)
const fmt = (n: number) => Math.round(n).toLocaleString('en-CA')

// the same day's parcels at a given density: how many stops, how many routes
const plan = (pps: number) => {
  const stops = units.day.pieces / pps
  return { stops, routes: Math.ceil(stops / units.day.perRoute) }
}
const MOST = plan(1).routes

export default function Units() {
  const [mode, setMode] = useState<Mode>(null)
  const [pps, setPps] = useState(units.day.pps)
  const pieces = units.stops.reduce((n, s) => n + s.pieces, 0)
  const toggle = (m: Mode) => setMode((cur) => (cur === m ? null : m))
  const now = plan(pps)
  const diff = now.routes - plan(units.day.pps).routes

  // spread the stops along the street, each one after the last
  const placed = units.stops.map((s, i) => ({
    ...s,
    x: 92 + units.stops.slice(0, i).reduce((n, p) => n + width(p.kind) + 54, 0),
  }))

  return (
    <div className="units" onClick={(e) => e.stopPropagation()}>
      <div className="units-pick" role="group" aria-label="What to count">
        <button type="button" aria-pressed={mode === 'pieces'} onClick={() => toggle('pieces')}>
          <b>{pieces}</b> pieces
        </button>
        <button type="button" aria-pressed={mode === 'stops'} onClick={() => toggle('stops')}>
          <b>{units.stops.length}</b> stops
        </button>
        <p className="units-ratio">
          <b>{(pieces / units.stops.length).toFixed(1)}</b> pieces per stop
        </p>
      </div>

      <svg className={`units-street${mode ? ` show-${mode}` : ''}`} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`A street with ${units.stops.length} stops and ${pieces} pieces`}>
        <line className="units-road" x1="0" x2={W} y1={ROAD} y2={ROAD} />
        <line className="units-lane" x1="0" x2={W} y1={ROAD + 22} y2={ROAD + 22} />
        <g className="units-van">
          <path d={`M14,${ROAD + 6} v-30 h38 l14,14 v16 z`} />
          <rect x="18" y={ROAD - 20} width="16" height="10" rx="1" />
        </g>

        {placed.map((s, i) => {
          const cols = Math.ceil(s.pieces / 3)
          const bx = s.x + width(s.kind) + 6
          return (
            <g key={i}>
              <path className="units-building" d={shape(s.kind, s.x)} />
              <text className="units-stop" x={s.x + width(s.kind) / 2} y={ROAD + 46} textAnchor="middle">Stop {i + 1}</text>
              {Array.from({ length: s.pieces }, (_, p) => (
                <rect
                  key={p}
                  className="units-box"
                  x={bx + Math.floor(p / 3) * (BOX + 3)}
                  y={ROAD - 14 - BOX - (p % 3) * (BOX + 3)}
                  width={BOX}
                  height={BOX}
                  rx="2"
                  style={{ transitionDelay: `${p * 30}ms` }}
                />
              ))}
              <text className="units-count" x={bx + (cols * (BOX + 3) - 3) / 2} y={ROAD - 14 - Math.min(s.pieces, 3) * (BOX + 3) - 8} textAnchor="middle">
                {s.pieces}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="units-day">
        <p className="units-sum">
          {fmt(units.day.pieces)} pieces ÷ {pps.toFixed(2)} = <b>{fmt(now.stops)} stops</b> ÷ {units.day.perRoute} a route = <b>{now.routes} routes</b>
        </p>
        <div className="units-routes" aria-hidden="true">
          {Array.from({ length: MOST }, (_, i) => <i key={i} className={i < now.routes ? 'on' : ''} />)}
        </div>
        <p className="units-verdict" aria-live="polite">
          {diff === 0 ? 'Same parcels, same routes' : `Same parcels, ${Math.abs(diff)} ${diff < 0 ? 'fewer' : 'more'} routes`}
          <span>Each route carries about {fmt(units.day.pieces / now.routes)} pieces</span>
        </p>
        <label className="units-slider">
          <span>Pieces per stop</span>
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
        <p className="impact-note">One terminal on one day, each block is a route, mock numbers</p>
      </div>
    </div>
  )
}
