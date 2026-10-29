import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { DETAILS, tabsFor, type DemoKind, type Tab } from '../details'
import { ENTRIES, entryById } from '../entries'
import ArchDiagram from './ArchDiagram'
import Screens from './Screens'
import CodeView from './CodeView'
import { SpeedPicker } from './sim/SpeedPicker'
import { sourcesFor } from './demos/sources'
import PipelineRun from './demos/PipelineRun'
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

const DEMOS: Record<DemoKind, () => React.JSX.Element> = {
  pipeline: PipelineRun,
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
}

// the demos for one entry, with a row of sub-tabs when there is more than one
function TryIt({ demos }: { demos: { kind: DemoKind; name: string }[] }) {
  const [i, setI] = useState(0)
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
      <p className="demo-lede">The logic behind the demos, exactly as it runs on this page.</p>
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
  screens: 'Screens',
  try: 'Try it',
  code: 'Code',
}

// A panel that slides in from the right with everything about one job or
// project. Previous and next move through the list without closing it, Esc
// closes it, and the URL keeps which one is open so it can be shared.
export default function DetailDrawer({ open, onChange }: {
  open: { id: string; tab: Tab } | null
  onChange: (next: { id: string; tab: Tab } | null) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  // a part of the diagram to select when a screen note links to it
  const [focus, setFocus] = useState<{ entry: string; node: string } | null>(null)
  const entry = open ? entryById(open.id) : undefined
  const detail = open ? DETAILS[open.id] : undefined
  const tabs = open ? tabsFor(open.id) : []
  const tab = open && tabs.includes(open.tab) ? open.tab : 'overview'
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

          <div className="drawer-body" id="drawer-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
            {tab === 'overview' && (
              <div className="drawer-overview">
                <p className="drawer-when">{entry.when}</p>
                {entry.highlight && (
                  <p className="entry-result">
                    <b>{entry.highlight.value}</b> {entry.highlight.label}
                  </p>
                )}
                {entry.description && <p className="entry-desc">{entry.description}</p>}
                <p className="entry-why"><span>{entry.kind === 'job' ? 'The problem' : 'Why I built it'}</span> {entry.why}</p>
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
                {tabs.length > 1 && (
                  <p className="drawer-more">
                    More in{' '}
                    {tabs.slice(1).map((t, i) => (
                      <span key={t}>
                        {i > 0 && (i === tabs.length - 2 ? ' and ' : ', ')}
                        <button type="button" onClick={() => onChange({ id: entry.id, tab: t })}>{TAB_NAMES[t]}</button>
                      </span>
                    ))}
                    .
                  </p>
                )}
              </div>
            )}
            {tab === 'how' && detail && <ArchDiagram
                key={`${entry.id}-${focusNode ?? ''}`}
                arch={detail.arch}
                flows={detail.flows}
                name={entry.title}
                initialPick={focusNode}
              />}
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
            {tab === 'try' && detail?.demos && <TryIt key={entry.id} demos={detail.demos} />}
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
