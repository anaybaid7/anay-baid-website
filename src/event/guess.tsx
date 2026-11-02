import { useRef, useState, type PointerEvent } from 'react'
import { guess } from './content'

// The opening game: eight weeks of one terminal, the room guesses the ninth,
// then the real number shows up. Drag the dashed bar or use the slider.
// `shown` comes from the deck, so space and the presenter view reveal it too.

const W = 640, H = 320, L = 8, R = 8, T = 40, B = 46
const TOP = 120_000
const fmt = (n: number) => Math.round(n).toLocaleString('en-CA')
const k = (n: number) => `${Math.round(n / 1000)}K`

export default function Guess({ shown, onShow }: { shown: boolean; onShow: (show: boolean) => void }) {
  const { weeks, actual, hint } = guess
  const last = weeks[weeks.length - 1].value
  const [pick, setPick] = useState(last)
  const svg = useRef<SVGSVGElement>(null)

  const n = weeks.length + 1
  const step = (W - L - R) / n
  const bw = step * 0.62
  const X = (i: number) => L + step * i + (step - bw) / 2
  const Y = (v: number) => T + (H - T - B) * (1 - v / TOP)
  const nx = X(weeks.length)

  // dragging anywhere on the chart sets the guess from the pointer's height
  const fromPointer = (e: PointerEvent<SVGSVGElement>) => {
    if (shown || !svg.current) return
    const r = svg.current.getBoundingClientRect()
    const y = ((e.clientY - r.top) / r.height) * H
    const v = TOP * (1 - (y - T) / (H - T - B))
    setPick(Math.round(Math.min(TOP, Math.max(40_000, v)) / 500) * 500)
  }

  const off = pick - actual.value
  const verdict =
    Math.abs(off) <= 3000
      ? { head: 'Spot on, you saw the holiday coming', sub: actual.note }
      : { head: `${fmt(Math.abs(off))} parcels too ${off > 0 ? 'high' : 'low'}`, sub: actual.note }

  return (
    <div className="guess" onClick={(e) => e.stopPropagation()}>
      <svg
        ref={svg}
        className={`guess-chart${shown ? ' shown' : ''}`}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Weekly parcels for one terminal over eight weeks, guess for the week of ${actual.label}`}
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId)
          fromPointer(e)
        }}
        onPointerMove={(e) => e.buttons && fromPointer(e)}
      >
        <line x1={L} x2={W - R} y1={Y(0)} y2={Y(0)} className="vz-grid" />
        {weeks.map((w, i) => (
          <g key={w.label} className={`guess-week${shown && i === hint ? ' hint' : ''}`}>
            <rect x={X(i)} y={Y(w.value)} width={bw} height={Y(0) - Y(w.value)} rx="3" />
            <text x={X(i) + bw / 2} y={H - B + 20} textAnchor="middle" className="vz-axis">{w.label}</text>
            {shown && i === hint && (
              <text x={X(i) + bw / 2} y={Y(w.value) - 10} textAnchor="middle" className="guess-tag">{w.note}</text>
            )}
          </g>
        ))}

        <g className="guess-next">
          <rect className="guess-pick" x={nx} y={Y(pick)} width={bw} height={Y(0) - Y(pick)} rx="3" />
          {shown && <rect className="guess-real" x={nx} y={Y(actual.value)} width={bw} height={Y(0) - Y(actual.value)} rx="3" />}
          <text x={nx + bw / 2} y={Y(Math.max(pick, shown ? actual.value : 0)) - 10} textAnchor="middle" className="guess-val">
            {shown ? k(actual.value) : `${k(pick)}?`}
          </text>
          <text x={nx + bw / 2} y={H - B + 20} textAnchor="middle" className="vz-axis strong">{actual.label}</text>
          <text x={nx + bw / 2} y={H - B + 38} textAnchor="middle" className="vz-axis">next week</text>
        </g>
      </svg>

      {shown ? (
        <div className="guess-result" aria-live="polite">
          <p className="guess-verdict">
            <b>{verdict.head}</b>
            <span>{verdict.sub}</span>
          </p>
          <p className="guess-moral">That's our job every week, for 135 terminals</p>
          <button type="button" className="guess-again" onClick={() => onShow(false)}>Try again</button>
        </div>
      ) : (
        <div className="guess-controls">
          <label>
            <span>Room's guess <b>{fmt(pick)}</b></span>
            <input
              type="range"
              min={40_000}
              max={TOP}
              step={500}
              value={pick}
              onChange={(e) => setPick(Number(e.target.value))}
              aria-label="The room's guess for next week"
            />
          </label>
          <button type="button" className="guess-go" onClick={() => onShow(true)}>Show what happened</button>
        </div>
      )}
      <p className="impact-note">One terminal, weekly parcels, mock numbers</p>
    </div>
  )
}
