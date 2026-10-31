import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { profile, experience, projects, education, skills, skillLabels, AREAS, type Area } from './data'
import { downloadResume } from './downloadResume'
import GithubActivity from './components/GithubActivity'
import ThemeToggle from './components/ThemeToggle'
import { parsePeriod, monthIndex, monthLabel } from './timeline'
import { slug, uses, whereUsed } from './evidence'
import CommandMenu, { type Command } from './components/CommandMenu'
import ResumeViewer from './components/ResumeViewer'
import { openResume } from './resume'
import SettingsPanel from './components/SettingsPanel'
import Matcher from './components/Matcher'
import Shortcuts from './components/Shortcuts'
import { setSettings, useSettings, withTransition, resolvedTheme } from './settings'
import { FILES, downloadJsonResume, downloadVcard } from './exports'
import { ENTRIES, entryById } from './entries'
import { DETAILS, tabsFor, type DemoKind, type Tab } from './details'
import { SHOWCASE, thumb } from './showcase'
import { NOTES } from './decisions'
import type { Opened } from './components/DetailDrawer'
import Minimap from './components/Minimap'
import MiniArch from './components/MiniArch'
import { prerendered, useHydrated } from './hydrated'
import type { Action as TermAction } from './terminal'

// the drawer and its demos load the first time someone opens one
const DetailDrawer = lazy(() => import('./components/DetailDrawer'))
const Terminal = lazy(() => import('./components/Terminal'))

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
      <span className="toast" role="status" aria-live="polite" data-show={copied}>
        {copied && <>Copied {profile.email} to your clipboard</>}
      </span>
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

function detailFromUrl(): Opened | null {
  const q = new URLSearchParams(location.search)
  const id = q.get('open')
  // tab=play was the old name for the demo tab, so older links still land on it
  const tab = q.get('tab') === 'play' ? 'try' : (q.get('tab') as Tab)
  const demo = DETAILS[id ?? '']?.demos?.find((d) => d.kind === q.get('demo'))?.kind
  return id && ENTRIES.some((e) => e.id === id) ? { id, tab: tab || 'overview', demo } : null
}

// ?for=data shows the page through one area of work, for a role hiring for it
const lensFromUrl = (): Area | null => {
  const a = new URLSearchParams(location.search).get('for')
  return a && a in AREAS ? (a as Area) : null
}

const ownerFromUrl = () => new URLSearchParams(location.search).has('me')

const filterFromUrl = () =>
  (new URLSearchParams(location.search).get('stack') ?? '').split(',').map((x) => x.trim()).filter(Boolean)

// The month the page counts up to. Prerendered HTML uses the build month so
// hydration matches, then App moves it to the real month once it's running.
const monthOf = (d: Date) => monthIndex(d.getFullYear(), d.getMonth())
let thisMonth = prerendered ? monthOf(new Date(__BUILD_DATE__)) : monthOf(new Date())
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
const totalMonths = () => experience.reduce((sum, e) => sum + monthsSoFar(e.period), 0)

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

const OPEN_LABEL: Record<Tab, string> = { overview: '', how: 'diagram', decisions: 'decisions', screens: 'screens', try: 'demo', code: 'code' }

