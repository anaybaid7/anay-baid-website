import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { profile } from './data'
import { useChiptune } from './useChiptune'
import { downloadResume } from './downloadResume'
import CommandPalette from './components/CommandPalette'
import { ErrorBoundary } from './components/ErrorBoundary'
import Home from './pages/Home'
import Resume from './pages/Resume'
import Projects from './pages/Projects'
import HireMe from './pages/HireMe'

// Native browser API (Chrome/Edge 111+, Safari 18+) for animating between
// DOM states without a JS animation library. Feature-detected: browsers
// without support (older Firefox) just get the instant swap they'd have had
// anyway — no missing functionality, only a missing transition.
// https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API
function withViewTransition(update: () => void) {
  if (!document.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    update()
    return
  }
  // React batches state updates by default, but the View Transition API
  // needs the "after" DOM state committed synchronously inside its callback
  // to capture a correct before/after snapshot pair — flushSync forces that.
  document.startViewTransition(() => flushSync(update))
}

export type TabId = 'home' | 'resume' | 'projects' | 'hire'

const tabs: { id: TabId; label: string; color: string }[] = [
  { id: 'home', label: 'HOME', color: 'var(--c-home)' },
  { id: 'resume', label: 'RESUME', color: 'var(--c-resume)' },
  { id: 'projects', label: 'PROJECTS', color: 'var(--c-projects)' },
  { id: 'hire', label: 'HIRE ME', color: 'var(--c-hire)' },
]

const panels: Record<TabId, React.ComponentType<{ goTo: (t: TabId) => void }>> = {
  home: Home,
  resume: Resume,
  projects: Projects,
  hire: HireMe,
}

const STORAGE_KEY = 'anay-portfolio:last-tab'

function isTabId(value: string | null): value is TabId {
  return value === 'home' || value === 'resume' || value === 'projects' || value === 'hire'
}

