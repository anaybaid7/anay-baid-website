import { useMemo, useState } from 'react'
import { useSequence } from '../sim/useSequence'
import { arrivals, BY_HAND, ONE_CLICK, serve, stats, type Visit } from './shift'

const RUSH = [
  { n: 8, gap: 12, label: 'Quiet' },
  { n: 15, gap: 8, label: 'Mail day' },
  { n: 24, gap: 5, label: 'Move in' },
]

const fmt = (s: number) => (s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`)

function Lane({ v, label, t, scale }: { v: Visit[]; label: string; t: number; scale: number }) {
  const s = stats(v)
  return (
    <div className="lane">
      <div className="lane-h">
        <b>{label}</b>
        <span>{s.line(t)} waiting</span>
        <span>longest wait {fmt(s.longest)}</span>
      </div>
      <svg viewBox={`0 0 600 ${v.length * 7 + 4}`} preserveAspectRatio="none" role="img" aria-label={`${label} timeline`}>
        {v.map((x, i) => (
          <g key={i} transform={`translate(0 ${i * 7 + 2})`}>
            {x.start > x.arrive && t > x.arrive && <rect className="wait" x={x.arrive * scale} width={(Math.min(t, x.start) - x.arrive) * scale} height={5} />}
            {t > x.start && <rect className="busy" x={x.start * scale} width={(Math.min(t, x.end) - x.start) * scale} height={5} />}
          </g>
        ))}
        <line className="now" x1={t * scale} x2={t * scale} y1={0} y2={v.length * 7 + 4} />
      </svg>
    </div>
  )
}

// Play a rush at the desk with both ways of logging side by side.
export default function Shift() {
  const [rush, setRush] = useState(1)
  const [t, setT] = useState(0)
  const seq = useSequence()
  const { n, gap } = RUSH[rush]
  const times = useMemo(() => arrivals(n, gap), [n, gap])
  const hand = useMemo(() => serve(times, BY_HAND), [times])
  const click = useMemo(() => serve(times, ONE_CLICK), [times])
  const end = stats(hand).done
  const scale = 600 / end

  const play = () => {
    const ticks = 40
    seq.run(Array.from({ length: ticks + 1 }, (_, i) => () => setT(Math.round((end * i) / ticks))), 120)
  }
  const pick = (i: number) => {
    seq.stop()
    setRush(i)
    setT(0)
  }

  return (
    <div className="demo shift">
      <p className="demo-hint">{n} students, one staff member. Pick a rush and play it.</p>
      <div className="demo-actions">
        <div className="mode" role="radiogroup" aria-label="Rush">
          {RUSH.map((r, i) => (
            <button key={r.label} type="button" role="radio" aria-checked={rush === i} onClick={() => pick(i)}>{r.label}</button>
          ))}
        </div>
        <button type="button" className="demo-primary" onClick={play} disabled={seq.running}>Play the rush</button>
      </div>
      <label className="demo-field">
        <span>Clock <b>{fmt(t)}</b></span>
        <input type="range" min={0} max={end} value={t} onChange={(e) => (seq.stop(), setT(+e.target.value))} />
      </label>
      <Lane v={hand} label={`By hand, ${BY_HAND}s each`} t={t} scale={scale} />
      <Lane v={click} label={`One click, ${ONE_CLICK}s each`} t={t} scale={scale} />
      <div className="tiles">
        <div><p>Last student, by hand</p><b>{fmt(end)}</b></div>
        <div><p>Last student, one click</p><b>{fmt(stats(click).done)}</b></div>
        <div><p>Desk time saved</p><b>{fmt(n * (BY_HAND - ONE_CLICK))}</b></div>
      </div>
      <p className="shift-key"><i className="wait" /> waiting <i className="busy" /> being logged</p>
    </div>
  )
}
