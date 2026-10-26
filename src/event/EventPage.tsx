import { useCallback, useEffect, useRef, useState } from 'react'
import ThemeToggle from '../components/ThemeToggle.tsx'
import { profile } from '../data'
import { deck, slides, type Slide } from './content'

// Which slide the address points at: /purolator-intern-event#3 opens slide 3.
const fromHash = () => {
  const n = parseInt(window.location.hash.slice(1), 10)
  return n >= 1 && n <= slides.length ? n - 1 : 0
}

function Visual({ slide }: { slide: Slide }) {
  if (slide.image) return <img className="deck-img" src={slide.image} alt={slide.title} />
  if (slide.steps) {
    return (
      <ol className="deck-steps">
        {slide.steps.map((s) => <li key={s}>{s}</li>)}
      </ol>
    )
  }
  return <img className="deck-logo" src="/logos/purolator.png" alt="Purolator" />
}

export default function EventPage() {
  const [at, setAt] = useState(fromHash)
  const [notes, setNotes] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const slide = slides[at]
  const last = slides.length - 1

  const go = useCallback((i: number) => {
    const n = Math.max(0, Math.min(last, i))
    setAt(n)
    setNotes(false)
    history.replaceState(null, '', `#${n + 1}`)
  }, [last])

  // One click shows the notes, the next one moves on.
  const advance = useCallback(() => {
    if (!notes && slide.notes.length) setNotes(true)
    else if (at < last) go(at + 1)
  }, [notes, slide, at, last, go])

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
  }, [at, last, go, advance])

  // Load the next screenshot early so it doesn't pop in while presenting.
  useEffect(() => {
    const next = slides[at + 1]?.image
    if (next) new Image().src = next
  }, [at])

  return (
    <>
      <header className="top wrap">
        <a className="top-name ev-home" href="/">Anay Baid</a>
        <span className="top-time">{deck.kicker}</span>
        <nav aria-label="Site">
          <a href="/">Main site</a>
          <ThemeToggle />
        </nav>
      </header>

      <main className="wrap">
        <div className="deck" ref={stage}>
          <div
            className={`deck-slide${notes ? ' with-notes' : ''}${slide.image ? '' : ' no-image'}`}
            onClick={advance}
            role="button"
            tabIndex={0}
            aria-label={notes ? 'Next slide' : 'Show the notes'}
            key={at}
          >
            <div className="deck-head">
              <p className="deck-label">{slide.label}</p>
              <h1 className="deck-title">{slide.title}</h1>
              {slide.line && <p className="deck-line">{slide.line}</p>}
              {!notes && slide.notes.length > 0 && <span className="deck-hint">Click for notes</span>}
            </div>
            <div className="deck-body">
              <div className="deck-visual">
                <Visual slide={slide} />
              </div>
              <aside className="deck-notes" aria-hidden={!notes}>
                <ul className="dashes">
                  {slide.notes.map((n, i) => <li key={n} style={{ transitionDelay: `${notes ? 120 + i * 70 : 0}ms` }}>{n}</li>)}
                </ul>
              </aside>
            </div>
          </div>

          <div className="deck-bar">
            <button type="button" onClick={() => go(at - 1)} disabled={at === 0} aria-label="Previous slide">←</button>
            <div className="deck-dots" role="tablist" aria-label="Slides">
              {slides.map((s, i) => (
                <button
                  key={s.title + i}
                  type="button"
                  role="tab"
                  aria-selected={i === at}
                  aria-label={`Slide ${i + 1}, ${s.title}`}
                  className={i === at ? 'on' : ''}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <span className="deck-count">{at + 1} / {slides.length}</span>
            <button type="button" onClick={() => setNotes((v) => !v)} aria-pressed={notes}>Notes</button>
            <button type="button" onClick={fullscreen}>Full screen</button>
            <button type="button" onClick={() => go(at + 1)} disabled={at === last} aria-label="Next slide">→</button>
          </div>
        </div>

        <p className="ev-note">
          {deck.mockNote} Arrow keys move between slides, space shows the notes, F goes full screen.
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
