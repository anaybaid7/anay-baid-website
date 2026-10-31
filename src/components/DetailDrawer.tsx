import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { DETAILS, tabsFor, type DemoKind, type Tab } from '../details'
import { ENTRIES, entryById } from '../entries'
import ArchDiagram from './ArchDiagram'
import Screens from './Screens'
import CodeView from './CodeView'
import Decisions from './Decisions'
import { Clip } from './Media'
import { NOTES } from '../decisions'
import { SpeedPicker } from './sim/SpeedPicker'
import { sourcesFor } from './demos/sources'
import PipelineRun from './demos/PipelineRun'
import Planner from './demos/Planner'
import Allocation from './demos/Allocation'
import SdkRun from './demos/SdkRun'
import ReleaseRun from './demos/ReleaseRun'
import Provision from './demos/Provision'
import SalesStream from './demos/SalesStream'
import Reconcile from './demos/Reconcile'
import FraudQueue from './demos/FraudQueue'
import FraudScorer from './demos/FraudScorer'
import Extension from './demos/Extension'
import BattleshipMatch from './demos/BattleshipMatch'
import DispatchRun from './demos/DispatchRun'
import Shelter from './demos/Shelter'
import RouterApp from './demos/RouterApp'
import Evaluate from './demos/Evaluate'
import Network from './demos/Network'
import Shift from './demos/Shift'
import Heatmap from './demos/Heatmap'
import Graph from './demos/Graph'
import Observer from './demos/Observer'
import Drift from './demos/Drift'
import Showtime from './demos/Showtime'
import Sequence from './demos/Sequence'
import Terraform from './demos/Terraform'

const DEMOS: Record<DemoKind, () => React.JSX.Element> = {
  pipeline: PipelineRun,
  planner: Planner,
  allocation: Allocation,
  sdk: SdkRun,
  release: ReleaseRun,
  provision: Provision,
  stream: SalesStream,
  dataval: Reconcile,
  fraud: FraudQueue,
  scorer: FraudScorer,
  extension: Extension,
  battleship: BattleshipMatch,
  build: DispatchRun,
  fsm: Shelter,
  router: RouterApp,
  evaluate: Evaluate,
  network: Network,
  shift: Shift,
  heatmap: Heatmap,
  graph: Graph,
  observer: Observer,
  drift: Drift,
  showtime: Showtime,
  sequence: Sequence,
  terraform: Terraform,
}

// the demos for one entry, with a row of sub-tabs when there is more than one
function TryIt({ demos, first }: { demos: { kind: DemoKind; name: string }[]; first?: DemoKind }) {
  const [i, setI] = useState(() => Math.max(0, demos.findIndex((d) => d.kind === first)))
  const Demo = DEMOS[demos[i].kind]
  return (
    <div className="try">
      <div className="try-bar">
        {demos.length > 1 && (
          <div className="sub-tabs" role="tablist" aria-label="Demos">
            {demos.map((d, j) => (
              <button key={d.kind} type="button" role="tab" aria-selected={i === j} onClick={() => setI(j)}>
                {d.name}
              </button>
            ))}
          </div>
        )}
        <span className="sample">Sample data</span>
        <SpeedPicker />
      </div>
      <Demo key={demos[i].kind} />
    </div>
  )
}

// the logic modules behind an entry's demos, one file at a time
function CodeTab({ kinds }: { kinds: DemoKind[] }) {
  const files = sourcesFor(kinds)
  const [i, setI] = useState(0)
  return (
    <div className="code-tab">
            {files.length > 1 && (
        <div className="sub-tabs" role="tablist" aria-label="Files">
          {files.map((f, j) => (
            <button key={f.file} type="button" role="tab" aria-selected={i === j} onClick={() => setI(j)}>
              {f.file}
            </button>
          ))}
        </div>
      )}
      <CodeView {...files[Math.min(i, files.length - 1)]} />
    </div>
  )
}

const TAB_NAMES: Record<Tab, string> = {
  overview: 'Overview',
  how: 'How it works',
  decisions: 'Decisions',
  screens: 'Screens',
  try: 'Try it',
  code: 'Code',
}

