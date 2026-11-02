import { useMemo, useState } from 'react'
import { decode, ebcdic, endpoints, pack, parse, recordLength } from './copybook'
import { COPYBOOK, RECORDS } from './getacct'

// Read a COBOL record layout, then read a fixed-width record with it. Hover a
// field to see which bytes it owns. Edit the layout or the record and the
// JSON and the suggested routes follow.
export default function Copybook() {
  const [source, setSource] = useState(COPYBOOK)
  const [pick, setPick] = useState(0)
  const [line, setLine] = useState(RECORDS[0].line)
  const [on, setOn] = useState<string | null>(null)
  const [hex, setHex] = useState(false)
  const [negative, setNegative] = useState(false)
  const layout = useMemo(() => parse(source), [source])
  const { json, errors } = decode(layout, line)
  const routes = endpoints(layout)
  const bad = new Set(errors.map((e) => e.field))
  const length = recordLength(layout)
  const slice = (offset: number, bytes: number) => line.padEnd(length).slice(offset, offset + bytes)
  // the first field with implied decimals, shown as it would be packed
  const money = layout.fields.find((f) => f.decimals > 0)
  const moneyDigits = money ? slice(money.offset, money.bytes) : ''
  const packed = /^\d+$/.test(moneyDigits) ? pack(moneyDigits, negative) : null

  const choose = (i: number) => {
    setPick(i)
    setLine(RECORDS[i].line)
  }

  return (
    <div className="demo copybook">
      <p className="demo-hint">Pick a record, then hover a field to see the bytes it reads.</p>
      <div className="demo-tabs" role="group" aria-label="Sample record">
        {RECORDS.map((r, i) => (
          <button key={r.label} type="button" aria-pressed={pick === i} onClick={() => choose(i)}>{r.label}</button>
        ))}
      </div>

      <div className="cb-head">
        <p className="demo-h">ACCTMAST record, {length} bytes</p>
        <button type="button" aria-pressed={hex} onClick={() => setHex(!hex)}>{hex ? 'Show text' : 'Show EBCDIC bytes'}</button>
      </div>
      <div className="cb-bytes" aria-label="The record split into its fields">
        {layout.fields.map((f) => (
          <span
            key={f.cobol}
            className={[on === f.cobol ? 'on' : '', bad.has(f.cobol) ? 'bad' : ''].join(' ')}
            style={{ flexGrow: f.bytes }}
            onMouseEnter={() => setOn(f.cobol)}
            onMouseLeave={() => setOn(null)}
            title={`${f.cobol}, bytes ${f.offset + 1} to ${f.offset + f.bytes}`}
          >
            <i>{hex ? ebcdic(slice(f.offset, f.bytes)).join(' ') : slice(f.offset, f.bytes).replace(/ /g, '·')}</i>
            <small>{f.cobol}</small>
          </span>
        ))}
      </div>
      <label className="demo-field small">
        Raw record
        <input className="cb-raw" value={line} spellCheck={false} onChange={(e) => setLine(e.target.value)} />
      </label>

      <div className="cb-grid">
        <div className="table-scroll">
          <table className="plan-table cb-table">
            <thead>
              <tr><th>COBOL field</th><th>PIC</th><th>Bytes</th><th>JSON</th><th>Type</th></tr>
            </thead>
            <tbody>
              {layout.fields.map((f) => (
                <tr
                  key={f.cobol}
                  className={[on === f.cobol ? 'picked' : '', bad.has(f.cobol) ? 'bad' : ''].join(' ')}
                  onMouseEnter={() => setOn(f.cobol)}
                  onMouseLeave={() => setOn(null)}
                >
                  <td><code>{f.cobol}</code>{f.cobol === layout.key && <span className="cb-key"> key</span>}</td>
                  <td><code>{f.pic}</code></td>
                  <td>{f.offset + 1}–{f.offset + f.bytes}</td>
                  <td><code>{f.name}</code></td>
                  <td>{f.type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <p className="demo-h">{layout.entity} as JSON</p>
          <pre className="cb-json">{JSON.stringify(json, null, 2)}</pre>
          {errors.length > 0 && (
            <ul className="cb-errors">
              {errors.map((e) => <li key={e.field}><code>{e.field}</code> {e.message}</li>)}
            </ul>
          )}
        </div>
      </div>

      <p className="demo-h">Routes this layout suggests</p>
      <ul className="cb-routes">
        {routes.map((r) => (
          <li key={r.path}><b>{r.method}</b> <code>{r.path}</code> <span>{r.why}</span></li>
        ))}
      </ul>

      {money && packed && (
        <div className="cb-pack">
          <p className="demo-h">{money.cobol} as COMP-3, {packed.length} bytes instead of {money.bytes}</p>
          <ol aria-label="Packed decimal bytes">
            {packed.map((b, i) => (
              <li key={i}>
                <b>{b[0]}</b>
                <b className={i === packed.length - 1 ? 'sign' : ''}>{b[1]}</b>
              </li>
            ))}
          </ol>
          <p className="demo-note">Two digits a byte, sign in the last nibble, C for plus and D for minus. The sample file stores the balance as display digits, but production copybooks often declare money as <code>PIC S9(10)V99 COMP-3</code>, and a reader has to unpack it before the implied decimals apply.</p>
          <label className="demo-check tight">
            <input type="checkbox" checked={negative} onChange={(e) => setNegative(e.target.checked)} />
            Overdrawn
          </label>
        </div>
      )}

      <details className="cb-source">
        <summary>Edit the record layout</summary>
        <textarea value={source} spellCheck={false} rows={16} onChange={(e) => setSource(e.target.value)} aria-label="COBOL record layout" />
      </details>
    </div>
  )
}
