import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react'
import { profile, experience, projects, education, skills } from './data'
import { downloadResume } from './downloadResume'
import GithubActivity from './components/GithubActivity'
import Activity from './components/Activity'
import ThemeToggle from './components/ThemeToggle'
import { parsePeriod, monthIndex, monthLabel } from './timeline'
import { slug, whereUsed } from './evidence'
import { splitImpact } from './impact'
import CommandMenu, { type Command } from './components/CommandMenu'
import ResumeViewer from './components/ResumeViewer'
import { openResume } from './resume'

const updated = new Date(__BUILD_DATE__).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
const shortOrg = (org: string) => org.replace(/ (Inc|LP|Global Holdings Inc)$/, '')

// "Spring 2026 to Present" -> "2026 to now", "May 2025 to August 2025" -> "2025"
function years(period: string) {
  const ys = period.match(/\d{4}/g) ?? []
  const first = ys[0]
  const last = ys[ys.length - 1]
  if (/present/i.test(period)) return `${first} to now`
  return first === last ? first : `${first} to ${last}`
}

function useLocalTime() {
  const read = () => {
    const now = new Date()
    const time = now.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' })
    const parts = new Intl.DateTimeFormat('en-CA', { hour: 'numeric', hourCycle: 'h23', weekday: 'short', timeZone: 'America/Toronto' }).formatToParts(now)
    const hour = Number(parts.find((p) => p.type === 'hour')?.value ?? 12)
    const weekend = ['Sat', 'Sun'].includes(parts.find((p) => p.type === 'weekday')?.value ?? '')
    return { time, hour, weekend }
  }
  const [now, setNow] = useState(read)
  useEffect(() => {
    const id = setInterval(() => setNow(read()), 30_000)
    return () => clearInterval(id)
  }, [])
  return now
}

// an honest guess at when an email gets read, from the time in Toronto
function replyNote(hour: number, weekend: boolean) {
  if (hour >= 23 || hour < 7) return "It's late here, so I'll see your email in the morning."
  if (weekend) return "It's the weekend here, but I check email and usually reply the same day."
  if (hour >= 9 && hour < 17) return "I'm at work right now and usually reply within a few hours."
  return 'I usually reply the same day.'
}

function CopyEmail() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      // no clipboard access, the address is right there to select
    }
  }
  return (
    <>
      <button type="button" className="copy" onClick={copy} aria-label={`Copy ${profile.email}`}>
        {copied ? 'Copied' : 'Copy address'}
      </button>
      <div className="toast" role="status" aria-live="polite" data-show={copied}>
        {copied && <>Copied {profile.email} to your clipboard</>}
      </div>
    </>
  )
}

function Impact({ text }: { text: string }) {
  return (
    <>
      {splitImpact(text).map((part, i) => (part.hit ? <strong key={i} className="num">{part.text}</strong> : part.text))}
    </>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="dashes">
      {items.map((b) => (
        <li key={b}>
          <Impact text={b} />
        </li>
      ))}
    </ul>
  )
}