export default function App() {
  const [active, setActive] = useState<TabId>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return isTabId(stored) ? stored : 'home'
    } catch {
      return 'home'
    }
  })
  const { playing, toggle } = useChiptune()
  const [paletteOpen, setPaletteOpen] = useState(false)
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    home: null,
    resume: null,
    projects: null,
    hire: null,
  })

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  const Panel = panels[active]
  const activeColor = tabs.find((t) => t.id === active)!.color

  const selectTab = (id: TabId, focus = false) => {
    withViewTransition(() => {
      setActive(id)
    })
    try {
      localStorage.setItem(STORAGE_KEY, id)
    } catch {
      /* localStorage unavailable (private mode, etc) — not fatal */
    }
    if (focus) tabRefs.current[id]?.focus()
  }

  // WAI-ARIA tabs pattern: arrow keys move focus + selection across the
  // tablist, Home/End jump to the ends, focus wraps around.
  // https://www.w3.org/WAI/ARIA/apg/patterns/tabs/
  const onTabKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length
    else if (e.key === 'Home') nextIndex = 0
    else if (e.key === 'End') nextIndex = tabs.length - 1

    if (nextIndex !== null) {
      e.preventDefault()
      selectTab(tabs[nextIndex].id, true)
    }
  }

  useEffect(() => {
    document.title = `${profile.name} · ${tabs.find((t) => t.id === active)!.label}`
  }, [active])

  return (
    <div className="min-h-screen flex items-center justify-center py-6 px-3 md:py-10 md:px-6" style={{ background: 'var(--desk)' }}>
      <div className="w-full max-w-4xl">
        {/* the monitor */}
        <div
          className="rounded-[28px] p-3 md:p-5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]"
          style={{ background: `linear-gradient(180deg, var(--bezel), var(--bezel-shadow))` }}
        >
          <div
            className="rounded-xl overflow-hidden flex flex-col border-[6px]"
            style={{ background: 'var(--screen-bg)', borderColor: 'var(--bezel-shadow)', minHeight: '76vh' }}
          >
            {/* tabs — real WAI-ARIA tablist: roles, aria-selected, aria-controls, roving tabindex, arrow-key nav */}
            <nav
              role="tablist"
              aria-label="Portfolio sections"
              className="flex overflow-x-auto shrink-0"
              style={{ background: 'var(--screen-bg-2)' }}
            >
              {tabs.map((t, i) => (
                <button
                  key={t.id}
                  ref={(el) => {
                    tabRefs.current[t.id] = el
                  }}
                  role="tab"
                  id={`tab-${t.id}`}
                  aria-selected={active === t.id}
                  aria-controls={`panel-${t.id}`}
                  tabIndex={active === t.id ? 0 : -1}
                  onClick={() => selectTab(t.id)}
                  onKeyDown={(e) => onTabKeyDown(e, i)}
                  className="flex items-center gap-2 px-4 md:px-6 py-3.5 text-sm md:text-base font-semibold whitespace-nowrap shrink-0 transition-colors"
                  style={{
                    background: active === t.id ? 'var(--screen-bg)' : 'transparent',
                    color: active === t.id ? 'var(--ink-bright)' : 'var(--ink-dim)',
                  }}
                >
                  <span className="w-2.5 h-2.5" style={{ background: t.color, opacity: active === t.id ? 1 : 0.45 }} />
                  {t.label}
                </button>
              ))}
            </nav>

            {/* content */}
            <div
              role="tabpanel"
              id={`panel-${active}`}
              aria-labelledby={`tab-${active}`}
              tabIndex={0}
              className="flex-1 overflow-y-auto screen-scroll p-5 md:p-10 outline-none"
              style={{ color: 'var(--ink)' }}
            >
              {/* Keyed on the active tab so a crash confined to one tab's
                  render resets when you navigate away and back, rather than
                  permanently wedging that tab for the rest of the session. */}
              <ErrorBoundary key={active}>
                <Panel goTo={selectTab} />
              </ErrorBoundary>
            </div>

            {/* status bar */}
            <div
              className="flex items-center justify-between px-4 md:px-6 py-2.5 text-[11px] md:text-xs shrink-0"
              style={{ background: 'var(--screen-bg-2)', borderTop: '1px solid var(--line)', color: 'var(--ink-dim)' }}
            >
              <button
                onClick={() => setPaletteOpen(true)}
                className="flex items-center gap-1.5 hover:text-[var(--ink-bright)] transition-colors"
                aria-label="Open command palette"
              >
                <kbd className="px-1.5 py-0.5 rounded border" style={{ borderColor: 'var(--line)' }}>⌘K</kbd>
                <span className="hidden sm:inline">COMMANDS</span>
              </button>
              <div className="hidden md:flex gap-4">
                <a href={profile.links.github} target="_blank" rel="noreferrer" className="hover:text-[var(--ink-bright)] transition-colors">GITHUB</a>
                <a href={profile.links.linkedin} target="_blank" rel="noreferrer" className="hover:text-[var(--ink-bright)] transition-colors">LINKEDIN</a>
                <a href={profile.links.devpost} target="_blank" rel="noreferrer" className="hover:text-[var(--ink-bright)] transition-colors">DEVPOST</a>
              </div>
            </div>
          </div>

          {/* the deck below the screen — wordmark, transport controls, power light */}
          <div className="flex items-center justify-between px-2 pt-3">
            <span className="font-bold text-sm md:text-base" style={{ color: 'var(--desk)' }}>
              anay<span style={{ color: activeColor }}>_64</span>
            </span>

            <button
              onClick={toggle}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs md:text-sm font-semibold"
              style={{ background: 'rgba(12,10,16,0.08)', color: 'var(--desk)' }}
              aria-pressed={playing}
              aria-label={playing ? 'Stop music' : 'Play music'}
            >
              <span>{playing ? '■' : '▶'}</span>
              {playing ? 'STOP' : 'PLAY'}
              {playing && (
                <span className="flex items-end gap-0.5 h-3 motion-reduce:hidden">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-0.5 bg-current"
                      style={{ height: '100%', animation: `eq-bar 0.5s ease-in-out ${i * 0.12}s infinite` }}
                    />
                  ))}
                </span>
              )}
            </button>

            <span className="flex items-center gap-1.5 text-xs md:text-sm font-semibold" style={{ color: 'var(--desk)' }}>
              POWER <span className="w-2 h-2 rounded-full pulse-dot" style={{ background: activeColor }} />
            </span>
          </div>
        </div>
      </div>

      <CommandPalette
        open={paletteOpen}
        onOpenChange={setPaletteOpen}
        goTo={selectTab}
        onDownload={downloadResume}
        onToggleMusic={toggle}
        musicPlaying={playing}
      />
    </div>
  )
}
