import { useEffect, useRef, useState } from 'react'
import { slides } from './content'
import { openChannel, type DeckMsg } from './channel'

// Presenter view: open with P, keep it on the laptop and the slides on the
// projector, see channel.ts for how the two windows stay in step

const total = slides.reduce((n, s) => n + s.time, 0)
const before = (at: number) => slides.slice(0, at).reduce((n, s) => n + s.time, 0)
const clock = (secs: number) => `${Math.floor(Math.abs(secs) / 60)}:${String(Math.floor(Math.abs(secs) % 60)).padStart(2, '0')}`

// what's inside a slide to click through, in order
const parts = (at: number) => {
  const s = slides[at]
  return (s.spots ?? s.steps ?? s.points ?? []).map((p) => ('label' in p ? p.label : p.title))
}

export default function Presenter() {
  const channel = useRef<BroadcastChannel | null>(null)
  const [at, setAt] = useState(0)
  const [spot, setSpot] = useState<number | null>(null)
  const [start, setStart] = useState<number | null>(null)
  const [from, setFrom] = useState(0)
  const [enteredAt, setEnteredAt] = useState(() => Date.now())
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const ch = openChannel()
    channel.current = ch
    if (!ch) return
    const onMsg = (e: MessageEvent<DeckMsg>) => {
      const m = e.data
      if (m.type !== 'state') return
      setAt((cur) => {
        if (cur !== m.at) setEnteredAt(Date.now())
        return m.at
      })
      setSpot(m.spot)
    }
    ch.addEventListener('message', onMsg)
    ch.postMessage({ type: 'hello' } satisfies DeckMsg)
    return () => {
      ch.removeEventListener('message', onMsg)
      ch.close()
      channel.current = null
    }
  }, [])

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(id)
  }, [])

  const begin = () => {
    setStart(Date.now())
    setFrom(at)
  }
  const send = (msg: DeckMsg) => {
    if (start === null) begin()
    channel.current?.postMessage(msg)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') send({ type: 'cmd', cmd: 'next' })
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') send({ type: 'cmd', cmd: 'prev' })
      else if (e.key === ' ' || e.key === 'Enter') send({ type: 'cmd', cmd: 'advance' })
      else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const slide = slides[at]
  const next = slides[at + 1]
  const elapsed = start === null ? 0 : (now - start) / 1000
  const onSlide = (now - enteredAt) / 1000
  // how far ahead or behind the plan since the slide the timer started on,
  // counting this slide up to its own time
  const drift = start === null ? 0 : elapsed - (before(at) - before(from) + Math.min(onSlide, slide.time))
  const pace = start === null ? 'Not started' : Math.abs(drift) < 15 ? 'On pace' : drift > 0 ? `${clock(drift)} behind` : `${clock(drift)} ahead`
  const list = parts(at)

  return (
    <main className="pv">
      <header className="pv-top">
        <p className="pv-time">
          <b>{clock(elapsed)}</b>
          <span>of about {clock(total)}</span>
        </p>
        <p className={`pv-pace ${start === null ? '' : Math.abs(drift) < 15 ? 'ok' : drift > 0 ? 'late' : 'early'}`}>{pace}</p>
        <div className="pv-track" aria-hidden="true">
          {slides.map((s, i) => (
            <i key={i} className={i < at ? 'done' : i === at ? 'on' : ''} style={{ flexGrow: s.time }} />
          ))}
        </div>
        <span className="pv-buttons">
          {start === null ? (
            <button type="button" onClick={begin}>Start timer</button>
          ) : (
            <button type="button" onClick={() => setStart(null)}>Reset timer</button>
          )}
        </span>
      </header>

      <section className="pv-now">
        <p className="pv-label">
          {at + 1} of {slides.length}, {slide.label}
          <span className={onSlide > slide.time ? 'late' : ''}> {clock(onSlide)} of {clock(slide.time)} here</span>
        </p>
        <h1>{slide.title}</h1>
        <ul className="pv-notes">
          {slide.notes.map((n) => <li key={n}>{n}</li>)}
        </ul>
        {list.length > 0 && (
          <ol className="pv-parts">
            {list.map((p, i) => <li key={p} className={i === spot ? 'on' : ''}>{p}</li>)}
          </ol>
        )}
      </section>

      <aside className="pv-next">
        <p className="pv-label">Next</p>
        {next ? (
          <>
            <h2>{next.title}</h2>
            <p>{next.label}</p>
            {next.image ? <img className="pv-peek" src={next.image} alt="" /> : next.line && <p className="pv-line">{next.line}</p>}
          </>
        ) : (
          <h2>That's the end</h2>
        )}
        <div className="pv-move">
          <button type="button" onClick={() => send({ type: 'cmd', cmd: 'prev' })} disabled={at === 0}>Back</button>
          <button type="button" className="primary" onClick={() => send({ type: 'cmd', cmd: 'advance' })}>Next</button>
        </div>
        <p className="pv-keys">Arrow keys change slides, space steps through the parts</p>
      </aside>
    </main>
  )
}