const monthsIn = (period: string) => {
  const span = parsePeriod(period)
  return span ? span.end - span.start + 1 : 0
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const totalMonths = experience.reduce((sum, e) => sum + monthsIn(e.period), 0)

function JobDetail({ i }: { i: number }) {
  const job = experience[i]
  return (
    <>
      <p className="job-title">{job.role}</p>
      <p className="job-meta">
        <a href={job.orgUrl} target="_blank" rel="noreferrer">{job.org}</a>, {job.period}
        {monthsIn(job.period) > 0 && <>, {plural(monthsIn(job.period), 'month')}</>}
      </p>
      <Bullets items={job.bullets} />
      <p className="stack">{job.tech.join(', ')}</p>
    </>
  )
}

const GRAD = monthIndex(2027, 3)

function Timeline({ active, onPick }: { active: number; onPick: (i: number) => void }) {
  const spans = experience.map((e) => parsePeriod(e.period))
  const known = spans.filter((s): s is { start: number; end: number } => s !== null)
  if (known.length === 0) return null
  const from = Math.floor(Math.min(...known.map((s) => s.start)) / 12) * 12
  const to = GRAD + 1
  const pct = (m: number) => ((m - from) / (to - from)) * 100
  const years: number[] = []
  for (let m = from; m < to; m += 12) years.push(m)

  return (
    <div className="timeline" aria-label="Co-op terms on a timeline">
      <p className="tl-sum">
        {plural(experience.length, 'co-op term')}, {totalMonths} months of full-time work so far
      </p>
      <div className="tl-track" style={{ backgroundSize: `${(12 / (to - from)) * 100}% 100%` }}>
        {spans.map((s, i) =>
          s ? (
            <button
              key={experience[i].org}
              type="button"
              className={i === active ? 'tl-bar on' : 'tl-bar'}
              style={{ left: `${pct(s.start)}%`, width: `${pct(s.end + 1) - pct(s.start)}%` }}
              onClick={() => onPick(i)}
              onMouseEnter={() => onPick(i)}
              title={`${experience[i].org}, ${monthLabel(s.start)} to ${monthLabel(s.end)}`}
              aria-label={`${shortOrg(experience[i].org)}, ${experience[i].period}`}
            >
              <span>{shortOrg(experience[i].org).split(' ')[0]}</span>
            </button>
          ) : null,
        )}
        <span className="tl-grad" style={{ left: `${pct(GRAD + 1)}%` }}>
          <span>Graduating</span>
        </span>
      </div>
      <div className="tl-years" aria-hidden="true">
        {years.map((m) => (
          <span key={m} style={{ left: `${pct(m)}%` }}>{2000 + m / 12}</span>
        ))}
      </div>
    </div>
  )
}

function Experience({ active, setActive }: { active: number; setActive: (i: number) => void }) {

  const onKey = (e: KeyboardEvent<HTMLOListElement>) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
    e.preventDefault()
    const next = (active + (e.key === 'ArrowDown' ? 1 : -1) + experience.length) % experience.length
    setActive(next)
    e.currentTarget.querySelectorAll<HTMLButtonElement>('.job')[next]?.focus()
  }

  return (
    <section className="section" aria-labelledby="experience">
      <h2 id="experience">Experience</h2>
      <Timeline active={active} onPick={setActive} />
      <div className="jobs">
        <ol className="job-list" onKeyDown={onKey}>
          {experience.map((e, i) => (
            <li key={e.org}>
              <button
                type="button"
                className={i === active ? 'job on' : 'job'}
                aria-pressed={i === active}
                aria-controls="exp-detail"
                onClick={() => {
                  setActive(i)
                  history.replaceState(null, '', `#job-${slug(shortOrg(e.org))}`)
                }}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <img src={e.logo} alt="" width={36} height={36} />
                <span className="job-org">{shortOrg(e.org)}</span>
                <span className="job-years">{years(e.period)}</span>
              </button>
              {i === active && (
                <div className="job-inline">
                  <JobDetail i={i} />
                </div>
              )}
            </li>
          ))}
        </ol>
        <div className="job-detail" id="exp-detail" aria-live="polite" key={active}>
          <JobDetail i={active} />
        </div>
      </div>
    </section>
  )
}

function ProjectLinks({ p }: { p: (typeof projects)[number] }) {
  if (!p.link && !p.code) return null
  return (
    <p className="project-links">
      {p.link && (
        <a href={p.link} target="_blank" rel="noreferrer">
          {p.status === 'Live' ? 'Play it' : p.link.includes('devpost') ? 'Devpost' : 'Code'}
        </a>
      )}
      {p.code && <a href={p.code} target="_blank" rel="noreferrer">Code</a>}
    </p>
  )
}