// the button on each row that opens its drawer, named after what's inside
function OpenDetail({ id, onOpen }: { id: string; onOpen: (id: string) => void }) {
  const extra = tabsFor(id).slice(1).map((t) => OPEN_LABEL[t])
  if (extra.length === 0) return null
  return (
    <button type="button" className="open-detail" onClick={() => onOpen(id)}>
      Open details <span className="open-what">{listFormat(extra)}</span> <span aria-hidden="true">→</span>
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
          <>{plural(experience.length, 'co-op term')}, {totalMonths()} months of full-time work so far</>
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

function Experience({ active, onPick, filter, onOpen }: { active: number; onPick: (i: number) => void; filter: string[]; onOpen: (id: string, tab?: Tab) => void }) {
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
              data-areas={e.areas.join(' ')}
              id={`job-${slug(shortOrg(e.org))}`}
            >
              <p className="entry-when">
                {shortPeriod(e.period)}
                <span>{isCurrent(e.period) ? 'Current role' : plural(monthsIn(e.period), 'month')}</span>
                <MiniArch id={`job-${slug(shortOrg(e.org))}`} name={shortOrg(e.org)} onOpen={(id) => onOpen(id, 'how')} />
              </p>
              <div className="entry-main">
                <h3 className="entry-title">
                  <img src={e.logo} alt="" width={28} height={28} />
                  <a href={e.orgUrl} target="_blank" rel="noreferrer">{shortOrg(e.org)}</a>
                  <CopyLink id={`job-${slug(shortOrg(e.org))}`} name={shortOrg(e.org)} />
                </h3>
                <p className="entry-sub">{e.role}</p>
                <Result h={e.highlight} />
                <p className="entry-why"><span>The problem</span> {e.why}</p>
                <Bullets items={e.bullets} />
                <p className="stack">{e.tech.join(', ')}</p>
                <OpenDetail id={`job-${slug(shortOrg(e.org))}`} onOpen={onOpen} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

// the outside links for a project, named for where they go
function ProjectLinks({ p }: { p: (typeof projects)[number] }) {
  const github = [p.link, p.code].find((u) => u?.includes('github.com'))
  const live = p.status === 'Live' ? p.link : undefined
  const devpost = p.link?.includes('devpost') ? p.link : undefined
  if (!github && !live && !devpost) return null
  return (
    <span className="project-links">
      {live && <a href={live} target="_blank" rel="noreferrer">Play it live</a>}
      {github && <a href={github} target="_blank" rel="noreferrer">Source</a>}
      {devpost && <a href={devpost} target="_blank" rel="noreferrer">Devpost</a>}
    </span>
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
function Glance({ onCheck }: { onCheck?: () => void }) {
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
              {plural(experience.length, 'term')}, {totalMonths()} months, at {listFormat(experience.map((e) => shortOrg(e.org)))}
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
        {onCheck && (
          <p className="glance-check">
            <button type="button" onClick={onCheck}>Check a posting</button>
          </p>
        )}
      </div>
    </section>
  )
}

// Every step of every flow is searchable, including the code and payloads
// it shows, and opens the diagram right on that step.
function insideCommands(show: (d: Opened) => void): Command[] {
  return Object.entries(DETAILS).flatMap(([id, d]) => {
    const title = entryById(id)?.title.replace(/ \(.*\)$/, '') ?? id
    const label = (n: string) => d.arch.nodes.find((x) => x.id === n)?.label ?? n
    return (d.flows ?? []).flatMap((fl, fi) =>
      fl.steps.map((st, si) => ({
        group: 'Inside the work',
        label: st.title,
        hint: `${title}, ${fl.name}, step ${si + 1}`,
        keywords: `${label(st.from)} ${label(st.to)} ${st.detail} ${st.payload?.label ?? ''} ${st.payload?.code ?? ''}`,
        deep: true,
        run: () => show({ id, tab: 'how', at: { flow: fi + 1, step: si + 1 } }),
      })),
    )
  })
}

// The through-line: what was slow or manual at each place, what I built,
// and what changed, in the order it happened. Each row opens its drawer.
const THREAD: [string, string[]][] = [
  ['2023', ['project-ci-cd-build-automation-tool']],
  ['2024', ['job-cineplex-entertainment', 'job-nationwide-appraisals']],
  ['2025', ['job-iotum']],
  ['2026', ['project-starrez-enterprise-automation-suite', 'job-purolator', 'project-battleship-for-purolator', 'project-insightvault']],
]

function Thread({ onOpen, lens, onLens }: { onOpen: (id: string, tab?: Tab) => void; lens: Area | null; onLens: (a: Area | null) => void }) {
  return (
    <section className="section thread" aria-labelledby="thread" data-part="thread">
      <h2 id="thread">What I work on</h2>
      <div className="section-body">
        <p className="thread-lede">
          I take work people do by hand and build the system that does it. Each term added a layer.
        </p>
        <div className="lens" role="radiogroup" aria-label="Show what is relevant to a role">
          <span className="lens-label">Hiring for</span>
          <button type="button" role="radio" aria-checked={lens === null} onClick={() => onLens(null)}>Anything</button>
          {(Object.keys(AREAS) as Area[]).map((a) => (
            <button key={a} type="button" role="radio" aria-checked={lens === a} onClick={() => onLens(lens === a ? null : a)}>
              {AREAS[a]} <span>{ENTRIES.filter((e) => e.areas.includes(a)).length}</span>
            </button>
          ))}
        </div>
        {lens && (
          <p className="lens-sum" aria-live="polite">
            {ENTRIES.filter((e) => e.areas.includes(lens)).length} of {ENTRIES.length} match
          </p>
        )}
        <div className="thread-table">
          <div className="thread-row head" aria-hidden="true">
            <span>Where</span>
            <span>What was slow or manual</span>
            <span>What I built</span>
            <span>Result</span>
          </div>
          {THREAD.map(([year, ids]) => (
            <div key={year} className="thread-year">
              <p className="thread-y" aria-hidden="true">{year}</p>
              {ids.map((id) => {
                const e = entryById(id)!
                return (
                  <button key={id} type="button" className="thread-row" data-areas={e.areas.join(' ')} onClick={() => onOpen(id, 'overview')}>
                    <span className="thread-where">
                      <b>{e.title.replace(/ \(.*\)$/, '')}</b>
                      <small>{e.kind === 'job' ? e.sub : 'Project'}</small>
                    </span>
                    <span>{e.why}</span>
                    <span>{e.built}</span>
                    <span className="thread-result">
                      {e.highlight && (
                        <>
                          <b>{e.highlight.value}</b> {e.highlight.label}
                        </>
                      )}
                    </span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// The demos up front, as pictures, so the work shows before any reading.
// Each opens its drawer on that demo.
const demoCount = Object.values(DETAILS).reduce((n, d) => n + (d.demos?.length ?? 0), 0)

function Showcase({ onOpen }: { onOpen: (id: string, tab: Tab, demo: DemoKind) => void }) {
  return (
    <section className="section showcase" aria-labelledby="try-work" data-part="showcase">
      <h2 id="try-work">Try the work</h2>
      <div className="section-body">
        <p className="showcase-sum">
          {demoCount} working demos and {Object.keys(DETAILS).length} system diagrams, running in your browser on sample data.
        </p>
        <ul className="shots">
          {SHOWCASE.map((t) => {
            const e = entryById(t.id)!
            return (
              <li key={t.kind} className="shot-tile" data-areas={e.areas.join(' ')}>
                <button type="button" onClick={() => onOpen(t.id, 'try', t.kind)}>
                  <span className="shot">
                    <img className="lt" src={thumb(t, 'light')} alt="" width={640} height={400} loading="lazy" decoding="async" />
                    <img className="dk" src={thumb(t, 'dark')} alt="" width={640} height={400} loading="lazy" decoding="async" />
                  </span>
                  <span className="shot-title">{t.title}</span>
                  <span className="shot-where">{shortOrg(e.title.replace(/ \(.*\)$/, ''))}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}

// Skills as on the resume, grouped. Click one to show only the work that used it.
function Skills({ onFilter }: { onFilter: (skills: string[]) => void }) {
  return (
    <section className="section" aria-labelledby="skills" data-part="skills">
      <h2 id="skills">Skills</h2>
      <div className="section-body">
        <p className="skills-hint">Click a skill to see the work that used it.</p>
        <dl className="skill-list">
          {(Object.keys(skills) as (keyof typeof skills)[]).map((k) => (
            <div key={k}>
              <dt>{skillLabels[k]}</dt>
              <dd>
                {skills[k].map((sk) => {
                  const used = whereUsed(sk).length > 0
                  return used ? (
                    <button key={sk} type="button" onClick={() => onFilter([sk])}>
                      {sk}
                    </button>
                  ) : (
                    <span key={sk}>{sk}</span>
                  )
                })}
              </dd>
            </div>
          ))}
        </dl>
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
  const [termOpen, setTermOpen] = useState(false)
  const hydrated = useHydrated()
  const [, setMonthTick] = useState(0)
  const [detail, setDetail] = useState<Opened | null>(() => (prerendered ? null : detailFromUrl()))
  const [filter, setFilter] = useState<string[]>(() => (prerendered ? [] : filterFromUrl()))
  const [lens, setLens] = useState<Area | null>(() => (prerendered ? null : lensFromUrl()))
  // the posting matcher is my own tool, only there with ?me in the URL
  const [owner, setOwner] = useState(() => !prerendered && ownerFromUrl())

  // after hydrating prerendered HTML, pick up what the URL and the clock say
  // This has to be an effect: hydration must first match the HTML exactly.
  /* eslint-disable react/set-state-in-effect */
  useLayoutEffect(() => {
    if (!prerendered) return
    setDetail(detailFromUrl())
    setFilter(filterFromUrl())
    setLens(lensFromUrl())
    setOwner(ownerFromUrl())
    const real = monthOf(new Date())
    if (real !== thisMonth) {
      thisMonth = real
      setMonthTick((n) => n + 1)
    }
  }, [])
  /* eslint-enable react/set-state-in-effect */

  // which drawer is open lives in the URL, so it can be shared or reloaded
  const showDetail = useCallback((next: Opened | null) => {
    setDetail(next)
    const url = new URL(location.href)
    if (next) {
      url.searchParams.set('open', next.id)
      if (next.tab === 'overview') url.searchParams.delete('tab')
      else url.searchParams.set('tab', next.tab)
    } else {
      url.searchParams.delete('open')
      url.searchParams.delete('tab')
    }
    // a flow and step only make sense for the diagram they were set on
    url.searchParams.delete('flow')
    url.searchParams.delete('step')
    url.searchParams.delete('demo')
    if (next?.demo && next.tab === 'try') url.searchParams.set('demo', next.demo)
    if (next?.at) {
      url.searchParams.set('flow', String(next.at.flow))
      url.searchParams.set('step', String(next.at.step))
    }
    history.replaceState(null, '', url)
    if (next) setActiveJob(experience.findIndex((e) => `job-${slug(shortOrg(e.org))}` === next.id))
  }, [])
  const openDetail = useCallback(
    (id: string, tab?: Tab, demo?: DemoKind) => showDetail({ id, tab: tab ?? tabsFor(id)[1] ?? 'overview', demo }),
    [showDetail],
  )
  const settings = useSettings()

  // the lens lives in the URL, so a recruiter can share the view they used
  const applyLens = useCallback((next: Area | null) => {
    withTransition(() => setLens(next))
    const url = new URL(location.href)
    if (next) url.searchParams.set('for', next)
    else url.searchParams.delete('for')
    history.replaceState(history.state, '', url)
  }, [])

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
        case 'm': if (owner) setMatcherOpen(true); break
        case '`': setTermOpen(true); break
        case ',': (document.getElementById('settings') as (HTMLElement & { togglePopover?: () => void }) | null)?.togglePopover?.(); break
        case '?': setKeysOpen(true); break
        case 'Escape': if (filter.length) applyFilter([]); return
        default: return
      }
      e.preventDefault()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [settings, filter, applyFilter, owner])
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

  // what terminal commands do to the page
  const onTermAction = (a: TermAction) => {
    if (a.kind === 'open') {
      const tabs = tabsFor(a.id)
      showDetail({ id: a.id, tab: a.tab && tabs.includes(a.tab as Tab) ? (a.tab as Tab) : (tabs[1] ?? 'overview'), at: a.at })
    }
    if (a.kind === 'filter') applyFilter(a.skills)
    if (a.kind === 'theme') setSettings({ theme: a.value })
    if (a.kind === 'view') setSettings({ view: a.value })
    if (a.kind === 'resume') showResume()
  }

  const commands = useMemo<Command[]>(() => {
    const copy = () => navigator.clipboard?.writeText(profile.email).catch(() => {})
    return [
      ...experience.map((e) => ({ group: 'Jobs', label: `${shortOrg(e.org)}, ${e.role}`, keywords: e.tech.join(' '), run: () => showDetail({ id: `job-${slug(shortOrg(e.org))}`, tab: 'overview' }) })),
      ...projects.map((p) => ({ group: 'Projects', label: p.title, keywords: `${p.period} ${p.tech.join(' ')}`, run: () => showDetail({ id: `project-${slug(p.title)}`, tab: 'overview' }) })),
      { group: 'Get in touch', label: 'Email Anay', keywords: 'contact mail', run: () => (location.href = `mailto:${profile.email}`) },
      { group: 'Get in touch', label: 'Copy email address', keywords: 'clipboard contact', run: copy },
      { group: 'Get in touch', label: 'Read the resume', keywords: 'cv pdf', run: showResume },
      { group: 'Get in touch', label: 'Download the resume', keywords: 'cv pdf', run: downloadResume },
      { group: 'Elsewhere', label: 'GitHub', run: () => window.open(profile.links.github, '_blank', 'noopener') },
      { group: 'Elsewhere', label: 'LinkedIn', run: () => window.open(profile.links.linkedin, '_blank', 'noopener') },
      { group: 'Elsewhere', label: 'Devpost', keywords: 'hackathons', run: () => window.open(profile.links.devpost, '_blank', 'noopener') },
      { group: 'Elsewhere', label: 'Play Battleship live', keywords: 'game demo', run: () => window.open('https://purolator-battleship.onrender.com', '_blank', 'noopener') },
      { group: 'Page', label: 'Skills', run: () => goTo('skills') },
      { group: 'Page', label: 'Code on GitHub', keywords: 'repos source', run: () => goTo('github') },
      { group: 'Page', label: 'Switch light or dark', keywords: 'theme mode', run: () => (document.querySelector('.theme') as HTMLButtonElement | null)?.click() },
      { group: 'Page', label: 'Switch between full detail and skim', keywords: 'view compact summary', run: () => setSettings({ view: document.documentElement.dataset.view === 'skim' ? 'full' : 'skim' }) },
      { group: 'Page', label: 'Settings', keywords: 'preferences text size accent motion', run: () => (document.getElementById('settings') as (HTMLElement & { showPopover?: () => void }) | null)?.showPopover?.() },
      { group: 'Page', label: 'Print this view', keywords: 'pdf one page tailored', run: () => window.print() },
      { group: 'Page', label: 'Keyboard shortcuts', keywords: 'keys help', run: () => setKeysOpen(true) },
      { group: 'Page', label: 'Open the terminal', keywords: 'shell cli command line', run: () => setTermOpen(true) },
      ...(owner ? [{ group: 'Hiring', label: 'Check against a job posting', keywords: 'match requirements jd', run: () => setMatcherOpen(true) }] : []),
      ...stackFilterCommands(applyFilter),
      { group: 'Hiring', label: 'Save contact card', keywords: 'vcard vcf contacts', run: downloadVcard },
      { group: 'Hiring', label: 'Download resume as JSON Resume', keywords: 'json ats data', run: downloadJsonResume },
      { group: 'Hiring', label: 'Plain text resume', keywords: 'txt ats copy paste', run: () => window.open(FILES.text, '_blank', 'noopener') },
      { group: 'Hiring', label: 'Show everything', keywords: 'lens all clear hiring for', run: () => applyLens(null) },
      ...(Object.keys(AREAS) as Area[]).map((k) => ({
        group: 'Hiring',
        label: `Hiring for ${AREAS[k].toLowerCase()}`,
        keywords: 'lens role focus relevant',
        run: () => {
          applyLens(k)
          goTo('thread')
        },
      })),
      ...insideCommands(showDetail),
      ...Object.entries(NOTES).flatMap(([id, n]) =>
        n.decisions.map((d) => ({
          group: 'Decisions',
          label: d.chose,
          hint: `${entryById(id)?.title.replace(/ \(.*\)$/, '')}, instead of ${d.over}`,
          keywords: d.because,
          deep: true,
          run: () => showDetail({ id, tab: 'decisions' }),
        })),
      ),
    ]
  }, [showDetail, showResume, applyFilter, applyLens, owner])
  return (
    <>
      <div className="progress" aria-hidden="true" />
      <a className="skip" href="#experience">Skip to experience</a>
      <header className="top wrap">
        <span className="top-name">Anay Baid</span>
        <span className="top-time">Toronto{hydrated && `, ${time}`}</span>
        <nav aria-label="Contact">
          <button type="button" className="search" onClick={() => setMenuOpen(true)}>
            Search <kbd>{hydrated && navigator.platform?.includes('Mac') ? '⌘K' : 'Ctrl K'}</kbd>
          </button>
          <a href={`mailto:${profile.email}`}>Email</a>
          <button type="button" onClick={showResume}>Resume</button>
          <button type="button" className="settings-open" popoverTarget="settings" title="Settings (,)">Settings</button>
          <ThemeToggle />
        </nav>
      </header>

      <Minimap version={`${settings.lead}|${settings.hide.join()}|${settings.view}|${filter.join()}`} />
      <main className="wrap" data-lens={lens ?? undefined}>
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
                I build backend services and data pipelines. Right now I'm on co-op with Purolator's Network
                Engineering team, working on the forecasting pipeline and planning tools and the AWS infrastructure
                they run on.
              </p>
              <p className="sub">Fourth-year Computer Science at Waterloo, graduating April 2027.</p>
              <p className="hero-links">
                <a className="primary" href={`mailto:${profile.email}`}>Email me</a>
                <button type="button" onClick={showResume}>Read resume</button>
                <a href={profile.links.github} target="_blank" rel="noreferrer">GitHub</a>
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
              </p>
            </div>
          </div>
        </section>

        <Showcase onOpen={openDetail} />

        <Thread onOpen={openDetail} lens={lens} onLens={applyLens} />

        <Glance onCheck={owner ? () => setMatcherOpen(true) : undefined} />

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

        <Experience active={activeJob} onPick={openJob} filter={filter} onOpen={openDetail} />

        <section className="section" aria-labelledby="projects" data-part="projects">
          <h2 id="projects">Projects</h2>
          <div className="section-body">
            <ol className="entries">
              {projects.map((p) => (
                <li key={p.title} className={entryClass(false, !fits(p.tech, filter))} data-areas={p.areas.join(' ')} id={`project-${slug(p.title)}`}>
                  <p className="entry-when">
                    {p.period}
                    <MiniArch id={`project-${slug(p.title)}`} name={p.title} onOpen={(id) => openDetail(id, 'how')} />
                  </p>
                  <div className="entry-main">
                    <h3 className="entry-title">
                      {p.link ? <a href={p.link} target="_blank" rel="noreferrer">{p.title}</a> : p.title}
                      <CopyLink id={`project-${slug(p.title)}`} name={p.title} />
                    </h3>
                    {p.award && p.highlight?.value !== 'Won' && <p className="entry-sub">{p.award}</p>}
                    <Result h={p.highlight} />
                    <p className="entry-desc">{p.description}</p>
                    <p className="entry-why"><span>Why I built it</span> {p.why}</p>
                    <Bullets items={p.bullets} />
                    <p className="stack">{p.tech.join(', ')}</p>
                    <div className="entry-actions">
                      <OpenDetail id={`project-${slug(p.title)}`} onOpen={openDetail} />
                      <ProjectLinks p={p} />
                    </div>
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
          <h2 id="github">Code</h2>
          <div className="section-body">
            <GithubActivity />
          </div>
        </section>

        <section className="section" aria-labelledby="colophon" data-part="colophon">
          <h2 id="colophon">About this site</h2>
          <div className="section-body">
            <dl className="facts colophon">
              <div>
                <dt>Built with</dt>
                <dd>React, TypeScript, Vite and plain CSS</dd>
              </div>
              <div>
                <dt>Content</dt>
                <dd>Everything on the page comes from one data file, which also builds the <a href={FILES.text}>plain text resume</a> and <a href={FILES.json}>JSON Resume</a></dd>
              </div>
              <div>
                <dt>Tested</dt>
                <dd>Every push runs lint, type checks, unit tests, and browser tests with accessibility scans</dd>
              </div>
              <div>
                <dt>Privacy</dt>
                <dd>No tracking and no cookies. Settings stay in your browser</dd>
              </div>
              <div>
                <dt>Source</dt>
                <dd>
                  <a href={`${profile.links.github}/anay-baid-website`} target="_blank" rel="noreferrer">github.com/anaybaid7/anay-baid-website</a>
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
            {hydrated && typeof navigator.share === 'function' && (
              <button
                type="button"
                onClick={() => navigator.share({ title: 'Anay Baid', url: location.href }).catch(() => {})}
              >
                Share
              </button>
            )}
          </p>
          <p className="foot-note">
            {hydrated ? (
              <>
                {replyNote(hour, weekend)} It's {time} in Toronto{visitorTime && <>, {visitorTime} where you are</>}.
              </>
            ) : (
              'I usually reply within a day.'
            )}
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
      {detail && (
        <Suspense fallback={null}>
          <DetailDrawer open={detail} onChange={showDetail} />
        </Suspense>
      )}
      {owner && <Matcher
        open={matcherOpen}
        onOpenChange={setMatcherOpen}
        onFilter={applyFilter}
        onStep={(id, flow, step) => showDetail({ id, tab: 'how', at: { flow, step } })}
        onLens={(a) => {
          applyLens(a)
          setTimeout(() => goTo('thread'), 0)
        }}
      />}
      <Shortcuts open={keysOpen} onOpenChange={setKeysOpen} />
      {termOpen && (
        <Suspense fallback={null}>
          <Terminal open={termOpen} onOpenChange={setTermOpen} onAction={onTermAction} />
        </Suspense>
      )}
    </>
  )
}
