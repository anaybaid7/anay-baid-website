// The forecast tool's planning math, ported from the Forecast GUI Tool.
// Weekly edits keep Total = PCL + Agent, a week is split into days by
// weekday shares that must add to 100%, and the gap check flags days that
// are far from their recent trend.

export interface Week {
  week: number
  pcl: number
  agent: number
  // the forecast as it came from the model, before anyone edited it
  origPcl: number
  origAgent: number
}

export const total = (w: Week) => w.pcl + w.agent

// From ratio_split.js. Editing Total scales PCL and Agent by the same ratio,
// so the split the forecast already has is kept and the parts always add
// back to the new total. With nothing to scale, the change is split 50/50.
export function editTotal(w: Week, next: number, fromOriginal = false): Week {
  const a = fromOriginal ? w.origPcl : w.pcl
  const b = fromOriginal ? w.origAgent : w.agent
  const old = a + b
  if (old) return { ...w, pcl: (a * next) / old, agent: (b * next) / old }
  return { ...w, pcl: a + (next - old) / 2, agent: b + (next - old) / 2 }
}

// From applyOp in app.js. Operations run one after another on the current
// value, so Set to 500 then Add 500 gives 1,000. Each week keeps a stack of
// its previous values, so Revert steps back one operation at a time.
export type Op = '%+' | '%-' | '=' | '+'
export const OPS: Record<Op, string> = { '%+': '% Increase', '%-': '% Decrease', '=': 'Set to', '+': 'Add' }

export function applyOp(current: number, op: Op, val: number) {
  const next = op === '%+' ? current * (1 + val / 100) : op === '%-' ? current * (1 - val / 100) : op === '=' ? val : current + val
  return Math.round(next * 10) / 10
}

export interface Change {
  week: number
  op: string
  val: number
  before: number
  after: number
}

export function runOp(weeks: Week[], stacks: Record<number, number[]>, pick: number[], op: Op, val: number) {
  const nextStacks = { ...stacks }
  const log: Change[] = []
  const next = weeks.map((w) => {
    if (!pick.includes(w.week)) return w
    const before = total(w)
    const after = applyOp(before, op, val)
    nextStacks[w.week] = [...(stacks[w.week] ?? []), before]
    log.push({ week: w.week, op: OPS[op], val, before, after })
    return editTotal(w, after)
  })
  return { weeks: next, stacks: nextStacks, log }
}

// pop one step off each selected week's stack
export function revert(weeks: Week[], stacks: Record<number, number[]>, pick: number[]) {
  const nextStacks = { ...stacks }
  const next = weeks.map((w) => {
    const stack = stacks[w.week]
    if (!pick.includes(w.week) || !stack?.length) return w
    nextStacks[w.week] = stack.slice(0, -1)
    return editTotal(w, stack[stack.length - 1])
  })
  return { weeks: next, stacks: nextStacks }
}

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// From daily.html. Round each share to two decimals and give the last day
// whatever is left, so the week is exactly 100.00%.
export function normalize(shares: number[]): number[] {
  const sum = shares.reduce((a, b) => a + b, 0)
  if (sum <= 0) return shares
  let running = 0
  return shares.map((s, i) => {
    if (i === shares.length - 1) return Math.round((100 - running) * 100) / 100
    const n = Math.round((s / sum) * 10000) / 100
    running += n
    return n
  })
}

export const sumsTo100 = (shares: number[]) => Math.abs(shares.reduce((a, b) => a + b, 0) - 100) < 0.1

// Whole pieces per day. The rounding remainder goes to the busiest day, so
// the days always add back to the weekly number (volume conservation).
export function splitWeek(weekly: number, shares: number[]) {
  const raw = shares.map((s) => (weekly * s) / 100)
  const days = raw.map(Math.floor)
  const busiest = raw.indexOf(Math.max(...raw))
  days[busiest] += Math.round(weekly) - days.reduce((a, b) => a + b, 0)
  return days
}

export interface DayCheck {
  terminal: number
  day: string
  forecast: number
  history: { value: number; holiday?: string }[]
}

// From forecast_gap_check.py. The baseline is the same weekday over the last
// four weeks, with holidays left out, and a day is flagged only if it is off
// by at least 50% and by at least 100 pieces.
export function gapCheck(d: DayCheck, excludeHolidays = true) {
  const used = d.history.filter((h) => !(excludeHolidays && h.holiday))
  const baseline = used.reduce((a, h) => a + h.value, 0) / used.length
  const diff = d.forecast - baseline
  const pct = baseline ? (diff / baseline) * 100 : Infinity
  return { baseline, diff, pct, check: Math.abs(pct) >= 50 && Math.abs(diff) >= 100 }
}
