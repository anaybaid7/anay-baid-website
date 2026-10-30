import { useState } from 'react'
import { forecast, runPipeline, TASKS, type Row, type TaskId, type TaskRun } from './pipeline'
import { useSequence } from '../sim/useSequence'
import { Status, type State } from '../sim/Status'
import { Log } from '../sim/Log'

const CLEAN: Row[] = [
  { terminal: 412, week: 44, volume: 18240 },
  { terminal: 418, week: 44, volume: 15310 },
  { terminal: 431, week: 44, volume: 9875 },
  { terminal: 440, week: 44, volume: 6120 },
]
const BAD: Row = { terminal: 999, week: 44, volume: -40 }

interface Run {
  id: number
  tries: number
  tasks: TaskRun[]
}

const stateOf = (t: TaskRun | undefined, live: boolean): State =>
  live ? 'running' : !t ? 'queued' : t.state === 'success' ? 'success' : t.state === 'failed' ? 'failed' : 'skipped'

// The forecasting DAG in a grid like Airflow's: one row per task, one column
// per run. Click any square for that task's log. A failed run can be fixed and
// cleared from the failed task, the same run tries again, and reconcile
// updates rows instead of inserting them twice.
export default function PipelineRun() {
  const [bad, setBad] = useState(false)
  const [runs, setRuns] = useState<Run[]>([])
  const [shown, setShown] = useState<number>(TASKS.length)
  const [state, setState] = useState(new Map<string, number>())
  const [pick, setPick] = useState<{ run: number; task: TaskId } | null>(null)
  const seq = useSequence()

  const play = (run: Run, from = 0) => {
    setPick({ run: run.id, task: TASKS[from] })
    setShown(from)
    seq.run(
      TASKS.slice(from).map((task, i) => () => {
        setShown(from + i + 1)
        setPick({ run: run.id, task })
      }),
      700,
    )
  }

  const trigger = () => {
    const rows = bad ? [...CLEAN, BAD] : CLEAN
    const res = runPipeline(rows, state)
    const run = { id: (runs.at(-1)?.id ?? 0) + 1, tries: 1, tasks: res.runs }
    setRuns([...runs, run].slice(-6))
    setState(res.state)
    play(run)
  }

  // fix the data, clear validate, rerun the same DAG run from there
  const clear = () => {
    const last = runs.at(-1)!
    setBad(false)
    const res = runPipeline(CLEAN, state, 'validate')
    const run = { ...last, tries: last.tries + 1, tasks: res.runs }
    setRuns([...runs.slice(0, -1), run])
    setState(res.state)
    play(run, TASKS.indexOf('validate'))
  }

  const last = runs.at(-1)
  const failed = !seq.running && last?.tasks.some((t) => t.state === 'failed')
  const picked = pick && runs.find((r) => r.id === pick.run)?.tasks.find((t) => t.task === pick.task)
  const liveRun = seq.running ? last?.id : undefined
  const rows = state.size
  const ok = !seq.running && last?.tasks.every((t) => t.state === 'success')
  const strip = TASKS.map((_, ti) => {
    if (!last) return 'idle'
    const live = last.id === liveRun
    return stateOf(live && ti >= shown ? undefined : last.tasks[ti], live && ti === shown)
  })

  return (
    <div className="demo pipe">
      <p className="demo-hint">Add a bad record, run it, then fix it.</p>

      <div className="pipe-bar">
        <button type="button" className="demo-primary" onClick={trigger} disabled={seq.running}>
          Trigger a run
        </button>
        <label className="demo-check">
          <input type="checkbox" checked={bad} onChange={(e) => setBad(e.target.checked)} disabled={seq.running} />
          Add a bad record to the export
        </label>
        {failed && (
          <button type="button" onClick={clear}>
            Fix the record, clear validate
          </button>
        )}
      </div>

      <ol className="dag" aria-label="Latest run">
        {TASKS.map((task, i) => (
          <li key={task} className={`s-${strip[i]}`}>
            <Status state={strip[i] === 'queued' || !last ? 'idle' : strip[i]} />
            <code>{task}</code>
          </li>
        ))}
      </ol>

      <div className="pipe-main">
        <div className="pipe-grid" role="grid" aria-label="DAG runs">
          <div role="row" className="pipe-row head">
            <span role="columnheader">forecast_weekly</span>
            {runs.map((r) => (
              <span role="columnheader" key={r.id}>
                #{r.id}
                {r.tries > 1 && <small> try {r.tries}</small>}
              </span>
            ))}
          </div>
          {TASKS.map((task, ti) => (
            <div role="row" className="pipe-row" key={task}>
              <span role="rowheader">
                <code>{task}</code>
              </span>
              {runs.map((r) => {
                const isLive = r.id === liveRun
                const t = isLive && ti >= shown ? undefined : r.tasks[ti]
                const s = stateOf(t, isLive && ti === shown)
                const on = pick?.run === r.id && pick.task === task
                return (
                  <span role="gridcell" key={r.id}>
                    <button
                      type="button"
                      className={on ? 'on' : ''}
                      aria-label={`${task}, run ${r.id}`}
                      disabled={!t}
                      onClick={() => setPick({ run: r.id, task })}
                    >
                      <Status state={s} />
                    </button>
                  </span>
                )
              })}
            </div>
          ))}
          {!runs.length && <p className="pipe-empty">No runs yet</p>}
        </div>

        <div className="pipe-side">
          <Log
            title={picked ? `${picked.task} log, run ${pick!.run}` : 'Task log'}
            lines={
              picked
                ? picked.log.map((text) => ({
                    src: picked.task,
                    text,
                    tone: picked.state === 'failed' ? 'err' : picked.state === 'success' ? undefined : 'warn',
                  }))
                : []
            }
            empty="Pick a square in the grid"
          />
          <dl className="pipe-facts">
            <div>
              <dt>forecast_state</dt>
              <dd>
                {rows} {rows === 1 ? 'row' : 'rows'}
              </dd>
            </div>
            <div>
              <dt>Last run</dt>
              <dd>
                {!last ? 'none' : seq.running ? 'running' : last.tasks.every((t) => t.state === 'success') ? 'success' : 'failed'}
              </dd>
            </div>
          </dl>
          {ok && (
            <div className="flow-payload">
              <p>GET /api/forecast?week=45</p>
              <pre>
                {`[\n${CLEAN.map((r) => `  { "terminal": ${r.terminal}, "week": ${r.week + 1}, "volume": ${forecast(r, 1)} }`).join(',\n')}\n]`}
              </pre>
            </div>
          )}
        </div>
      </div>

      <p className="demo-legend">
        <Status state="success" /> success <Status state="failed" /> failed <Status state="skipped" /> upstream failed{' '}
        <Status state="running" /> running
      </p>
    </div>
  )
}
