import { useCallback, useEffect, useLayoutEffect, useRef, useState, type MouseEvent as ME, type PointerEvent as PE } from 'react'
import ThemeToggle from '../components/ThemeToggle.tsx'
import { profile } from '../data'
import { deck, slides, type Point, type Slide, type Spot, type Step } from './content'
import { canadaPath, divisions, mapSize, terminals } from './map'
import VisualView from './visuals'
import Impact from './impact'
import Qr from './qr'
import Presenter from './presenter'
import { openChannel, openPresenter, type DeckMsg } from './channel'
import { Keys, Pointer, SlideGrid } from './tools'

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
// Pick a division to light up its terminals.
const perDivision = divisions.map((_, d) => terminals.filter((t) => t[2] === d).length)

function TerminalMap() {
  const [pick, setPick] = useState<number | null>(null)
  // only a dot or a division button picks; a click anywhere else moves the slide on
  const toggle = (e: ME, d: number) => {
    e.stopPropagation()
    setPick((cur) => (cur === d ? null : d))
  }
  return (
    <div className="deck-mapwrap">
      <svg
        className={`deck-map${pick === null ? '' : ' picking'}`}
        viewBox={`0 0 ${mapSize.w} ${mapSize.h}`}
        role="img"
        aria-label={pick === null ? `Map of Canada with ${terminals.length} terminals` : `${divisions[pick]}, ${perDivision[pick]} terminals`}
      >
        <path className="deck-map-land" d={canadaPath} />
        {terminals.map(([x, y, d], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="4.6"
            className={pick === d ? 'in' : ''}
            style={{ animationDelay: `${200 + i * 7}ms` }}
            onClick={(e) => toggle(e, d)}
          />
        ))}
      </svg>
      <div className="deck-divs" role="group" aria-label="Divisions">
        {divisions.map((name, d) => (
          <button key={name} type="button" aria-pressed={pick === d} onClick={(e) => toggle(e, d)}>
            {name} <span>{perDivision[d]}</span>
          </button>
        ))}
      </div>
    </div>
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

// The weekly cycle. Each step opens its own picture under the line.
function Steps({ steps, spot, setSpot }: { steps: Step[]; spot: number | null; setSpot: (i: number | null) => void }) {
  const open = spot === null ? null : steps[spot]
  return (
    <div className={`deck-cycle${open ? ' has-open' : ''}`}>
      <ol className="deck-steps">
        {steps.map((st, i) => (
          <li key={st.label} className={i === spot ? 'on' : ''}>
            <button
              type="button"
              aria-expanded={i === spot}
              onClick={(e) => { e.stopPropagation(); setSpot(i === spot ? null : i) }}
            >
              <span className="step-num">{i + 1}</span>
              <span className="step-label">{st.label}</span>
            </button>
          </li>
        ))}
      </ol>
      {open && spot !== null && (
        <div className="step-detail" key={spot} onClick={(e) => e.stopPropagation()}>
          <div className="step-copy">
            <p className="step-of">Step {spot + 1} of {steps.length}</p>
            <h2>{open.title}</h2>
            <p>{open.text}</p>
          </div>
          <div className="step-visual">
            <VisualView v={open.visual} />
          </div>
        </div>
      )}
    </div>
  )
}

// What opens next to a point on the list.
function PointDetail({ point }: { point: Point }) {
  return (
    <div className="point-detail" onClick={(e) => e.stopPropagation()}>
      <div className="point-visual">
        <VisualView v={point.visual} />
      </div>
      <div className="step-copy">
        <h2>{point.title}</h2>
        <p>{point.text}</p>
      </div>
    </div>
  )
}

function Visual({ slide, spot, setSpot }: ShotProps) {
  if (slide.image) return <Shot slide={slide} spot={spot} setSpot={setSpot} key={slide.image} />
  return (
    <div className="deck-visual">
      {slide.steps && <Steps steps={slide.steps} spot={spot} setSpot={setSpot} />}
      {slide.visual === 'map' && <TerminalMap />}
      {slide.visual === 'impact' && <Impact />}
      {slide.visual === 'qr' && <Qr />}
      {slide.points && spot !== null ? <PointDetail point={slide.points[spot]} key={spot} /> : slide.thumbs && <Work thumbs={slide.thumbs} />}
    </div>
  )
}

// /purolator-intern-event?presenter opens the presenter view instead
export default function EventPage() {
  return new URLSearchParams(location.search).has('presenter') ? <Presenter /> : <Deck />
}

function Deck() {
  const [at, setAt] = useState(fromHash)
  const [notes, setNotes] = useState(false)
  // the weekly cycle opens on its first step, so the slide never starts empty
  const [spot, setSpot] = useState<number | null>(() => (slides[fromHash()].steps ? 0 : null))
  const [back, setBack] = useState(false)
  const [panel, setPanel] = useState<'grid' | 'keys' | null>(null)
  const [pointer, setPointer] = useState(false)
  const channel = useRef<BroadcastChannel | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const slide = slides[at]
  const last = slides.length - 1
  // the parts a click steps through: zoom spots, steps, or points
  const spots = slide.spots ?? slide.steps ?? slide.points ?? []

  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(last, i))
    setBack(n < at)
    setAt(n)
    setNotes(false)
    setSpot(slides[n].steps ? 0 : null)
    history.replaceState(null, '', `#${n + 1}`)
  }, [last, at])

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
      const t = e.target instanceof Element ? e.target : null
      // the slider and other fields keep their own keys
      if (t?.closest('input, textarea, select')) return
      // a focused button already handles its own space and enter
      if ((k === ' ' || k === 'Enter') && t?.closest('button')) return
      if (k === 'g' || k === 'G') { setPanel((p) => (p === 'grid' ? null : 'grid')); return }
      if (k === '?') { setPanel((p) => (p === 'keys' ? null : 'keys')); return }
      if (panel) { if (k === 'Escape') setPanel(null); return }
      if (k === 'p' || k === 'P') { openPresenter(); return }
      if (k === 'l' || k === 'L') { setPointer((v) => !v); return }
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
  }, [at, last, go, advance, spot, spots.length, panel])

  // keep the presenter window in step, and let it move the slides
  useEffect(() => {
    const ch = openChannel()
    channel.current = ch
    return () => {
      ch?.close()
      channel.current = null
    }
  }, [])
  useEffect(() => {
    channel.current?.postMessage({ type: 'state', at, spot, notes } satisfies DeckMsg)
  }, [at, spot, notes])
  useEffect(() => {
    const ch = channel.current
    if (!ch) return
    const onMsg = (e: MessageEvent<DeckMsg>) => {
      const m = e.data
      if (m.type === 'hello') ch.postMessage({ type: 'state', at, spot, notes } satisfies DeckMsg)
      else if (m.type === 'goto') go(m.at)
      else if (m.type === 'cmd' && m.cmd === 'next') go(at + 1)
      else if (m.type === 'cmd' && m.cmd === 'prev') go(at - 1)
      else if (m.type === 'cmd') advance()
    }
    ch.addEventListener('message', onMsg)
    return () => ch.removeEventListener('message', onMsg)
  }, [at, spot, notes, go, advance])

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
            className={`deck-slide ${layout}${notes ? ' with-notes' : ''}${back ? ' from-left' : ''}`}
            onClick={advance}
            role="button"
            tabIndex={0}
            aria-label={step === 'notes' ? 'Show the notes' : step === 'zoom' ? 'Zoom into the next part' : 'Next slide'}
            key={at}
          >
            <div className="deck-main">
              <div className="deck-head">
                <div className="deck-headline">
                  <h1 className="deck-title">{slide.title}</h1>
                  {slide.line && <p className="deck-line">{slide.line}</p>}
                </div>
                {slide.spots && (
                  <ol className="deck-parts" aria-label="Parts of this screenshot">
                    {slide.spots.map((sp, i) => (
                      <li key={sp.title}>
                        <button
                          type="button"
                          aria-pressed={i === spot}
                          onClick={(e) => { e.stopPropagation(); setSpot(i === spot ? null : i) }}
                        >
                          <span>{i + 1}</span>
                          {sp.title}
                        </button>
                      </li>
                    ))}
                  </ol>
                )}
                {slide.points && (
                  <ul className="deck-points">
                    {slide.points.map((p, i) => (
                      <li key={p.label} className={i === spot ? 'on' : ''}>
                        <button
                          type="button"
                          aria-expanded={i === spot}
                          onClick={(e) => { e.stopPropagation(); setSpot(i === spot ? null : i) }}
                        >
                          {p.label}
                        </button>
                      </li>
                    ))}
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
            <button type="button" onClick={() => setPanel('grid')}>Slides</button>
            <button type="button" onClick={openPresenter} title="Notes, next slide and a timer in a new window">Presenter</button>
            <button type="button" onClick={fullscreen}>Full screen</button>
            <button type="button" className="deck-arrow" onClick={() => go(at + 1)} disabled={at === last} aria-label="Next slide">→</button>
          </div>
        </div>
        {pointer && <Pointer stage={stage} />}
        {panel === 'grid' && <SlideGrid at={at} onPick={(i) => { go(i); setPanel(null) }} onClose={() => setPanel(null)} />}
        {panel === 'keys' && <Keys onClose={() => setPanel(null)} />}
        <p className="ev-note">
          {deck.mockNote}, press <button type="button" onClick={() => setPanel('keys')}>?</button> for keys
        </p>
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
