import { useEffect, useState, type RefObject } from 'react'
import { slides } from './content'

// Small helpers for presenting: every slide at once (G), a pointer for the
// projector (L) and the list of keys (?).

const mins = (secs: number) => (secs >= 60 ? `${Math.floor(secs / 60)}m ${secs % 60}s` : `${secs}s`)

export function SlideGrid({ at, onPick, onClose }: { at: number; onPick: (i: number) => void; onClose: () => void }) {
  return (
    <div className="grid-shade" onClick={onClose}>
      <div className="grid-panel" role="dialog" aria-label="All slides" onClick={(e) => e.stopPropagation()}>
        <p className="grid-head">
          All slides <span>press G or Esc to close</span>
        </p>
        <ol className="grid-list">
          {slides.map((s, i) => (
            <li key={s.title}>
              <button type="button" className={i === at ? 'on' : ''} onClick={() => onPick(i)} autoFocus={i === at}>
                <span className="grid-n">{i + 1}</span>
                <span className="grid-label">{s.label}</span>
                <span className="grid-title">{s.title}</span>
                <span className="grid-time">{mins(s.time)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

// a bright dot that follows the mouse over the slides
export function Pointer({ stage }: { stage: RefObject<HTMLElement | null> }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const move = (e: PointerEvent) => setPos({ x: e.clientX, y: e.clientY })
    const leave = () => setPos(null)
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    el.classList.add('pointing')
    return () => {
      el.removeEventListener('pointermove', move)
      el.removeEventListener('pointerleave', leave)
      el.classList.remove('pointing')
    }
  }, [stage])
  if (!pos) return null
  return <span className="pointer-dot" style={{ left: pos.x, top: pos.y }} aria-hidden="true" />
}

const KEYS: [string, string][] = [
  ['Space or click', 'Notes, then each part, then the next slide'],
  ['← →', 'Previous or next slide'],
  ['1 to 9', 'Open that part of the slide'],
  ['Esc', 'Close what is open'],
  ['N', 'Show or hide the notes'],
  ['G', 'All slides'],
  ['P', 'Presenter view in a new window'],
  ['L', 'Pointer'],
  ['F', 'Full screen'],
]

export function Keys({ onClose }: { onClose: () => void }) {
  return (
    <div className="grid-shade" onClick={onClose}>
      <div className="keys-panel" role="dialog" aria-label="Keys" onClick={(e) => e.stopPropagation()}>
        <p className="grid-head">
          Keys <span>press ? or Esc to close</span>
        </p>
        <dl>
          {KEYS.map(([k, what]) => (
            <div key={k}>
              <dt><kbd>{k}</kbd></dt>
              <dd>{what}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