const allSkills = [...skills.languages, ...skills.frameworks, ...skills.devops]
const strongest = allSkills
  .map((sk) => ({ sk, n: whereUsed(sk).length }))
  .filter((x) => x.n > 0)
  .sort((a, b) => b.n - a.n)
  .slice(0, 6)
  .map((x) => x.sk)
const wins = projects.filter((p) => p.award?.toLowerCase().includes('winner'))

// the five things a recruiter checks first, answered before they scroll
function Glance({ onResume }: { onResume: () => void }) {
  return (
    <section className="glance" aria-labelledby="glance">
      <h2 id="glance" className="glance-title">At a glance</h2>
      <dl className="glance-grid">
        <div>
          <dt>Graduating</dt>
          <dd>April 2027, Honours Computer Science, University of Waterloo</dd>
        </div>
        <div>
          <dt>Looking for</dt>
          <dd>A new grad software engineering role starting in 2027, full-stack or backend</dd>
        </div>
        <div>
          <dt>Experience</dt>
          <dd>
            {plural(experience.length, 'co-op term')}, {totalMonths} months, at {experience.map((e) => shortOrg(e.org)).join(', ')}
          </dd>
        </div>
        <div>
          <dt>Used the most</dt>
          <dd>{strongest.join(', ')}</dd>
        </div>
        <div>
          <dt>Hackathons</dt>
          <dd>{wins.length > 0 ? `${plural(wins.length, 'win')}, ${wins.map((w) => w.period).join(' and ')}` : 'A few a year'}</dd>
        </div>
        <div>
          <dt>Based in</dt>
          <dd>{profile.location.replace(', ON', ', Ontario')}</dd>
        </div>
      </dl>
      <p className="glance-actions">
        <button type="button" className="glance-primary" onClick={onResume}>Read the resume</button>
        <a href={`mailto:${profile.email}?subject=New%20grad%20role`}>Email about a role</a>
        <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
      </p>
    </section>
  )
}

