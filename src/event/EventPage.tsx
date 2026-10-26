import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '../components/ThemeToggle.tsx'
import { profile } from '../data'
import { dashboard, event, steps, tool } from './content'

type Shot = { src: string; title: string; text: string }

function Figure({ shot, onOpen }: { shot: Shot; onOpen: (s: Shot) => void }) {
  return (
    <figure className="ev-figure">
      <button type="button" className="ev-shot" onClick={() => onOpen(shot)} aria-label={`Open ${shot.title} full size`}>
        <img src={shot.src} alt={shot.title} loading="lazy" />
      </button>
      <figcaption>
        <b>{shot.title}</b> {shot.text}
      </figcaption>
    </figure>
  )
}

// Full-size screenshot. Click or Esc closes it.
function Viewer({ shot, onClose }: { shot: Shot | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (shot && !d.open) d.showModal()
    if (!shot && d.open) d.close()
  }, [shot])
  return (
    <dialog ref={ref} className="ev-viewer" onClose={onClose} onClick={onClose} aria-label={shot?.title}>
      {shot && <img src={shot.src} alt={shot.title} />}
    </dialog>
  )
}

export default function EventPage() {
  const [open, setOpen] = useState<Shot | null>(null)
  return (
    <>
      <header className="top wrap">
        <a className="top-name ev-home" href="/">Anay Baid</a>
        <span className="top-time">{event.kicker}</span>
        <nav aria-label="Site">
          <a href="/">Main site</a>
          <ThemeToggle />
        </nav>
      </header>

      <main className="wrap">
        <section className="ev-hero">
          <img className="ev-logo" src="/logos/purolator.png" alt="Purolator" width={56} height={56} />
          <h1>{event.title}</h1>
          <p className="lede">{event.lede}</p>
          <ol className="ev-flow" aria-label="How the weekly forecast gets made">
            {steps.map((s) => <li key={s}>{s}</li>)}
          </ol>
        </section>

        {[tool, dashboard].map((part) => (
          <section key={part.name} className="section" aria-labelledby={part.name}>
            <h2 id={part.name}>{part.name}</h2>
            <p className="ev-intro">{part.summary}</p>
            <div className="ev-gallery">
              {part.shots.map((s) => <Figure key={s.src} shot={s} onOpen={setOpen} />)}
            </div>
          </section>
        ))}

        <p className="ev-note">{event.note}</p>
      </main>

      <footer className="foot">
        <div className="wrap">
          <p className="foot-mail">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          <div className="foot-row">
            <span className="foot-links">
              <a href="/">Main site</a>
              <a href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
            </span>
          </div>
        </div>
      </footer>
      <Viewer shot={open} onClose={() => setOpen(null)} />
    </>
  )
}
