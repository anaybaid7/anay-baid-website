import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ME, type PointerEvent as PE } from 'react'
import ThemeToggle from '../components/ThemeToggle.tsx'
import { profile } from '../data'
import { deck, slides, type Slide, type Spot } from './content'
import { canadaPath, mapSize, terminals } from './map'

// Which slide the address points at: /purolator-intern-event#3 opens slide 3.
const fromHash = () => {
  const n = parseInt(window.location.hash.slice(1), 10)
  return n >= 1 && n <= slides.length ? n - 1 : 0
}

// How far to zoom and where to move the picture so a spot fills the view.
// Everything is a fraction of the picture, so it works at any size.
function zoomFor(sp: Spot) {
  const s = Math.max(1.15, Math.min(3, 0.9 / Math.max(sp.w, sp.h * 0.92)))
  const cx = sp.x + sp.w / 2
  const cy = sp.y + sp.h / 2
  const tx = Math.min(0, Math.max(1 - s, 0.5 - cx * s))
  const ty = Math.min(0, Math.max(1 - s, 0.42 - cy * s))
  // put the caption on whichever side the spot isn't
  const left = cx * s + tx > 0.55
  const top = cy * s + ty > 0.6
  return { s, tx, ty, left, top }
}

const round = (v: number) => Math.round(v * 1000) / 1000

type ShotProps = { slide: Slide; spot: number | null; setSpot: (i: number | null) => void }

function Shot({ slide, spot, setSpot }: ShotProps) {
  const visual = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState(0)
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const [copied, setCopied] = useState('')
  const dragged = useRef(false)
  const spots = slide.spots ?? []
  const active = spot === null ? null : spots[spot]
  const z = active ? zoomFor(active) : null

  // Size the picture to fit the space, so the spots line up with it.
  useLayoutEffect(() => {
    const el = visual.current
    if (!el || !ratio || typeof ResizeObserver === 'undefined') return
    const fit = () => {
      const cs = getComputedStyle(el)
      const W = el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)
      const H = el.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom)
      const w = window.matchMedia('(max-width: 920px)').matches ? W : Math.min(W, H * ratio)
      setSize({ w, h: w / ratio })
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ratio])

  const at = (e: { clientX: number; clientY: number }) => {
    const r = frame.current!.getBoundingClientRect()
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height }
  }

  // Shift and drag draws a box and copies it, for adding spots in content.ts.
  const down = (e: PE) => {
    if (!e.shiftKey || z) return
    const p = at(e)
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y })
    frame.current!.setPointerCapture(e.pointerId)
  }
  const move = (e: PE) => {
    if (!drag) return
    const p = at(e)
    setDrag({ ...drag, x1: p.x, y1: p.y })
  }
  const up = () => {
    if (!drag) return
    const box = `{ x: ${round(Math.min(drag.x0, drag.x1))}, y: ${round(Math.min(drag.y0, drag.y1))}, w: ${round(Math.abs(drag.x1 - drag.x0))}, h: ${round(Math.abs(drag.y1 - drag.y0))}, title: '', text: '' }`
    navigator.clipboard?.writeText(box).catch(() => {})
    setCopied(box)
    setDrag(null)
    dragged.current = true
  }

  // A click on the picture zooms to the smallest spot under it, or back out.
  const click = (e: ME) => {
    if (dragged.current) { dragged.current = false; e.stopPropagation(); return }
    if (z) { e.stopPropagation(); setSpot(null); return }
    const p = at(e)
    const hit = spots
      .map((sp, i) => ({ sp, i }))
      .filter(({ sp }) => p.x >= sp.x && p.x <= sp.x + sp.w && p.y >= sp.y && p.y <= sp.y + sp.h)
      .sort((a, b) => a.sp.w * a.sp.h - b.sp.w * b.sp.h)[0]
    if (hit) { e.stopPropagation(); setSpot(hit.i) }
  }

  // bigger boxes first, so a smaller one inside them stays clickable
  const order = spots.map((sp, i) => ({ sp, i })).sort((a, b) => b.sp.w * b.sp.h - a.sp.w * a.sp.h)

  return (
    <div className="deck-visual" ref={visual}>
      <div className="deck-frame" style={size ? { width: size.w, height: size.h } : undefined}>
        <div
          className={`deck-pic${z ? ' zoomed' : ''}${spots.length ? ' has-spots' : ''}`}
          ref={frame}
          onClick={click}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
        >
          <div
            className="deck-layer"
            style={z ? { transform: `translate(${z.tx * 100}%, ${z.ty * 100}%) scale(${z.s})`, ['--s' as string]: z.s } : undefined}
          >
            <img
              className="deck-img"
              src={slide.image}
              alt={slide.title}
              draggable={false}
              onLoad={(e) => setRatio(e.currentTarget.naturalWidth / e.currentTarget.naturalHeight)}
            />
            {order.map(({ sp, i }) => (
              <button
                key={i}
                type="button"
                className="deck-spot"
                style={{ left: `${sp.x * 100}%`, top: `${sp.y * 100}%`, width: `${sp.w * 100}%`, height: `${sp.h * 100}%` }}
                onClick={(e) => { e.stopPropagation(); setSpot(i) }}
                tabIndex={z ? -1 : 0}
                aria-label={`Zoom in, ${sp.title}`}
              >
                <span className="deck-pin">{i + 1}</span>
                <span className="deck-tag">{sp.title}</span>
              </button>
            ))}
            {active && (
              <div
                className="deck-focus"
                style={{ left: `${active.x * 100}%`, top: `${active.y * 100}%`, width: `${active.w * 100}%`, height: `${active.h * 100}%` }}
              />
            )}
          </div>
          {drag && (
            <div
              className="deck-draw"
              style={{
                left: `${Math.min(drag.x0, drag.x1) * 100}%`,
                top: `${Math.min(drag.y0, drag.y1) * 100}%`,
                width: `${Math.abs(drag.x1 - drag.x0) * 100}%`,
                height: `${Math.abs(drag.y1 - drag.y0) * 100}%`,
              }}
            />
          )}
        </div>
        {active && z && spot !== null && (
          <div
            className={`deck-callout${z.left ? ' on-left' : ''}${z.top ? ' on-top' : ''}`}
            key={spot}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="deck-callout-n">{spot + 1} of {spots.length}</p>
            <p className="deck-callout-title">{active.title}</p>
            <p className="deck-callout-text">{active.text}</p>
            <div className="deck-callout-nav">
              <button type="button" onClick={() => setSpot(spot > 0 ? spot - 1 : null)}>{spot > 0 ? '← Back' : 'Zoom out'}</button>
              {spot < spots.length - 1
                ? <button type="button" onClick={() => setSpot(spot + 1)}>Next part →</button>
                : <button type="button" onClick={() => setSpot(null)}>Zoom out</button>}
            </div>
          </div>
        )}
        {copied && (
          <p className="deck-copied" onClick={(e) => { e.stopPropagation(); setCopied('') }}>
            Copied <code>{copied}</code>
          </p>
        )}
      </div>
    </div>
  )
}