function Skills({ onJob, onProject }: { onJob: (i: number) => void; onProject: (slug: string) => void }) {
  const [picked, setPicked] = useState<string | null>(null)
  const groups: [string, string[]][] = [
    ['Languages', skills.languages],
    ['Frameworks', skills.frameworks],
    ['Tools', skills.devops],
  ]
  const evidence = picked ? whereUsed(picked) : []

  return (
    <div>
      <h2 id="skills">Skills</h2>
      <p className="skills-hint">Pick one to see where I've used it.</p>
      <dl className="skills">
        {groups.map(([name, list]) => (
          <div key={name} className="skill-group">
            <dt>{name}</dt>
            <dd>
              {list.map((sk) => {
                const n = whereUsed(sk).length
                return (
                  <button
                    key={sk}
                    type="button"
                    className={['skill', n ? 'has' : '', picked === sk ? 'on' : ''].join(' ')}
                    aria-pressed={picked === sk}
                    onClick={() => setPicked(picked === sk ? null : sk)}
                  >
                    {sk}
                  </button>
                )
              })}
            </dd>
          </div>
        ))}
      </dl>
      <div className="evidence" aria-live="polite">
        {picked && (
          <p key={picked}>
            {evidence.length === 0 ? (
              <>{picked} is on my resume, but none of the work on this page is tagged with it yet.</>
            ) : (
              <>
                <b>{picked}</b> shows up in{' '}
                {evidence.map((e, i) => (
                  <span key={e.label}>
                    {i > 0 && (i === evidence.length - 1 ? ' and ' : ', ')}
                    <button type="button" onClick={() => (e.kind === 'job' ? onJob(e.index) : onProject(e.slug))}>
                      {e.label}
                    </button>
                  </span>
                ))}
                .
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}

export default function App() {
  const { time, hour, weekend } = useLocalTime()
  const [activeJob, setActiveJob] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const showResume = useCallback(() => openResume(() => setResumeOpen(true)), [])

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const openJob = useCallback((i: number) => {
    setActiveJob(i)
    history.replaceState(null, '', `#job-${slug(shortOrg(experience[i].org))}`)
    goTo('experience')
  }, [])
  const openProject = useCallback((s: string) => {
    const el = document.getElementById(`project-${s}`)
    if (el instanceof HTMLDetailsElement) el.open = true
    history.replaceState(null, '', `#project-${s}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  // links like /#job-iotum or /#project-pashu open straight to that item
  useEffect(() => {
    const apply = () => {
      const h = decodeURIComponent(location.hash.slice(1))
      const j = experience.findIndex((e) => `job-${slug(shortOrg(e.org))}` === h)
      if (j >= 0) {
        setActiveJob(j)
        requestAnimationFrame(() => goTo('experience'))
      } else if (h.startsWith('project-')) {
        requestAnimationFrame(() => openProject(h.slice(8)))
      }
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [openProject])

  const commands = useMemo<Command[]>(() => {
    const copy = () => navigator.clipboard?.writeText(profile.email).catch(() => {})
    return [
      ...experience.map((e, i) => ({ group: 'Jobs', label: `${shortOrg(e.org)}, ${e.role}`, keywords: e.tech.join(' '), run: () => openJob(i) })),
      ...projects.map((p) => ({ group: 'Projects', label: p.title, keywords: `${p.period} ${p.tech.join(' ')}`, run: () => openProject(slug(p.title)) })),
      { group: 'Get in touch', label: 'Email Anay', keywords: 'contact mail', run: () => (location.href = `mailto:${profile.email}`) },
      { group: 'Get in touch', label: 'Copy email address', keywords: 'clipboard contact', run: copy },
      { group: 'Get in touch', label: 'Read the resume', keywords: 'cv pdf', run: showResume },
      { group: 'Get in touch', label: 'Download the resume', keywords: 'cv pdf', run: downloadResume },
      { group: 'Elsewhere', label: 'GitHub', run: () => window.open(profile.links.github, '_blank', 'noopener') },
      { group: 'Elsewhere', label: 'LinkedIn', run: () => window.open(profile.links.linkedin, '_blank', 'noopener') },
      { group: 'Elsewhere', label: 'Devpost', keywords: 'hackathons', run: () => window.open(profile.links.devpost, '_blank', 'noopener') },
      { group: 'Elsewhere', label: 'Play Battleship', keywords: 'game live', run: () => window.open('https://purolator-battleship.onrender.com', '_blank', 'noopener') },
      { group: 'Page', label: 'Skills', run: () => goTo('skills') },
      { group: 'Page', label: 'GitHub activity', run: () => goTo('github') },
      { group: 'Page', label: 'Switch light or dark', keywords: 'theme mode', run: () => (document.querySelector('.theme') as HTMLButtonElement | null)?.click() },
    ]
  }, [openJob, openProject, showResume])
  const [featured, ...rest] = [
    projects.find((p) => p.status === 'Live') ?? projects[0],
    ...projects.filter((p) => p.status !== 'Live'),
  ]
  const [second, ...others] = rest

  return (
    <>
      <a className="skip" href="#experience">Skip to experience</a>
      <header className="top wrap">
        <span className="top-name">Anay Baid</span>
        <span className="top-time">Toronto, {time}</span>
        <nav aria-label="Contact">
          <button type="button" className="search" onClick={() => setMenuOpen(true)} aria-label="Search the site">
            Search <kbd>{navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <a href={`mailto:${profile.email}`}>Email</a>
          <button type="button" onClick={showResume}>Resume</button>
          <ThemeToggle />
        </nav>
      </header>

      <main className="wrap">
        <section className="hero">
          <h1>
            <span>Anay</span> <span>Baid</span>
          </h1>
          <div className="hero-grid">
            <img className="photo" src="/avatar.png" alt="Anay Baid" width={240} height={240} />
            <div className="hero-copy">
              <p className="lede">
                Fourth-year Computer Science at Waterloo. On co-op at Purolator, building the forecasting and planning
                tools their network team runs on.
              </p>
              <p className="sub">
                Most of what I build starts with something manual, slow or annoying that I end up automating. I'm looking
                for a new grad software role starting in 2027, full-stack or backend.
              </p>
              <p className="hero-links">
                <a className="primary" href={`mailto:${profile.email}`}>Email me</a>
                <button type="button" onClick={showResume}>Read resume</button>
                <a href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              </p>
            </div>
          </div>
        </section>

        <Glance onResume={showResume} />

        <Experience active={activeJob} setActive={setActiveJob} />

        <section className="print-only" aria-hidden="true">
          {experience.map((e) => (
            <div key={e.org} className="print-job">
              <p className="job-title">{e.role}, {e.org}</p>
              <p className="job-meta">{e.period}</p>
              <Bullets items={e.bullets} />
            </div>
          ))}
        </section>

        <section className="section" aria-labelledby="projects">
          <h2 id="projects">Projects</h2>
          <div className="features">
            {[featured, second].map((p, i) => (
              <article key={p.title} className={i === 0 ? 'feature lead' : 'feature'} id={`project-${slug(p.title)}`}>
                <div className="feature-top">
                  <span>{p.period}</span>
                  {p.status === 'Live' && <span className="live">Live now</span>}
                </div>
                <h3>{p.link ? <a href={p.link} target="_blank" rel="noreferrer">{p.title}</a> : p.title}</h3>
                {p.award && <p className="award">{p.award}</p>}
                <p className="feature-desc"><Impact text={p.description} /></p>
                <Bullets items={p.bullets} />
                <p className="stack">{p.tech.join(', ')}</p>
                <ProjectLinks p={p} />
              </article>
            ))}
          </div>

          <div className="more-projects">
            {others.map((p) => (
              <details key={p.title} className="row" id={`project-${slug(p.title)}`}>
                <summary>
                  <span className="row-title">{p.title}</span>
                  <span className="row-where">{p.award ? `${p.period}, ${p.award.replace('Winner, ', 'won ')}` : p.period}</span>
                  <span className="row-toggle" aria-hidden="true" />
                </summary>
                <div className="row-body">
                  <p>{p.description}</p>
                  <Bullets items={p.bullets} />
                  <p className="stack">{p.tech.join(', ')}</p>
                  <ProjectLinks p={p} />
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="section split" aria-label="Education and skills">
          <div>
            <h2 id="education">Education</h2>
            <div className="school">
              <img src={education.logo} alt="" width={44} height={44} />
              <div>
                <p className="school-name">{education.school}</p>
                <p>{education.degree}, {education.gradDate.replace('Expected ', 'graduating ')}</p>
                <p className="soft">{education.specializations}</p>
              </div>
            </div>
            <Bullets items={education.highlights} />
          </div>
          <Skills onJob={openJob} onProject={openProject} />
        </section>

        <section className="section" aria-labelledby="github">
          <h2 id="github">Recently on GitHub</h2>
          <Activity user="anaybaid7" />
          <GithubActivity />
        </section>
      </main>

      <footer className="foot">
        <div className="wrap">
          <p className="foot-ask">Hiring for 2027? I'd like to hear about it.</p>
          <p className="foot-mail">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          <p className="foot-actions">
            <CopyEmail />
            <button type="button" onClick={showResume}>Read resume</button>
          </p>
          <p className="foot-note">
            {replyNote(hour, weekend)} It's {time} in Toronto.
          </p>
          <div className="foot-row">
            <span className="foot-links">
              <a href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              <a href={profile.links.devpost} target="_blank" rel="noreferrer">Devpost</a>
              <a href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}>{profile.phone}</a>
            </span>
            <span>Updated {updated}</span>
          </div>
        </div>
      </footer>
      <CommandMenu commands={commands} open={menuOpen} onOpenChange={setMenuOpen} />
      <ResumeViewer open={resumeOpen} onClose={() => setResumeOpen(false)} />
    </>
  )
}
