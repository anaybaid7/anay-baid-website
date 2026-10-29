import { useState } from 'react'
import { compareSchemas, type Column, type Issue } from './compareSchemas'
import { useSequence } from '../sim/useSequence'

const AZURE: Column[] = [
  ['show_id', 'BIGINT'],
  ['theatre_id', 'INT'],
  ['screen_id', 'INT'],
  ['show_date', 'DATE'],
  ['tickets_sold', 'INT'],
  ['gross', 'DECIMAL(12,2)'],
]
const START: Column[] = [
  ['show_id', 'BIGINT'],
  ['theatre_id', 'INT'],
  ['show_date', 'VARCHAR(10)'],
  ['tickets_sold', 'INT'],
  ['gross', 'DECIMAL(10,2)'],
]
const ROWS = 1204331

// Reconciling the same table in two places. Run the check, apply each fix as
// SQL against the on-prem copy, and run it again until both sides agree.
export default function Reconcile() {
  const [onprem, setOnprem] = useState(START)
  const [rows, setRows] = useState(ROWS - 13)
  const [checked, setChecked] = useState(-1)
  const [found, setFound] = useState<Issue[] | null>(null)
  const [applied, setApplied] = useState<string[]>([])
  const [dirty, setDirty] = useState(false)
  const seq = useSequence()

  const run = () => {
    setFound(null)
    setDirty(false)
    setChecked(0)
    seq.run(
      [...AZURE.map((_, i) => () => setChecked(i + 1)), () => setFound(compareSchemas(AZURE, onprem, ROWS, rows))],
      260,
    )
  }

  const apply = (f: Issue) => {
    if (!f.column) setRows(ROWS)
    else {
      const type = AZURE.find(([n]) => n === f.column)![1]
      const has = onprem.some(([n]) => n === f.column)
      setOnprem(has ? onprem.map(([n, t]) => [n, n === f.column ? type : t]) : [...onprem, [f.column, type]])
    }
    setApplied([...applied, f.fix])
    setDirty(true)
    setFound(found!.filter((x) => x !== f))
  }

  const reset = () => {
    seq.stop()
    setOnprem(START)
    setRows(ROWS - 13)
    setChecked(-1)
    setFound(null)
    setApplied([])
    setDirty(false)
  }

  const bad = new Set(compareSchemas(AZURE, onprem, ROWS, rows).map((f) => f.column))
  const table = (title: string, cols: Column[], n: number) => (
    <div className="schema">
      <p className="schema-title">{title}</p>
      <ul>
        {cols.map(([name, t]) => {
          const i = AZURE.findIndex(([a]) => a === name)
          const seen = i >= 0 && i < checked
          return (
            <li key={name} className={[seen ? 'seen' : '', seen && bad.has(name) ? 'bad' : ''].join(' ')}>
              <code>{name}</code> <span>{t}</span>
            </li>
          )
        })}
      </ul>
      <p className={`schema-rows ${checked >= AZURE.length && bad.has('') ? 'bad' : ''}`}>{n.toLocaleString('en-CA')} rows</p>
    </div>
  )

  const clean = found !== null && found.length === 0 && !dirty

  return (
    <div className="demo schema-demo">
      <p className="demo-lede">
        The same table in Azure and on-prem. Run the check, apply each fix, then run it again until both sides match.
      </p>
      <div className="schema-pair">
        {table('Azure, box_office', AZURE, ROWS)}
        {table('On-prem, box_office', onprem, rows)}
      </div>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={run} disabled={seq.running}>
          {checked < 0 ? 'Run the check' : 'Run it again'}
        </button>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      {found && found.length > 0 && (
        <ul className="findings" aria-live="polite">
          {found.map((f) => (
            <li key={f.problem}>
              <span>{f.problem}</span>
              <pre>{f.fix}</pre>
              <button type="button" onClick={() => apply(f)}>Apply fix</button>
            </li>
          ))}
        </ul>
      )}
      {found && found.length === 0 && dirty && <p className="demo-out">Fixes applied. Run the check again to confirm.</p>}
      {clean && <p className="demo-out ok">Both copies match. The showtime models can train on this table.</p>}
      {applied.length > 0 && (
        <details className="applied">
          <summary>{applied.length} {applied.length === 1 ? 'statement' : 'statements'} applied on-prem</summary>
          <pre>{applied.join('\n\n')}</pre>
        </details>
      )}
      <p className="demo-note">Made-up table, just to show the idea.</p>
    </div>
  )
}
