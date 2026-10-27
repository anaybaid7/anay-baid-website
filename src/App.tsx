import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { profile, experience, projects, education, skills, skillLabels } from './data'
import { downloadResume } from './downloadResume'
import GithubActivity from './components/GithubActivity'
import Activity from './components/Activity'
import ThemeToggle from './components/ThemeToggle'
import { parsePeriod, monthIndex, monthLabel } from './timeline'
import { slug, uses, whereUsed } from './evidence'
import CommandMenu, { type Command } from './components/CommandMenu'
import ResumeViewer from './components/ResumeViewer'
import { openResume } from './resume'
import { skillStats, sortStats, type SortKey } from './skillStats'
import SettingsPanel from './components/SettingsPanel'
import Matcher from './components/Matcher'
import Shortcuts from './components/Shortcuts'
import { setSettings, useSettings, withTransition, resolvedTheme } from './settings'
import { FILES, downloadJsonResume, downloadVcard } from './exports'
import HowItWorks from './components/HowItWorks'
import LivePreview from './components/LivePreview'
import Minimap from './components/Minimap'

const updated = new Date(__BUILD_DATE__).toLocaleDateString('en-CA', { month: 'long', year: 'numeric' })
const shortOrg = (org: string) => org.replace(/ (Inc|LP|Global Holdings Inc)$/, '')

// "Spring 2026 to Present" -> "2026 to now", "May 2025 to August 2025" -> "2025"
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
// the visitor's own clock, only when they're outside Toronto's time zone
function useVisitorTime(tick: string) {
  return useMemo(() => {
    try {
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
      const here = new Date().toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Toronto' })
      const there = new Date().toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' })
      if (!zone || zone === 'America/Toronto' || here === there) return null
      return there
    } catch {
      return null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick])
}

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
      <button type="button" className="copy" onClick={copy}>
        {copied ? 'Copied' : 'Copy address'}
      </button>
      <div className="toast" role="status" aria-live="polite" data-show={copied}>
        {copied && <>Copied {profile.email} to your clipboard</>}
      </div>
    </>
  )
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="dashes">
      {items.map((b) => (
        <li key={b}>
          {b}
        </li>
      ))}
    </ul>
  )
}

const thisMonth = monthIndex(new Date().getFullYear(), new Date().getMonth())
const monthsIn = (period: string) => {
  const span = parsePeriod(period)
  return span ? span.end - span.start + 1 : 0
}
// months actually worked so far, a term that runs into the future only counts up to now
const monthsSoFar = (period: string) => {
  const span = parsePeriod(period)
  return span ? Math.max(0, Math.min(span.end, thisMonth) - span.start + 1) : 0
}
const isCurrent = (period: string) => {
  const span = parsePeriod(period)
  return !!span && span.start <= thisMonth && span.end >= thisMonth
}
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const totalMonths = experience.reduce((sum, e) => sum + monthsSoFar(e.period), 0)

const SHORT_MONTH = /(January|February|March|April|May|June|July|August|September|October|November|December)/g
const shortPeriod = (period: string) => period.replace(SHORT_MONTH, (m) => m.slice(0, 3))

const filterable = Array.from(new Set([...skills.languages, ...skills.frameworks, ...skills.devops])).filter((sk) => whereUsed(sk).length > 0)
const stackFilterCommands = (apply: (s: string[]) => void): Command[] =>
  filterable.map((sk) => ({ group: 'Show only work with', label: sk, keywords: 'filter stack', run: () => apply([sk]) }))

const listFormat = (items: string[]) => new Intl.ListFormat('en-CA', { type: 'conjunction' }).format(items)

// does this job or project use any of the skills being filtered on
const fits = (tech: string[], filter: string[]) => filter.length === 0 || filter.some((sk) => tech.some((t) => uses(sk, t)))

function entryClass(on: boolean, dim: boolean) {
  return ['entry', on ? 'on' : '', dim ? 'dim' : ''].filter(Boolean).join(' ')
}

