// How content.js finds its moment on a StarRez profile, replayed in
// milliseconds. The numbers are its CONFIG: a 500 ms debounce on every DOM
// change, 300 ms before initialize runs, up to 20 retries every 500 ms
// while EntryID is missing, and a 20 s watch for the KEYS heading.

export const OBSERVER_DEBOUNCE = 500
export const INIT_DEBOUNCE = 300
export const RETRY = 500
export const MAX_ATTEMPTS = 20
export const KEYS_TIMEOUT = 20000

type Part = 'crumb' | 'entry' | 'keys'
export type Button = 'Copy Log' | 'Print Label' | 'Copy Lockout'

export interface Trace {
  dom: { t: number; part?: Part }[]
  debounce: { from: number; to: number; fired: boolean }[]
  init: { t: number; retry: number }[]
  watch: { from: number; to: number; end: 'found' | 'timeout' | 'restart' }[]
  buttons: { name: Button; t: number }[]
  end: number
}

type Job = { t: number; seq: number; run: () => void }

// the page: the breadcrumb first, EntryID with the main panel, and the
// Rez 360 sidebar whenever it finishes loading, each with a burst of DOM churn
export function page(entryAt: number, keysAt: number): { t: number; part?: Part }[] {
  const burst = (t: number) => [t + 40, t + 90, t + 160]
  return [
    { t: 0, part: 'crumb' },
    ...burst(0).map((t) => ({ t })),
    { t: entryAt, part: 'entry' },
    ...burst(entryAt).map((t) => ({ t })),
    { t: keysAt, part: 'keys' },
    ...burst(keysAt).map((t) => ({ t })),
  ]
}

export function simulate(entryAt: number, keysAt: number): Trace {
  const tr: Trace = { dom: [], debounce: [], init: [], watch: [], buttons: [], end: 0 }
  const has = new Set<Part>()
  const made = new Set<Button>()
  const q: Job[] = []
  let seq = 0
  let now = 0
  const at = (t: number, run: () => void) => q.push({ t, seq: seq++, run })

  let obs: { from: number; id: number } | null = null
  let initId = 0
  let attempts = 0
  let watch: { from: number; id: number } | null = null

  const mutate = (part?: Part) => {
    tr.dom.push({ t: now, part })
    if (part) has.add(part)
    // the KEYS watcher sees the same mutation
    if (watch && has.has('keys')) {
      tr.watch.push({ from: watch.from, to: now, end: 'found' })
      watch = null
      inject('Copy Lockout')
    }
    if (obs) tr.debounce.push({ from: obs.from, to: now, fired: false })
    const id = seq
    obs = { from: now, id }
    at(now + OBSERVER_DEBOUNCE, () => {
      if (obs?.id !== id) return
      tr.debounce.push({ from: obs.from, to: now, fired: true })
      obs = null
      initialize()
    })
  }

  const inject = (b: Button) => {
    if (made.has(b)) return
    made.add(b)
    tr.buttons.push({ name: b, t: now })
    mutate()
  }

  const initialize = () => {
    const id = ++initId
    at(now + INIT_DEBOUNCE, () => {
      if (id !== initId) return
      if (!has.has('entry') && attempts < MAX_ATTEMPTS) {
        tr.init.push({ t: now, retry: ++attempts })
        at(now + RETRY, initialize)
        return
      }
      attempts = 0
      tr.init.push({ t: now, retry: 0 })
      build()
    })
  }

  const build = () => {
    if (has.has('entry')) {
      inject('Copy Log')
      inject('Print Label')
    }
    if (made.has('Copy Lockout') || !has.has('crumb')) return
    if (has.has('keys')) return inject('Copy Lockout')
    // every call starts a fresh watch with a fresh 20 s timeout
    if (watch) tr.watch.push({ from: watch.from, to: now, end: 'restart' })
    const id = seq
    watch = { from: now, id }
    at(now + KEYS_TIMEOUT, () => {
      if (watch?.id !== id) return
      tr.watch.push({ from: watch.from, to: now, end: 'timeout' })
      watch = null
    })
  }

  for (const d of page(entryAt, keysAt)) at(d.t, () => mutate(d.part))
  at(0, initialize)

  while (q.length) {
    q.sort((a, b) => a.t - b.t || a.seq - b.seq)
    const job = q.shift()!
    now = job.t
    job.run()
  }
  // stop the chart at the last thing that mattered, not the last dead timer
  tr.end = Math.max(...tr.dom.map((d) => d.t), ...tr.buttons.map((b) => b.t), ...tr.watch.map((w) => w.to)) + 600
  return tr
}