// The opening slide: every terminal on a map, filling in west to east.
function TerminalMap() {
  return (
    <svg className="deck-map" viewBox={`0 0 ${mapSize.w} ${mapSize.h}`} role="img" aria-label={`Map of Canada with ${terminals.length} terminals`}>
      <path className="deck-map-land" d={canadaPath} />
      {terminals.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4.6" style={{ animationDelay: `${200 + i * 7}ms` }} />
      ))}
    </svg>
  )
}

// The closing slide: the two things I built, stacked like windows.
function Work({ thumbs }: { thumbs: string[] }) {
  return (
    <div className="deck-work">
      {thumbs.map((t, i) => <img key={t} src={t} alt="" className={`deck-thumb t${i}`} />)}
    </div>
  )
}

function Visual({ slide, spot, setSpot }: ShotProps) {
  if (slide.image) return <Shot slide={slide} spot={spot} setSpot={setSpot} key={slide.image} />
  return (
    <div className="deck-visual">
      {slide.steps && (
        <ol className="deck-steps">
          {slide.steps.map((s) => <li key={s}><span>{s}</span></li>)}
        </ol>
      )}
      {slide.visual === 'map' && <TerminalMap />}
      {slide.thumbs && <Work thumbs={slide.thumbs} />}
    </div>
  )
}