// The first tab: the work in motion, then the problem, one decision and the
// details, so the overview isn't a copy of the page
function Overview({ entry, onTab }: { entry: NonNullable<ReturnType<typeof entryById>>; onTab: (t: Tab, demo?: DemoKind) => void }) {
  const demo = DETAILS[entry.id]?.demos?.[0]
  const notes = NOTES[entry.id]
  const d = notes?.decisions[0]
  return (
    <div className="drawer-overview">
      <div className="ov-top">
        {demo && (
          <button type="button" className="ov-media" onClick={() => onTab('try', demo.kind)} aria-label={`Try ${demo.name}`}>
            <Clip kind={demo.kind} eager />
            <span className="ov-try">Try {demo.name.toLowerCase()} →</span>
          </button>
        )}
        <div className="ov-facts">
          <p className="drawer-when">{entry.when}</p>
          {entry.highlight && (
            <p className="entry-result">
              <b>{entry.highlight.value}</b> {entry.highlight.label}
            </p>
          )}
          <dl className="feature-case">
            <div>
              <dt>{entry.kind === 'job' ? 'Problem' : 'Why'}</dt>
              <dd>{entry.why}</dd>
            </div>
            {d && (
              <div>
                <dt>Decision</dt>
                <dd>
                  {d.chose} over {d.over}.{' '}
                  <button type="button" className="ov-link" onClick={() => onTab('decisions')}>
                    {notes.decisions.length > 1 ? `${notes.decisions.length - 1} more` : 'Why'}
                  </button>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
      {entry.description && <p className="entry-desc">{entry.description}</p>}
      <ul className="dashes">
        {entry.bullets.map((b) => <li key={b}>{b}</li>)}
      </ul>
      <ul className="chips" aria-label="Stack">
        {entry.tech.map((t) => <li key={t}>{t}</li>)}
      </ul>
      {entry.links.length > 0 && (
        <p className="project-links">
          {entry.links.map((l) => (
            <a key={l.href + l.label} href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
          ))}
        </p>
      )}
    </div>
  )
}

// A panel that slides in from the right with everything about one job or
// project. Previous and next move through the list without closing it, Esc
// closes it, and the URL keeps which one is open so it can be shared.
// which entry is open, on which tab, and optionally one step of one flow
export interface Opened {
  id: string
  tab: Tab
  at?: { flow: number; step: number }
  // which demo to start on, for links straight to one
  demo?: DemoKind
}

export default function DetailDrawer({ open, onChange }: {
  open: Opened | null
  onChange: (next: Opened | null) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  // a part of the diagram to select when a screen note links to it
  const [focus, setFocus] = useState<{ entry: string; node: string } | null>(null)
  const entry = open ? entryById(open.id) : undefined
  const detail = open ? DETAILS[open.id] : undefined
  const tabs = open ? tabsFor(open.id) : []
  const tab = open && tabs.includes(open.tab) ? open.tab : 'overview'

  // on a narrow screen the tab row scrolls, so keep the current tab in view
  useEffect(() => {
    // wait a frame, the dialog may only just be opening
    const id = requestAnimationFrame(() =>
      document.querySelector('.drawer-tabs [aria-selected="true"]')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' }),
    )
    return () => cancelAnimationFrame(id)
  }, [tab, open?.id])
  const index = entry ? ENTRIES.indexOf(entry) : -1
  const prev = index > 0 ? ENTRIES[index - 1] : undefined
  const next = index >= 0 && index < ENTRIES.length - 1 ? ENTRIES[index + 1] : undefined
  const sameKind = entry ? ENTRIES.filter((e) => e.kind === entry.kind) : []
  const focusNode = focus && focus.entry === open?.id ? focus.node : undefined

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (entry && !d.open) {
      if (d.showModal) d.showModal()
      else d.setAttribute('open', '')
    } else if (!entry && d.open) {
      if (d.close) d.close()
      else d.removeAttribute('open')
    }
  }, [entry])

  // back to the top of the panel when moving to another entry
  useEffect(() => {
    dialog.current?.querySelector('.drawer-body')?.scrollTo?.(0, 0)
  }, [open?.id])

  const go = (id: string) => onChange({ id, tab: tabsFor(id).includes(tab) ? tab : 'overview' })

  const onKey = (e: KeyboardEvent<HTMLDialogElement>) => {
    const t = e.target as HTMLElement
    if (t.closest('.arch, .demo, .try-bar, .code-tab, [role="tablist"]')) return
    if (e.key === 'ArrowRight' && next) go(next.id)
    if (e.key === 'ArrowLeft' && prev) go(prev.id)
  }

  const onTabKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const i = tabs.indexOf(tab)
    const to = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
    onChange({ id: open!.id, tab: to })
    requestAnimationFrame(() => (e.currentTarget.querySelector(`[data-tab="${to}"]`) as HTMLElement | null)?.focus())
  }

  return (
    <dialog
      ref={dialog}
      className="drawer"
      aria-labelledby="drawer-title"
      onClose={() => onChange(null)}
      onKeyDown={onKey}
      onClick={(e) => e.target === dialog.current && onChange(null)}
    >
      {entry && (
        <div className="drawer-inner">
          <header className="drawer-head">
            <p className="drawer-kind">
              {entry.kind === 'job' ? 'Experience' : 'Project'}, {sameKind.indexOf(entry) + 1} of {sameKind.length}
            </p>
            <h2 id="drawer-title">{entry.title}</h2>
            <p className="drawer-sub">{entry.sub}</p>
            <button type="button" className="drawer-close" onClick={() => onChange(null)} aria-label="Close">
              Close
            </button>
            <div className="drawer-tabs" role="tablist" aria-label="Sections" onKeyDown={onTabKey}>
              {tabs.map((t) => (
                <button
                  key={t}
                  type="button"
                  role="tab"
                  data-tab={t}
                  id={`tab-${t}`}
                  aria-selected={t === tab}
                  aria-controls="drawer-panel"
                  tabIndex={t === tab ? 0 : -1}
                  onClick={() => onChange({ id: entry.id, tab: t })}
                >
                  {TAB_NAMES[t]}
                </button>
              ))}
            </div>
          </header>

          <div className="drawer-body" id="drawer-panel" role="tabpanel" aria-labelledby={`tab-${tab}`} tabIndex={0}>
            {tab === 'overview' && (
              <Overview entry={entry} onTab={(t, demo) => onChange({ id: entry.id, tab: t, demo })} />
            )}
            {tab === 'how' && detail && <ArchDiagram
                key={`${entry.id}-${focusNode ?? ''}-${open?.at ? `${open.at.flow}.${open.at.step}` : ''}`}
                arch={detail.arch}
                flows={detail.flows}
                name={entry.title}
                initialPick={focusNode}
              />}
            {tab === 'decisions' && <Decisions id={entry.id} />}
            {tab === 'screens' && detail?.screens && (
              <Screens
                kind={detail.screens}
                nodes={detail.arch.nodes}
                onNode={(node) => {
                  setFocus({ entry: entry.id, node })
                  onChange({ id: entry.id, tab: 'how' })
                }}
              />
            )}
            {tab === 'code' && detail?.demos && <CodeTab key={entry.id} kinds={detail.demos.map((d) => d.kind)} />}
            {tab === 'try' && detail?.demos && <TryIt key={`${entry.id}-${open?.demo ?? ''}`} demos={detail.demos} first={open?.demo} />}
          </div>

          <footer className="drawer-foot">
            {prev ? (
              <button type="button" onClick={() => go(prev.id)}>
                <span aria-hidden="true">←</span> {prev.title}
              </button>
            ) : <span />}
            {next && (
              <button type="button" onClick={() => go(next.id)}>
                {next.title} <span aria-hidden="true">→</span>
              </button>
            )}
          </footer>
        </div>
      )}
    </dialog>
  )
}