// a small button beside each title that copies a link straight to it
function CopyLink({ id, name }: { id: string; name: string }) {
  const [done, setDone] = useState(false)
  const copy = () => {
    const url = `${location.origin}${location.pathname}${location.search}#${id}`
    navigator.clipboard?.writeText(url).then(
      () => {
        setDone(true)
        setTimeout(() => setDone(false), 1600)
      },
      () => {},
    )
  }
  return (
    <button type="button" className="copy-link" onClick={copy} aria-label={`Copy a link to ${name}`}>
      {done ? 'Copied' : 'Link'}
    </button>
  )
}

function Result({ h }: { h?: { value: string; label: string } }) {
  if (!h) return null
  return (
    <p className="entry-result">
      <b>{h.value}</b> {h.label}
    </p>
  )
}

// holds off rendering (and the GitHub requests inside) until the section is
// about to scroll into view, so the first load stays light
function WhenVisible({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const [show, setShow] = useState(() => typeof IntersectionObserver === 'undefined')
  useEffect(() => {
    if (show || !ref.current) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShow(true), { rootMargin: '600px 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [show])
  return <div ref={ref}>{show ? children : <p className="muted">Loading GitHub activity...</p>}</div>
}

const GRAD = monthIndex(2027, 3)

function Timeline({ active, onPick, filter = [] }: { active: number; onPick: (i: number) => void; filter?: string[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const spans = experience.map((e) => parsePeriod(e.period))
  const known = spans.filter((s): s is { start: number; end: number } => s !== null)
  if (known.length === 0) return null
  const from = Math.floor(Math.min(...known.map((s) => s.start)) / 12) * 12
  const to = GRAD + 1
  const pct = (m: number) => ((m - from) / (to - from)) * 100
  const years: number[] = []
  for (let m = from; m < to; m += 12) years.push(m)
  const shown = hover ?? (active >= 0 ? active : null)

  return (
    <div className="timeline" aria-label="Co-op terms on a timeline" onMouseLeave={() => setHover(null)}>
      <p className="tl-sum" aria-live="polite">
        {shown === null ? (
          <>{plural(experience.length, 'co-op term')}, {totalMonths} months of full-time work so far</>
        ) : (
          <>
            <b>{shortOrg(experience[shown].org)}</b>, {experience[shown].role}, {shortPeriod(experience[shown].period)}
          </>
        )}
      </p>
      <div className="tl-track" style={{ backgroundSize: `${(12 / (to - from)) * 100}% 100%` }}>
        {spans.map((s, i) =>
          s ? (
            <button
              key={experience[i].org}
              type="button"
              className={['tl-bar', i === active || (active < 0 && isCurrent(experience[i].period)) ? 'on' : '', fits(experience[i].tech, filter) ? '' : 'dim'].filter(Boolean).join(' ')}
              style={{
                left: `${pct(s.start)}%`,
                width: `${pct(s.end + 1) - pct(s.start)}%`,
                ['--done' as string]: `${Math.max(0, Math.min(1, (thisMonth + 1 - s.start) / (s.end + 1 - s.start))) * 100}%`,
              }}
              onClick={() => onPick(i)}
              onMouseEnter={() => setHover(i)}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(null)}
              title={`${experience[i].org}, ${monthLabel(s.start)} to ${monthLabel(s.end)}`}
              aria-label={`${shortOrg(experience[i].org)}, ${experience[i].period}`}
            >
              <span>{shortOrg(experience[i].org).split(' ')[0]}</span>
            </button>
          ) : null,
        )}
        {thisMonth >= from && thisMonth <= to && (
          <span className="tl-today" style={{ left: `${pct(thisMonth + 0.5)}%` }}>
            <span>Today</span>
          </span>
        )}
        <span className="tl-grad" style={{ left: `${pct(GRAD + 1)}%` }}>
          <span>Graduating</span>
        </span>
      </div>
      <p className="tl-legend" aria-hidden="true">
        <span className="tl-key today">Today</span>
        <span className="tl-key grad">Graduating, April 2027</span>
      </p>
      <div className="tl-years" aria-hidden="true">
        {years.map((m) => (
          <span key={m} style={{ left: `${pct(m)}%` }}>{2000 + m / 12}</span>
        ))}
      </div>
    </div>
  )
}

function Experience({ active, onPick, filter }: { active: number; onPick: (i: number) => void; filter: string[] }) {
  return (
    <section className="section" aria-labelledby="experience" data-part="experience">
      <h2 id="experience">Experience</h2>
      <div className="section-body">
        <Timeline active={active} onPick={onPick} filter={filter} />
        <ol className="entries">
          {experience.map((e, i) => (
            <li
              key={e.org}
              className={entryClass(i === active, !fits(e.tech, filter))}
              id={`job-${slug(shortOrg(e.org))}`}
            >
              <p className="entry-when">
                {shortPeriod(e.period)}
                <span>{isCurrent(e.period) ? 'Current role' : plural(monthsIn(e.period), 'month')}</span>
              </p>
              <div className="entry-main">
                <h3 className="entry-title">
                  <img src={e.logo} alt="" width={28} height={28} />
                  <a href={e.orgUrl} target="_blank" rel="noreferrer">{shortOrg(e.org)}</a>
                  <CopyLink id={`job-${slug(shortOrg(e.org))}`} name={shortOrg(e.org)} />
                </h3>
                <p className="entry-sub">{e.role}</p>
                <Result h={e.highlight} />
                <Bullets items={e.bullets} />
                <p className="stack">{e.tech.join(', ')}</p>
                {e.how && <HowItWorks how={e.how} name={shortOrg(e.org)} />}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function ProjectLinks({ p, onPreview }: { p: (typeof projects)[number]; onPreview: () => void }) {
  if (!p.link && !p.code) return null
  return (
    <p className="project-links">
      {p.status === 'Live' && p.link && (
        <button type="button" onClick={onPreview}>Try it here</button>
      )}
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
function Glance({ onCheck }: { onCheck: () => void }) {
  return (
    <section className="section glance" aria-labelledby="glance" data-part="glance">
      <h2 id="glance">At a glance</h2>
      <div className="section-body">
        <dl className="facts">
          <div>
            <dt>Graduating</dt>
            <dd>April 2027, Honours Computer Science, University of Waterloo</dd>
          </div>
          <div>
            <dt>Co-op</dt>
            <dd>
              {plural(experience.length, 'term')}, {totalMonths} months, at {listFormat(experience.map((e) => shortOrg(e.org)))}
            </dd>
          </div>
          <div>
            <dt>Used the most</dt>
            <dd>{strongest.join(', ')}</dd>
          </div>
          <div>
            <dt>Hackathons</dt>
            <dd>{wins.length > 0 ? `${plural(wins.length, 'win')}, at ${wins.map((w) => w.period.split(',')[0]).join(' and ')}` : 'A few a year'}</dd>
          </div>
          <div>
            <dt>Based in</dt>
            <dd>{profile.location.replace(', ON', ', Ontario')}</dd>
          </div>
        </dl>
        <p className="glance-check">
          Recruiting for a role? <button type="button" onClick={onCheck}>Paste the job posting</button> to see which parts
          of it I've worked with, or press S to skim the page.
        </p>
      </div>
    </section>
  )
}

const SKILL_ROWS = skillStats()
const SORTS: { key: SortKey; label: string }[] = [
  { key: 'skill', label: 'Skill' },
  { key: 'months', label: 'Months in roles using it' },
  { key: 'projects', label: 'Projects' },
  { key: 'lastUsed', label: 'Last used' },
]

// skills measured from the work on this page, never self-rated
function Skills({ onFilter }: { onFilter: (skills: string[]) => void }) {
  const [group, setGroup] = useState<string>('All')
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'months', dir: -1 })
  const groupNames = ['All', ...Object.values(skillLabels)]
  const inGroup = SKILL_ROWS.filter((r) => group === 'All' || r.group === group)
  const shown = sortStats(inGroup.filter((r) => r.months > 0 || r.projects.length > 0), sort.key, sort.dir)
  const untagged = inGroup.filter((r) => r.months === 0 && r.projects.length === 0).map((r) => r.skill)

  const sortBy = (key: SortKey) =>
    setSort((cur) => ({ key, dir: cur.key === key ? (cur.dir === 1 ? -1 : 1) : key === 'skill' ? 1 : -1 }))

  return (
    <section className="section" aria-labelledby="skills" data-part="skills">
      <h2 id="skills">Skills</h2>
      <div className="section-body">
        <p className="skills-hint">
          Worked out from the jobs and projects on this page, not rated by me. Pick a skill to show only the work that
          used it.
        </p>
        <div className="skill-groups" role="group" aria-label="Skill group">
          {groupNames.map((g) => (
            <button key={g} type="button" aria-pressed={group === g} onClick={() => setGroup(g)}>
              {g}
            </button>
          ))}
        </div>
        <table className="skill-table">
          <thead>
            <tr>
              {SORTS.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className={`col-${key}`}
                  aria-sort={sort.key === key ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}
                >
                  <button type="button" onClick={() => sortBy(key)}>
                    {label}
                    <span aria-hidden="true">{sort.key === key ? (sort.dir === 1 ? '\u00a0\u2191' : '\u00a0\u2193') : ''}</span>
                  </button>
                </th>
              ))}
              <th scope="col" className="col-where">Where</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.skill}>
                <th scope="row" className="col-skill">
                  <button type="button" onClick={() => onFilter([r.skill])} title={`Show only work with ${r.skill}`}>
                    {r.skill}
                  </button>
                </th>
                <td className="col-months">{r.months > 0 ? r.months : <span className="none">none</span>}</td>
                <td className="col-projects">{r.projects.length || <span className="none">none</span>}</td>
                <td className="col-lastUsed">{r.current ? 'Now' : r.lastUsed !== null ? monthLabel(r.lastUsed) : <span className="none">unknown</span>}</td>
                <td className="col-where">{listFormat([...r.jobs, ...r.projects])}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="print-skills">
          {(Object.keys(skills) as (keyof typeof skills)[]).map((k) => (
            <div key={k}>
              <dt>{skillLabels[k]}</dt>
              <dd>{skills[k].join(', ')}</dd>
            </div>
          ))}
        </dl>
        {untagged.length > 0 && (
          <p className="skills-rest">
            Also on my resume, not tagged on any work here yet: {listFormat(untagged)}.
          </p>
        )}
      </div>
    </section>
  )
}

export default function App() {
  const { time, hour, weekend } = useLocalTime()
  const visitorTime = useVisitorTime(time)
  const [activeJob, setActiveJob] = useState(-1)
  const [menuOpen, setMenuOpen] = useState(false)
  const [resumeOpen, setResumeOpen] = useState(false)
  const [matcherOpen, setMatcherOpen] = useState(false)
  const [keysOpen, setKeysOpen] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [filter, setFilter] = useState<string[]>(() =>
    (new URLSearchParams(location.search).get('stack') ?? '').split(',').map((x) => x.trim()).filter(Boolean),
  )
  const settings = useSettings()

  // the filter lives in the URL too, so a filtered view can be shared
  const applyFilter = useCallback((next: string[]) => {
    withTransition(() => setFilter(next))
    const url = new URL(location.href)
    if (next.length) url.searchParams.set('stack', next.join(','))
    else url.searchParams.delete('stack')
    history.replaceState(null, '', url)
    if (next.length) requestAnimationFrame(() => document.getElementById('experience')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }, [])

  // single-key shortcuts, ignored while typing or with a modifier held
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const t = e.target
      if (t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable], dialog[open]')) return
      const step = (dir: 1 | -1) => {
        const rows = Array.from(document.querySelectorAll<HTMLElement>('.entries > .entry:not(.dim)'))
        const line = 80
        const at = rows.findIndex((r) => r.getBoundingClientRect().top > line + 4)
        const current = at === -1 ? rows.length : at
        const target = dir === 1 ? rows[current] : rows[Math.max(0, current - 2)]
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
      switch (e.key) {
        case 'j': step(1); break
        case 'k': step(-1); break
        case 's': setSettings({ view: settings.view === 'skim' ? 'full' : 'skim' }); break
        case 't': setSettings({ theme: resolvedTheme(settings) === 'dark' ? 'light' : 'dark' }); break
        case 'm': setMatcherOpen(true); break
        case ',': (document.getElementById('settings') as (HTMLElement & { togglePopover?: () => void }) | null)?.togglePopover?.(); break
        case '?': setKeysOpen(true); break
        case 'Escape': if (filter.length) applyFilter([]); return
        default: return
      }
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [settings, filter, applyFilter])
  const showResume = useCallback(() => openResume(() => setResumeOpen(true)), [])

  const goTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const openJob = useCallback((i: number) => {
    const id = `job-${slug(shortOrg(experience[i].org))}`
    setActiveJob(i)
    history.replaceState(null, '', `#${id}`)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])
  const openProject = useCallback((s: string) => {
    const el = document.getElementById(`project-${s}`)
    history.replaceState(null, '', `#project-${s}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  // links like /#job-iotum or /#project-pashu open straight to that item
  useEffect(() => {
    const apply = () => {
      const h = decodeURIComponent(location.hash.slice(1))
      const j = experience.findIndex((e) => `job-${slug(shortOrg(e.org))}` === h)
      if (j >= 0) {
        requestAnimationFrame(() => openJob(j))
      } else if (h.startsWith('project-')) {
        requestAnimationFrame(() => openProject(h.slice(8)))
      }
    }
    apply()
    window.addEventListener('hashchange', apply)
    return () => window.removeEventListener('hashchange', apply)
  }, [openJob, openProject])

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
      { group: 'Elsewhere', label: 'Play Battleship here', keywords: 'game live demo', run: () => setPreview('https://purolator-battleship.onrender.com') },
      { group: 'Page', label: 'Skills', run: () => goTo('skills') },
      { group: 'Page', label: 'GitHub activity', run: () => goTo('github') },
      { group: 'Page', label: 'Switch light or dark', keywords: 'theme mode', run: () => (document.querySelector('.theme') as HTMLButtonElement | null)?.click() },
      { group: 'Page', label: 'Switch between full detail and skim', keywords: 'view compact summary', run: () => setSettings({ view: document.documentElement.dataset.view === 'skim' ? 'full' : 'skim' }) },
      { group: 'Page', label: 'Settings', keywords: 'preferences text size accent motion', run: () => (document.getElementById('settings') as (HTMLElement & { showPopover?: () => void }) | null)?.showPopover?.() },
      { group: 'Page', label: 'Print this view', keywords: 'pdf one page tailored', run: () => window.print() },
      { group: 'Page', label: 'Keyboard shortcuts', keywords: 'keys help', run: () => setKeysOpen(true) },
      { group: 'Hiring', label: 'Check against a job posting', keywords: 'match requirements jd', run: () => setMatcherOpen(true) },
      ...stackFilterCommands(applyFilter),
      { group: 'Hiring', label: 'Save contact card', keywords: 'vcard vcf contacts', run: downloadVcard },
      { group: 'Hiring', label: 'Download resume as JSON Resume', keywords: 'json ats data', run: downloadJsonResume },
      { group: 'Hiring', label: 'Plain text resume', keywords: 'txt ats copy paste', run: () => window.open(FILES.text, '_blank', 'noopener') },
    ]
  }, [openJob, openProject, showResume, applyFilter])
  return (
    <>
      <div className="progress" aria-hidden="true" />
      <a className="skip" href="#experience">Skip to experience</a>
      <header className="top wrap">
        <span className="top-name">Anay Baid</span>
        <span className="top-time">Toronto, {time}</span>
        <nav aria-label="Contact">
          <button type="button" className="search" onClick={() => setMenuOpen(true)}>
            Search <kbd>{navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <a href={`mailto:${profile.email}`}>Email</a>
          <button type="button" onClick={showResume}>Resume</button>
          <button type="button" className="settings-open" popoverTarget="settings" title="Settings (,)">Settings</button>
          <ThemeToggle />
        </nav>
      </header>

      <Minimap version={`${settings.lead}|${settings.hide.join()}|${settings.view}|${filter.join()}`} />
      <main className="wrap">
        <section className="hero" data-part="hero">
          <h1>
            <span>Anay</span> <span>Baid</span>
          </h1>
          <div className="hero-grid">
            <img
              className="photo"
              src="/avatar-240.webp"
              srcSet="/avatar-240.webp 240w, /avatar-400.webp 400w"
              sizes="(max-width: 620px) 112px, (max-width: 920px) 160px, 240px"
              alt="Anay Baid"
              width={240}
              height={240}
              fetchPriority="high"
            />
            <div className="hero-copy">
              <p className="lede">
                I work on backend and data tooling. Right now I'm on co-op with Purolator's Network Engineering team,
                working on forecasting and planning tools.
              </p>
              <p className="sub">
                Fourth-year Computer Science at Waterloo, graduating in April 2027. Four co-op terms so far, in backend,
                test automation, DevOps and data engineering.
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

        <Glance onCheck={() => setMatcherOpen(true)} />

        {filter.length > 0 && (
          <div className="filterbar" role="status" data-part="filter">
            <p>
              Showing work with {listFormat(filter)}.{' '}
              <span>
                {experience.filter((e) => fits(e.tech, filter)).length} of {experience.length} jobs,{' '}
                {projects.filter((p) => fits(p.tech, filter)).length} of {projects.length} projects
              </span>
            </p>
            <span className="filterbar-actions">
              <button type="button" onClick={() => window.print()}>Print this view</button>
              <button type="button" onClick={() => applyFilter([])}>Clear filter</button>
            </span>
          </div>
        )}

        <Experience active={activeJob} onPick={openJob} filter={filter} />

        <section className="section" aria-labelledby="projects" data-part="projects">
          <h2 id="projects">Projects</h2>
          <div className="section-body">
            <ol className="entries">
              {projects.map((p) => (
                <li key={p.title} className={entryClass(false, !fits(p.tech, filter))} id={`project-${slug(p.title)}`}>
                  <p className="entry-when">{p.period}</p>
                  <div className="entry-main">
                    <h3 className="entry-title">
                      {p.link ? <a href={p.link} target="_blank" rel="noreferrer">{p.title}</a> : p.title}
                      <CopyLink id={`project-${slug(p.title)}`} name={p.title} />
                    </h3>
                    {p.award && p.highlight?.value !== 'Won' && <p className="entry-sub">{p.award}</p>}
                    <Result h={p.highlight} />
                    <p className="entry-desc">{p.description}</p>
                    <Bullets items={p.bullets} />
                    <p className="stack">{p.tech.join(', ')}</p>
                    {p.how && <HowItWorks how={p.how} name={p.title} />}
                    <ProjectLinks p={p} onPreview={() => setPreview(p.link ?? null)} />
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section" aria-labelledby="education" data-part="education">
          <h2 id="education">Education</h2>
          <div className="section-body">
            <div className="entry solo">
              <p className="entry-when">{education.gradDate.replace('Expected ', 'Graduating ')}</p>
              <div className="entry-main">
                <h3 className="entry-title">
                  <img src={education.logo} alt="" width={28} height={28} />
                  {education.school}
                </h3>
                <p className="entry-sub">{education.degree}</p>
                <p className="stack">{education.specializations}</p>
                <Bullets items={education.highlights} />
              </div>
            </div>
          </div>
        </section>

        <Skills onFilter={applyFilter} />

        <section className="section" aria-labelledby="github" data-part="github">
          <h2 id="github">Recently on GitHub</h2>
          <div className="section-body">
            <WhenVisible>
              <Activity user="anaybaid7" />
              <GithubActivity />
            </WhenVisible>
          </div>
        </section>

        <section className="section" aria-labelledby="colophon" data-part="colophon">
          <h2 id="colophon">About this site</h2>
          <div className="section-body">
            <dl className="facts colophon">
              <div>
                <dt>Built with</dt>
                <dd>React 19, TypeScript and Vite, plain CSS, and the Archivo typeface served from this site</dd>
              </div>
              <div>
                <dt>Tested with</dt>
                <dd>
                  {__SITE_STATS__.unit} unit tests in Vitest and Testing Library, {__SITE_STATS__.e2e} browser tests in
                  Playwright, run in CI on every push
                </dd>
              </div>
              <div>
                <dt>Content</dt>
                <dd>Every job, project and skill comes from one typed data file, checked against a Zod schema while I edit it</dd>
              </div>
              <div>
                <dt>Formats</dt>
                <dd>
                  The same data file is built into a <a href={FILES.text}>plain text resume</a>,{' '}
                  <a href={FILES.json}>JSON Resume</a>, a <a href={FILES.vcard} download>contact card</a> and search engine
                  data. Try <code>curl {profile.links.site.replace('https://', '')}/{FILES.text}</code>
                </dd>
              </div>
              <div>
                <dt>Privacy</dt>
                <dd>No analytics and no cookies. Settings stay in your browser, and the job posting checker runs locally</dd>
              </div>
              <div>
                <dt>Offline</dt>
                <dd>A service worker caches the site after the first visit</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  <a href={`${profile.links.github}/anay-baid-website`} target="_blank" rel="noreferrer">github.com/anaybaid7/anay-baid-website</a>
                  {__SITE_STATS__.commit && <>, built {updated} from {__SITE_STATS__.commit}</>}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>

      <footer className="foot" id="contact">
        <div className="wrap">
          <p className="foot-ask">Email is the quickest way to reach me.</p>
          <p className="foot-mail">
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          <p className="foot-actions">
            <CopyEmail />
            <button type="button" onClick={showResume}>Read resume</button>
            <a className="button" href={FILES.vcard} download>Save contact card</a>
            {typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={() => navigator.share({ title: 'Anay Baid', url: location.href }).catch(() => {})}
              >
                Share
              </button>
            )}
          </p>
          <p className="foot-note">
            {replyNote(hour, weekend)} It's {time} in Toronto{visitorTime && <>, {visitorTime} where you are</>}.
          </p>
          <div className="foot-row">
            <span className="foot-links">
              <a href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
              <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              <a href={profile.links.devpost} target="_blank" rel="noreferrer">Devpost</a>
              <a href={`tel:${profile.phone.replace(/[^0-9]/g, '')}`}>{profile.phone}</a>
            </span>
            <span className="foot-extra">
              <a href={FILES.text}>Plain text resume</a>
              <a href={FILES.json} download>JSON Resume</a>
              <button type="button" onClick={() => setKeysOpen(true)}>Keyboard shortcuts</button>
              <span>Updated {updated}</span>
            </span>
          </div>
        </div>
      </footer>
      <CommandMenu commands={commands} open={menuOpen} onOpenChange={setMenuOpen} />
      <ResumeViewer open={resumeOpen} onClose={() => setResumeOpen(false)} />
      <SettingsPanel />
      <Matcher open={matcherOpen} onOpenChange={setMatcherOpen} onFilter={applyFilter} />
      <Shortcuts open={keysOpen} onOpenChange={setKeysOpen} />
      <LivePreview
        url={preview ?? ''}
        title="Battleship for Purolator"
        open={preview !== null}
        onOpenChange={(o) => !o && setPreview(null)}
      />
    </>
  )
}
