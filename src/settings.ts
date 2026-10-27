import { useSyncExternalStore } from 'react'
import { flushSync } from 'react-dom'

// Everything a visitor can change about how the page looks. Saved in
// localStorage, and any of it can be set from the URL too, so a link like
// /?view=skim&size=l opens the page that way for whoever clicks it.

export const OPTIONS = {
  theme: ['system', 'light', 'dark'],
  view: ['full', 'skim'],
  size: ['s', 'm', 'l'],
  accent: ['blue', 'green', 'red', 'ink'],
  motion: ['full', 'reduced'],
} as const

export type Settings = { [K in keyof typeof OPTIONS]: (typeof OPTIONS)[K][number] }

export const DEFAULTS: Settings = { theme: 'system', view: 'full', size: 'm', accent: 'blue', motion: 'full' }

const KEY = 'prefs'

const valid = <K extends keyof Settings>(key: K, value: unknown): value is Settings[K] =>
  (OPTIONS[key] as readonly unknown[]).includes(value)

function pick(source: Record<string, unknown>): Partial<Settings> {
  const out: Partial<Settings> = {}
  for (const key of Object.keys(OPTIONS) as (keyof Settings)[]) {
    if (valid(key, source[key])) (out as Record<string, unknown>)[key] = source[key]
  }
  return out
}

function load(): Settings {
  let saved: Record<string, unknown> = {}
  try {
    saved = JSON.parse(localStorage.getItem(KEY) ?? '{}')
    // the old theme switch saved only this
    const old = localStorage.getItem('theme')
    if (!saved.theme && (old === 'light' || old === 'dark')) saved.theme = old
  } catch {
    // private browsing or a broken value, start from the defaults
  }
  const fromUrl = typeof location === 'undefined' ? {} : Object.fromEntries(new URLSearchParams(location.search))
  return { ...DEFAULTS, ...pick(saved), ...pick(fromUrl) }
}

const prefersDark = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
const prefersCalm = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches

export const resolvedTheme = (s: Settings) => (s.theme === 'system' ? (prefersDark() ? 'dark' : 'light') : s.theme)
export const calm = (s: Settings) => s.motion === 'reduced' || prefersCalm()

function apply(s: Settings) {
  const root = document.documentElement.dataset
  root.theme = resolvedTheme(s)
  root.view = s.view
  root.size = s.size
  root.accent = s.accent
  root.motion = calm(s) ? 'reduced' : 'full'
}

let state = load()
const listeners = new Set<() => void>()

if (typeof document !== 'undefined') apply(state)
if (typeof matchMedia === 'function') {
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => state.theme === 'system' && apply(state))
}

// run a DOM change inside a view transition where the browser has them, so
// switching theme, view or filter crossfades instead of jumping
export function withTransition(change: () => void) {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!doc.startViewTransition || calm(state)) {
    change()
    return
  }
  doc.startViewTransition(() => flushSync(change))
}

export function setSettings(patch: Partial<Settings>) {
  // only theme and layout changes are worth a crossfade, the rest apply instantly
  const run = 'theme' in patch || 'view' in patch ? withTransition : (fn: () => void) => fn()
  run(() => {
    state = { ...state, ...patch }
    apply(state)
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      localStorage.removeItem('theme')
    } catch {
      // the change still applies, it just won't be remembered
    }
    listeners.forEach((l) => l())
  })
}

export const resetSettings = () => setSettings(DEFAULTS)

export function useSettings() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
    () => state,
  )
}

// a link to this page that opens with the current settings
export function linkWithSettings(s: Settings = state) {
  const params = new URLSearchParams()
  for (const key of Object.keys(OPTIONS) as (keyof Settings)[]) {
    if (s[key] !== DEFAULTS[key]) params.set(key, s[key])
  }
  const q = params.toString()
  return `${location.origin}${location.pathname}${q ? `?${q}` : ''}`
}

// for tests
export function __resetForTests() {
  state = load()
  apply(state)
  listeners.forEach((l) => l())
}