export default function EventPage() {
  const [at, setAt] = useState(fromHash)
  const [notes, setNotes] = useState(false)
  const [spot, setSpot] = useState<number | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const slide = slides[at]
  const last = slides.length - 1
  const spots = slide.spots ?? []

  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(last, i))
    setAt(n)
    setNotes(false)
    setSpot(null)
    history.replaceState(null, '', `#${n + 1}`)
  }, [last])

  // Each click shows the next thing: the notes, then each part of the
  // screenshot zoomed in, then the next slide.
  const nextSpot = spot === null ? 0 : spot + 1
  const advance = useCallback(() => {
    if (!notes && slide.notes.length) setNotes(true)
    else if (nextSpot < spots.length) setSpot(nextSpot)
    else if (at < last) go(at + 1)
  }, [notes, slide, nextSpot, spots.length, at, last, go])
  const step = !notes && slide.notes.length ? 'notes' : nextSpot < spots.length ? 'zoom' : 'next'

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen()
    else stage.current?.requestFullscreen?.()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const k = e.key
      // a focused button already handles its own space and enter
      if ((k === ' ' || k === 'Enter') && (e.target as HTMLElement).closest('button')) return
      if (k === 'ArrowRight' || k === 'PageDown') { e.preventDefault(); go(at + 1) }
      else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); go(at - 1) }
      else if (k === ' ' || k === 'Enter') { e.preventDefault(); advance() }
      else if (k === 'n' || k === 'N' || k === 'ArrowDown' || k === 'ArrowUp') { e.preventDefault(); setNotes((v) => !v) }
      else if (k === 'Escape' && spot !== null) setSpot(null)
      else if (/^[1-9]$/.test(k) && +k <= spots.length) setSpot(+k - 1)
      else if (k === 'Home') go(0)
      else if (k === 'End') go(last)
      else if (k === 'f' || k === 'F') fullscreen()
    }
    const onHash = () => go(fromHash())
    window.addEventListener('keydown', onKey)
    window.addEventListener('hashchange', onHash)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('hashchange', onHash)
    }
  }, [at, last, go, advance, spot, spots.length])

  // Load the next screenshot early so it doesn't pop in while presenting.
  useEffect(() => {
    const next = slides[at + 1]?.image
    if (next) new Image().src = next
  }, [at])

  const layout = slide.image || slide.steps ? 'is-stack' : 'is-split'

  return (
    <>
      <header className="top wrap ev-top">
        <a className="top-name ev-home" href="/">Anay Baid</a>
        <span className="top-time">{deck.kicker}</span>
        <nav aria-label="Site">
          <a href="/">Main site</a>
          <ThemeToggle />
        </nav>
      </header>

      <main className="ev-main">
        <div className="deck" ref={stage}>
          <div
            className={`deck-slide ${layout}${notes ? ' with-notes' : ''}`}
            onClick={advance}
            role="button"
            tabIndex={0}
            aria-label={step === 'notes' ? 'Show the notes' : step === 'zoom' ? 'Zoom into the next part' : 'Next slide'}
            key={at}
          >
            <div className="deck-main">
              <div className="deck-head">
                <h1 className="deck-title">{slide.title}</h1>
                {slide.line && <p className="deck-line">{slide.line}</p>}
                {slide.points && (
                  <ul className="deck-points">
                    {slide.points.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                )}
              </div>
              <Visual slide={slide} spot={spot} setSpot={setSpot} />
            </div>
            <aside className="deck-notes" aria-hidden={!notes}>
              <p className="deck-notes-head">Notes</p>
              <ul>
                {slide.notes.map((n, i) => <li key={n} style={{ transitionDelay: `${notes ? 80 + i * 50 : 0}ms` }}>{n}</li>)}
              </ul>
            </aside>
          </div>

          <div className="deck-bar">
            <button type="button" className="deck-arrow" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Previous slide">←</button>
            <div className="deck-track" role="tablist" aria-label="Slides">
              {slides.map((s, i) => (
                <button
                  key={s.title + i}
                  type="button"
                  role="tab"
                  aria-selected={i === at}
                  aria-label={`Slide ${i + 1}, ${s.title}`}
                  className={i <= at ? 'done' : ''}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <span className="deck-where">
              <span className="deck-section">{slide.label}</span>
              <span className="deck-count">{at + 1} / {slides.length}</span>
            </span>
            <button type="button" onClick={() => setNotes((v) => !v)} aria-pressed={notes}>Notes</button>
            <button type="button" onClick={fullscreen}>Full screen</button>
            <button type="button" className="deck-arrow" onClick={() => go(at + 1)} disabled={at === last} aria-label="Next slide">→</button>
          </div>
        </div>
        <p className="ev-note">{deck.mockNote}</p>
      </main>

      <footer className="foot ev-foot">
        <div className="wrap foot-row">
          <span className="foot-links">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
            <a href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
            <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
          </span>
        </div>
      </footer>
    </>
  )
}
