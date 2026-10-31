import { useState, type KeyboardEvent } from 'react'
import { Status, type State } from '../sim/Status'
import { useSequence } from '../sim/useSequence'
import { ENVS, jobs, order, outcome, type Env } from './graph'

const W = 162
const H = 36
const POS: Record<string, [number, number]> = {
  trigger: [20, 102],
  build: [214, 102],
  test: [400, 102],
  dev: [586, 40],
  staging: [586, 102],
  production: [586, 164],
}

// Push to main and watch both workflows. Click any job for its steps.
export default function Graph() {
  const [env, setEnv] = useState<Env>('staging')
  const [token, setToken] = useState(true)
  const [state, setState] = useState<Record<string, State>>({})
  const [open, setOpen] = useState('trigger')
  const seq = useSequence()
  const list = jobs(env, token)
  const job = list.find((j) => j.id === open)!

  const push = () => {
    const end = outcome(env, token)
    setState(Object.fromEntries(order.map((id) => [id, id === 'trigger' ? 'queued' : 'idle'])))
    seq.run(
      order.flatMap((id) => [
        () => end[id] !== 'idle' && setState((s) => ({ ...s, [id]: end[id] === 'skipped' ? 'skipped' : 'running' })),
        () => setState((s) => ({ ...s, [id]: end[id] })),
      ]),
      380,
    )
  }
  const key = (id: string) => (e: KeyboardEvent) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setOpen(id))
  const st = (id: string) => state[id] ?? 'idle'
  const ran = !seq.running && st('trigger') === 'success'

  return (
    <div className="demo graph">
      <div className="demo-actions">
        <label className="demo-inline">
          ENVIRONMENT_NAME
          <select value={env} onChange={(e) => setEnv(e.target.value as Env)} disabled={seq.running}>
            {ENVS.map((e) => <option key={e}>{e}</option>)}
          </select>
        </label>
        <label className="demo-inline">
          <input type="checkbox" checked={token} onChange={(e) => setToken(e.target.checked)} disabled={seq.running} />
          Token valid
        </label>
        <button type="button" className="demo-primary" onClick={push} disabled={seq.running}>git push origin main</button>
      </div>

      <svg className="jobs" viewBox="0 0 760 220" role="group" aria-label="Workflow graph">
        <rect className="repo" x={8} y={14} width={186} height={196} />
        <text className="zone" x={16} y={32}>this repo, on push</text>
        <rect className="repo" x={202} y={14} width={554} height={196} />
        <text className="zone" x={210} y={32}>target repo, on repository_dispatch</text>
        {list.flatMap((j) =>
          j.needs.map((n) => {
            const [x1, y1] = POS[n]
            const [x2, y2] = POS[j.id]
            const mx = (x1 + W + x2) / 2
            return (
              <path
                key={n + j.id}
                className={`wire ${n === 'trigger' ? 'cross' : ''} ${st(j.id) === 'success' || st(j.id) === 'running' ? 'lit' : ''}`}
                d={`M${x1 + W},${y1 + H / 2} C${mx},${y1 + H / 2} ${mx},${y2 + H / 2} ${x2},${y2 + H / 2}`}
              />
            )
          }),
        )}
        {list.map((j) => {
          const [x, y] = POS[j.id]
          return (
            <g
              key={j.id}
              className={`job ${open === j.id ? 'open' : ''} s-${st(j.id)}`}
              transform={`translate(${x} ${y})`}
              role="button"
              tabIndex={0}
              aria-label={`${j.name}, ${st(j.id)}`}
              aria-pressed={open === j.id}
              onClick={() => setOpen(j.id)}
              onKeyDown={key(j.id)}
            >
              <rect width={W} height={H} />
              <rect className="dot" x={10} y={H / 2 - 5} width={10} height={10} />
              <text x={28} y={H / 2 + 5}>{j.name}</text>
            </g>
          )
        })}
      </svg>

      <div className="job-steps">
        <p className="job-name">{job.name}</p>
        <ol>
          {job.steps.map((s) => (
            <li key={s.name}>
              <Status state={st(job.id) === 'success' ? 'success' : st(job.id)} />
              <b>{s.name}</b>
              {st(job.id) !== 'idle' && st(job.id) !== 'queued' && <code>{s.log}</code>}
            </li>
          ))}
        </ol>
      </div>
      {ran && !token && <p className="graph-note">The action is green and the email went out, but nothing was built.</p>}
    </div>
  )
}
