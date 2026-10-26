import { useEffect, useRef, useState } from 'react'
import ThemeToggle from '../components/ThemeToggle.tsx'
import { profile } from '../data'
import { dashboard, event, glance, more, presented, team, tool } from './content'

type Shot = { src: string; title: string; text: string }

// A screenshot that opens full size on click. If the file isn't there yet
// (the Power BI ones are added by hand), only the caption shows.
function Figure({ shot, onOpen }: { shot: Shot; onOpen: (s: Shot) => void }) {
  const [missing, setMissing] = useState(false)
  return (
    <figure className={`ev-figure${missing ? ' ev-figure-text' : ''}`}>
      {!missing && (
        <button type="button" className="ev-shot" onClick={() => onOpen(shot)} aria-label={`Open ${shot.title} full size`}>
          <img src={shot.src} alt={shot.title} loading="lazy" onError={() => setMissing(true)} />
        </button>
      )}
      <figcaption>
        <b>{shot.title}</b>
        <span>{shot.text}</span>
      </figcaption>
    </figure>
  )
}

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
      {shot && (
        <>
          <img src={shot.src} alt={shot.title} />
          <p>
            <b>{shot.title}</b> {shot.text} <span className="ev-viewer-close">Esc or click to close</span>
          </p>
        </>
      )}
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
          <a href={`mailto:${profile.email}`}>Email</a>
          <ThemeToggle />
        </nav>
      </header>

      <main className="wrap">
        <section className="ev-hero">
          <img className="ev-logo" src="/logos/purolator.png" alt="Purolator" width={56} height={56} />
          <h1>{event.title}</h1>
          <p className="lede">{event.lede}</p>
          <p className="sub">{event.sub}</p>
        </section>

        <section className="glance" aria-label="At a glance">
          <dl className="glance-grid">
            {glance.map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="section" aria-labelledby="team">
          <h2 id="team">What the team does</h2>
          <p className="ev-intro">{team.intro}</p>
          <ol className="ev-flow">
            {team.steps.map((s, i) => (
              <li key={s.title}>
                <span className="ev-step">{i + 1}</span>
                <b>{s.title}</b>
                <span>{s.text}</span>
              </li>
            ))}
          </ol>
        </section>

        <section className="section" aria-labelledby="tool">
          <h2 id="tool">{tool.name}</h2>
          <p className="ev-intro">{tool.summary}</p>
          <div className="ev-compare">
            <div>
              <h3>Before</h3>
              <ul className="dashes">{tool.before.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
            <div className="ev-now">
              <h3>Now</h3>
              <ul className="dashes">{tool.now.map((t) => <li key={t}>{t}</li>)}</ul>
            </div>
          </div>
          <div className="ev-gallery ev-wide">
            {tool.shots.map((s) => <Figure key={s.src} shot={s} onOpen={setOpen} />)}
          </div>
        </section>

        <section className="section" aria-labelledby="dashboard">
          <h2 id="dashboard">{dashboard.name}</h2>
          <p className="ev-intro">{dashboard.summary}</p>
          <div className="ev-gallery">
            {dashboard.pages.map((s) => <Figure key={s.src} shot={s} onOpen={setOpen} />)}
          </div>
        </section>

        <section className="section split" aria-label="More work and presentations">
          <div>
            <h2 id="more">Also this term</h2>
            <ul className="ev-more">
              {more.map((m) => (
                <li key={m.title}>
                  <b>{m.title}</b>
                  <span>{m.text}</span>
                  {m.link && <a href={m.link} target="_blank" rel="noreferrer">{m.linkText}</a>}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 id="presented">Presented</h2>
            <ul className="ev-more">
              {presented.map((p) => <li key={p}><span>{p}</span></li>)}
            </ul>
          </div>
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <p className="foot-ask">Questions about any of this? Come find me, or email.</p>
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
