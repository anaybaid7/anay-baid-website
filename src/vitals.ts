// Core Web Vitals for this visit, measured with the browser's own
// PerformanceObserver entries. Nothing is sent anywhere, the numbers only
// show in the colophon.
//   LCP  the last largest-contentful-paint candidate, frozen at first input
//   CLS  the worst session window of layout shifts, a window closing after
//        a 1s gap or 5s total, shifts right after input left out
//   INP  the slowest interaction, entries grouped by interactionId; past
//        50 interactions the worst one per 50 is dropped

export interface Vitals {
  lcp: number | null // ms
  cls: number | null
  inp: number | null // ms
  interactions: number
  // the browser only reports interactions slower than 16ms, so a fast page
  // can be clicked and still have nothing to report
  interacted: boolean
}

type Listener = (v: Vitals) => void

const state: Vitals = { lcp: null, cls: null, inp: null, interactions: 0, interacted: false }
const listeners = new Set<Listener>()
const emit = () => listeners.forEach((l) => l({ ...state }))
let started = false

function observe(type: string, cb: (entries: PerformanceEntry[]) => void, extra: Record<string, unknown> = {}) {
  try {
    if (!PerformanceObserver.supportedEntryTypes?.includes(type)) return false
    new PerformanceObserver((list) => cb(list.getEntries())).observe({ type, buffered: true, ...extra })
    return true
  } catch {
    return false
  }
}

function start() {
  if (started || typeof PerformanceObserver !== 'function') return
  started = true

  let lcpFinal = false
  const freeze = () => {
    lcpFinal = true
    if (!state.interacted) {
      state.interacted = true
      emit()
    }
  }
  addEventListener('pointerdown', freeze, { capture: true })
  addEventListener('keydown', freeze, { capture: true })
  observe('largest-contentful-paint', (es) => {
    if (lcpFinal) return
    state.lcp = es[es.length - 1].startTime
    emit()
  })

  let win = 0
  let first = 0
  let prev = 0
  if (
    observe('layout-shift', (es) => {
      for (const e of es as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (e.hadRecentInput) continue
        if (win && e.startTime - prev < 1000 && e.startTime - first < 5000) win += e.value
        else {
          win = e.value
          first = e.startTime
        }
        prev = e.startTime
        state.cls = Math.max(state.cls ?? 0, win)
      }
      emit()
    })
  )
    state.cls ??= 0

  const worst = new Map<number, number>()
  if (
    observe(
      'event',
      (es) => {
        for (const e of es as (PerformanceEntry & { interactionId?: number })[]) {
          if (!e.interactionId) continue
          worst.set(e.interactionId, Math.max(worst.get(e.interactionId) ?? 0, e.duration))
        }
        const all = [...worst.values()].sort((a, b) => b - a)
        state.interactions = all.length
        state.inp = all.length ? all[Math.min(all.length - 1, Math.floor(all.length / 50))] : null
        emit()
      },
      { durationThreshold: 16 },
    )
  )
    emit()
}

export function watchVitals(l: Listener) {
  start()
  listeners.add(l)
  l({ ...state })
  return () => {
    listeners.delete(l)
  }
}

// Google's good and poor lines for each metric
export const LIMITS = { lcp: [2500, 4000], cls: [0.1, 0.25], inp: [200, 500] } as const
export const grade = (k: keyof typeof LIMITS, v: number) => (v <= LIMITS[k][0] ? 'good' : v <= LIMITS[k][1] ? 'needs work' : 'poor')
