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
  width: ['normal', 'narrow', 'wide'],
  contrast: ['standard', 'high'],
  lead: ['experience', 'projects'],
} as const

// sections a visitor can switch off. Experience and projects always stay.
export const HIDEABLE = ['thread', 'glance', 'education', 'skills', 'github', 'colophon'] as const
export type Hideable = (typeof HIDEABLE)[number]

type Choices = { [K in keyof typeof OPTIONS]: (typeof OPTIONS)[K][number] }
export type Settings = Choices & { hide: Hideable[] }

export const DEFAULTS: Settings = {
  theme: 'system',
  view: 'full',
  size: 'm',
  accent: 'blue',
  motion: 'full',
  width: 'normal',
  contrast: 'standard',
  lead: 'experience',
  hide: [],
}

// ready-made combinations for the two most common visits
export const PRESETS: { name: string; settings: Partial<Settings> }[] = [
  { name: 'Quick scan', settings: { view: 'skim', lead: 'projects', hide: ['github', 'colophon'] } },
  { name: 'Everything', settings: { view: 'full', lead: 'experience', hide: [] } },
]

const KEY = 'prefs'

const valid = <K extends keyof Choices>(key: K, value: unknown): value is Choices[K] =>
  (OPTIONS[key] as readonly unknown[]).includes(value)

function pickHide(value: unknown): Hideable[] | undefined {
  const list = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : null
  if (!list) return undefined
  return HIDEABLE.filter((h) => list.includes(h))
}

function pick(source: Record<string, unknown>): Partial<Settings> {
  const out: Partial<Settings> = {}
  for (const key of Object.keys(OPTIONS) as (keyof Choices)[]) {
    if (valid(key, source[key])) (out as Record<string, unknown>)[key] = source[key]
  }
  const hide = pickHide(source.hide)
  if (hide) out.hide = hide
  return out
}

export const sameSettings = (a: Settings, b: Settings) =>
  (Object.keys(OPTIONS) as (keyof Choices)[]).every((k) => a[k] === b[k]) && a.hide.join() === b.hide.join()

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
  root.width = s.width
  root.contrast = s.contrast
  root.lead = s.lead
  root.hide = s.hide.join(' ')
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
  const run = ['theme', 'view', 'lead', 'hide', 'width'].some((k) => k in patch) ? withTransition : (fn: () => void) => fn()
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
    // the prerendered HTML is built with the defaults, so hydrate against them
    () => DEFAULTS,
  )
}

// a link to this page that opens with the current settings
export function linkWithSettings(s: Settings = state) {
  const params = new URLSearchParams()
  for (const key of Object.keys(OPTIONS) as (keyof Choices)[]) {
    if (s[key] !== DEFAULTS[key]) params.set(key, s[key])
  }
  if (s.hide.length) params.set('hide', s.hide.join(','))
  const q = params.toString()
  return `${location.origin}${location.pathname}${q ? `?${q}` : ''}`
}

// for tests
export function __resetForTests() {
  state = load()
  apply(state)
  listeners.forEach((l) => l())
}
