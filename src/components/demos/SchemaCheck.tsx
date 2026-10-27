import { useEffect, useRef, useState } from 'react'
import { compareSchemas, type Column } from './compareSchemas'

const AZURE: Column[] = [
  ['show_id', 'BIGINT'],
  ['theatre_id', 'INT'],
  ['screen_id', 'INT'],
  ['show_date', 'DATE'],
  ['tickets_sold', 'INT'],
  ['gross', 'DECIMAL(12,2)'],
]
const ONPREM: Column[] = [
  ['show_id', 'BIGINT'],
  ['theatre_id', 'INT'],
  ['show_date', 'VARCHAR(10)'],
  ['tickets_sold', 'INT'],
  ['gross', 'DECIMAL(10,2)'],
]
const ROWS = { azure: 1204331, onprem: 1204318 }

type Finding = { col: string; text: string }

const compare = (): Finding[] =>
  compareSchemas(AZURE, ONPREM, ROWS.azure, ROWS.onprem).map((x) => ({ col: x.column, text: x.problem }))

// What the validation work at Cineplex did, on a made-up table: compare the
// two schemas column by column, then the row counts, and list what doesn't match.
export default function SchemaCheck() {
  const [checked, setChecked] = useState(-1)
  const timer = useRef<number | undefined>(undefined)
  const findings = compare()
  const done = checked >= AZURE.length
  const shown = done ? findings : findings.filter((f) => AZURE.findIndex(([n]) => n === f.col) < checked && f.col)

  useEffect(() => () => window.clearInterval(timer.current), [])

  const run = () => {
    window.clearInterval(timer.current)
    if (document.documentElement.dataset.motion === 'reduced') return setChecked(AZURE.length)
    setChecked(0)
    timer.current = window.setInterval(() => {
      setChecked((c) => {
        if (c >= AZURE.length) {
          window.clearInterval(timer.current)
          return c
        }
        return c + 1
      })
    }, 380)
  }

  const bad = new Set(findings.map((f) => f.col))
  const table = (title: string, cols: Column[], rows: number) => (
    <div className="schema">
      <p className="schema-title">{title}</p>
      <ul>
        {cols.map(([n, t]) => {
          const i = AZURE.findIndex(([a]) => a === n)
          const seen = i >= 0 && i < checked
          return (
            <li key={n} className={[seen ? 'seen' : '', seen && bad.has(n) ? 'bad' : ''].join(' ')}>
              <code>{n}</code> <span>{t}</span>
            </li>
          )
        })}
      </ul>
      <p className="schema-rows">{rows.toLocaleString('en-CA')} rows</p>
    </div>
  )

  return (
    <div className="demo schema-demo">
      <p className="demo-lede">Reconciling the same table in two places, column by column, then row counts.</p>
      <div className="schema-pair">
        {table('Azure, box_office', AZURE, ROWS.azure)}
        {table('On-prem, box_office', ONPREM, ROWS.onprem)}
      </div>
      <p className="demo-actions">
        <button type="button" className="demo-primary" onClick={run}>
          {checked < 0 ? 'Run the check' : 'Run it again'}
        </button>
      </p>
      {checked >= 0 && (
        <ul className="findings" aria-live="polite">
          {shown.map((f) => (
            <li key={f.text}>{f.text}</li>
          ))}
          {done && <li className="sum">{findings.length} issues to resolve before the data is trusted</li>}
        </ul>
      )}
      <p className="demo-note">Made-up table, just to show the idea.</p>
    </div>
  )
}
