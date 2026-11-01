import { useMemo, useState, type ReactNode } from 'react'
import { isInput, isOutput, parseBms, routeFor, rowRuns, fieldName } from './bms'
import { decode, parse } from './copybook'
import { BMS, COPYBOOK, RECORDS } from './getacct'

const FILE = Object.fromEntries(RECORDS.map((r) => [r.line.slice(0, 10), r.line]))
const money = (n: number) => n.toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// the AINQ transaction: read ACCTNO, fill ACCTNAME and BALANCE, the way the
// COBOL program's MAIN-LOGIC does
function transact(no: string) {
  const line = FILE[no.padStart(10, '0')]
  if (!line) return { ACCTNAME: 'ACCOUNT NOT FOUND', BALANCE: '' }
  const { json } = decode(parse(COPYBOOK), line)
  const bal = json.accountBalance
  return { ACCTNAME: String(json.accountName), BALANCE: typeof bal === 'number' ? money(bal) : '***********' }
}

// The account inquiry green screen drawn from its BMS map, next to the REST
// route the same map turns into. Type an account number on the screen and
// press Enter, and the same lookup shows up as JSON.
export default function Screen3270() {
  const [source, setSource] = useState(BMS)
  const map = useMemo(() => parseBms(source), [source])
  const route = routeFor(map)
  const [typed, setTyped] = useState('0012345678')
  const [out, setOut] = useState<Record<string, string>>({})
  const [show, setShow] = useState(false)
  const input = map.fields.find(isInput)

  const enter = () => setOut(transact(typed))
  const values = { ...out, ...(input?.label ? { [input.label]: typed } : {}) }
  const body = Object.fromEntries(map.fields.filter(isInput).map((f) => [fieldName(f.label!), values[f.label!] ?? '']))
  const answer = Object.fromEntries(map.fields.filter(isOutput).map((f) => [fieldName(f.label!), (out[f.label!] ?? '').trim()]))

  const rows: ReactNode[] = []
  for (let r = 1; r <= map.rows; r++) {
    const parts: ReactNode[] = []
    let at = 1
    for (const run of rowRuns(map, r, values)) {
      if (run.col > at) parts.push(' '.repeat(run.col - at))
      const f = run.field
      const cls = [`c-${f.color.toLowerCase()}`, f.blink ? 'blink' : '', show && f.label ? (isInput(f) ? 'f-in' : 'f-out') : ''].join(' ')
      if (isInput(f))
        parts.push(
          <input
            key={f.col}
            className={cls}
            style={{ width: `${f.length}ch` }}
            maxLength={f.length}
            value={typed}
            aria-label={f.label!}
            onChange={(e) => setTyped(e.target.value.replace(/\D/g, ''))}
            onKeyDown={(e) => e.key === 'Enter' && enter()}
          />,
        )
      else parts.push(<span key={f.col} className={cls} title={show && f.label ? f.label : undefined}>{run.text}</span>)
      at = run.col + f.length
    }
    rows.push(<div key={r} className="t3-row">{parts}</div>)
  }

  return (
    <div className="demo t3270">
      <p className="demo-hint">Type an account number on the screen and press Enter.</p>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={enter}>Enter</button>
        <button type="button" onClick={() => setTyped('0098765432')}>Savings account</button>
        <button type="button" onClick={() => setTyped('0000000001')}>Unknown account</button>
        <button type="button" aria-pressed={show} onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'} the fields</button>
      </div>

      <div className="t3-grid">
        <div className="t3-frame">
          <div className="t3-screen" role="group" aria-label={`3270 screen, ${map.mapset}`}>{rows}</div>
          <p className="t3-oia"><span>{map.transaction}</span><span>{map.mapset}</span><span>{map.rows}×{map.cols}</span></p>
        </div>
        <div className="t3-rest">
          <div>
            <p className="demo-h">The same transaction over REST</p>
            <pre className="cb-json">{`${route.method} ${route.path}\n${JSON.stringify(body, null, 2)}`}</pre>
            <pre className="cb-json">{Object.values(answer).some(Boolean) ? `200 OK\n${JSON.stringify(answer, null, 2)}` : 'Press Enter to run AINQ'}</pre>
          </div>
          <div>
            <p className="demo-h">Fields on the map</p>
            <ul className="cb-routes">
              {map.fields.filter((f) => f.label).map((f) => (
                <li key={f.label}><b>{isInput(f) ? 'IN' : 'OUT'}</b> <code>{f.label}</code> <span>row {f.row}, col {f.col}, {f.length} chars → {fieldName(f.label!)}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <details className="cb-source">
        <summary>Edit the BMS map</summary>
        <textarea value={source} spellCheck={false} rows={18} onChange={(e) => setSource(e.target.value)} aria-label="BMS map source" />
      </details>
    </div>
  )
}
