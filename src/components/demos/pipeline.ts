// The weekly forecast DAG, run in the browser on a handful of rows. Each task
// returns its own log, a failure stops everything downstream, and reconcile
// uses MERGE semantics so a rerun updates rows instead of adding them twice.

export interface Row {
  terminal: number
  week: number
  volume: number
}

export const TASKS = ['extract', 'validate', 'reconcile', 'write_parquet', 'infer', 'publish'] as const
export type TaskId = (typeof TASKS)[number]
export type TaskState = 'success' | 'failed' | 'upstream_failed'

export interface TaskRun {
  task: TaskId
  state: TaskState
  log: string[]
}

export const TERMINALS = [412, 418, 431, 440]

export function check(r: Row): string | null {
  if (!TERMINALS.includes(r.terminal)) return `unknown terminal ${r.terminal}`
  if (r.week < 1 || r.week > 53) return `fiscal week ${r.week} is out of range`
  if (r.volume < 0) return `negative volume ${r.volume} at terminal ${r.terminal}`
  return null
}

// update rows that exist, insert the ones that don't
export function merge(state: Map<string, number>, rows: Row[]) {
  const next = new Map(state)
  let inserted = 0
  let updated = 0
  for (const r of rows) {
    const key = `${r.terminal}:${r.week}`
    if (next.has(key)) updated++
    else inserted++
    next.set(key, r.volume)
  }
  return { next, inserted, updated }
}

// stand-in for the model: recent volume plus a small weekly trend
export const forecast = (r: Row, ahead: number) => Math.round(r.volume * (1 + 0.02 * ahead))

export function runPipeline(rows: Row[], state: Map<string, number>, from: TaskId = 'extract') {
  const runs: TaskRun[] = []
  let next = state
  let stopped = false
  const start = TASKS.indexOf(from)

  const step = (task: TaskId, work: () => string[] | null) => {
    if (TASKS.indexOf(task) < start) return runs.push({ task, state: 'success', log: ['kept from the previous try'] })
    if (stopped) return runs.push({ task, state: 'upstream_failed', log: ['skipped, an upstream task failed'] })
    const log = work()
    if (log === null) return
    runs.push({ task, state: 'success', log })
  }

  step('extract', () => [`read ${rows.length} rows from forecast_export_w44.csv`])

  step('validate', () => {
    const errors = rows.map((r, i) => [i, check(r)] as const).filter(([, e]) => e)
    if (!errors.length) return [`all ${rows.length} rows passed`]
    stopped = true
    runs.push({
      task: 'validate',
      state: 'failed',
      log: [...errors.map(([i, e]) => `row ${i + 1}: ${e}`), `${errors.length} of ${rows.length} rows failed, stopping the run`],
    })
    return null
  })

  step('reconcile', () => {
    const m = merge(next, rows)
    next = m.next
    return [`MERGE INTO forecast_state`, `${m.inserted} inserted, ${m.updated} updated, ${next.size} rows in total`]
  })

  step('write_parquet', () => [`s3://forecasting/curated/year=2026/week=44/part-0000.parquet`, `${rows.length} rows, partitioned by year and week`])

  step('infer', () => [
    'POST /endpoints/forecast-weekly/invocations  200',
    ...rows.map((r) => `terminal ${r.terminal}  week ${r.week + 1}  ${forecast(r, 1).toLocaleString('en-CA')}`),
  ])

  step('publish', () => [`GET /api/forecast?week=45  200`, `${rows.length} forecasts served to the planning tools`])

  return { runs, state: next, ok: !stopped }
}
