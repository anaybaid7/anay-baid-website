import { useEffect, useRef, type KeyboardEvent } from 'react'
import { DETAILS, tabsFor, type Tab } from '../details'
import { ENTRIES, entryById } from '../entries'
import ArchDiagram from './ArchDiagram'
import Screens from './Screens'
import MiniBattleship from './MiniBattleship'
import Allocation from './demos/Allocation'
import FraudScorer from './demos/FraudScorer'
import SchemaCheck from './demos/SchemaCheck'
import TargetedBuild from './demos/TargetedBuild'
import StarrezFill from './demos/StarrezFill'
import type { DemoKind } from '../details'
import CodeView from './CodeView'
import { SOURCES } from './demos/sources'

const DEMOS: Record<DemoKind, () => React.JSX.Element> = {
  battleship: MiniBattleship,
  allocation: Allocation,
  scorer: FraudScorer,
  schema: SchemaCheck,
  build: TargetedBuild,
  starrez: StarrezFill,
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
  const entry = open ? entryById(open.id) : undefined
  const detail = open ? DETAILS[open.id] : undefined
  const tabs = open ? tabsFor(open.id) : []
  const tab = open && tabs.includes(open.tab) ? open.tab : 'overview'
  const index = entry ? ENTRIES.indexOf(entry) : -1
  const prev = index > 0 ? ENTRIES[index - 1] : undefined
  const next = index >= 0 && index < ENTRIES.length - 1 ? ENTRIES[index + 1] : undefined
  const sameKind = entry ? ENTRIES.filter((e) => e.kind === entry.kind) : []

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
    if (t.closest('.arch, .bs-board, .demo, [role="tablist"]')) return
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
            {tab === 'how' && detail && <ArchDiagram arch={detail.arch} name={entry.title} />}
            {tab === 'screens' && detail?.screens && <Screens kind={detail.screens} />}
            {tab === 'code' && detail?.demo && SOURCES[detail.demo] && (
              <div className="code-tab">
                <p className="demo-lede">The code behind the demo, as it runs on this page.</p>
                <CodeView {...SOURCES[detail.demo]!} />
              </div>
            )}
            {tab === 'try' && detail?.demo && (() => {
              const Demo = DEMOS[detail.demo]
              return <Demo key={entry.id} />
            })()}
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
