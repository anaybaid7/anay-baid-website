import { useMemo, useState } from 'react'
import { handle, type Result, type World } from './bridge'
import { parse } from './copybook'
import { COPYBOOK, RECORDS } from './getacct'
import { Log, type LogLine } from '../sim/Log'

const FILE = Object.fromEntries(RECORDS.map((r) => [r.line.slice(0, 10), r.line]))
const FRESH: World = { now: 0, cache: {}, file: FILE, mainframeUp: true }
const TRY = [
  { label: 'Chequing', no: '0012345678' },
  { label: 'Corrupt', no: '0055501234' },
  { label: 'Not on file', no: '0000000001' },
  { label: 'Too short', no: '12345' },
]
const STAGES: Result['steps'][number]['at'][] = ['api', 'zod', 'redis', 'cics', 'map']
const NAMES = { api: 'Express route', zod: 'Zod check', redis: 'Redis', cics: 'GETACCT on CICS', map: 'Record to JSON' }

// The generated account route with a fake ACCTMAST behind it. Send the same
// number twice to see the cache answer, move the clock past five minutes to
// see it expire, or take the mainframe down to see the retries.
export default function Bridge() {
  const layout = useMemo(() => parse(COPYBOOK), [])
  const [world, setWorld] = useState(FRESH)
  const [no, setNo] = useState(TRY[0].no)
  const [last, setLast] = useState<Result | null>(null)
  const [log, setLog] = useState<LogLine[]>([])
  const [count, setCount] = useState({ requests: 0, hits: 0, calls: 0 })

  const send = () => {
    const r = handle(world, layout, no.trim(), `req-${count.requests + 1}`)
    setWorld(r.world)
    setLast(r)
    const hit = r.steps.some((s) => s.text.startsWith('HIT'))
    setCount((c) => ({ requests: c.requests + 1, hits: c.hits + (hit ? 1 : 0), calls: c.calls + r.mainframeCalls }))
    setLog((l) => [...l, ...r.steps.map((s) => ({ src: s.at, text: s.text, tone: s.tone })), { src: 'http', text: `${r.status}`, tone: (r.status === 200 ? 'ok' : 'err') as LogLine['tone'] }].slice(-40))
  }
  const wait = () => setWorld((w) => ({ ...w, now: w.now + 300 }))
  const reset = () => {
    setWorld(FRESH)
    setLast(null)
    setLog([])
    setCount({ requests: 0, hits: 0, calls: 0 })
  }
  const passed = new Set(last?.steps.map((s) => s.at))
  const cached = Object.entries(world.cache).filter(([, v]) => v.expires > world.now)

  return (
    <div className="demo bridge">
      <p className="demo-hint">Send the same account twice, then wait five minutes and send it again.</p>
      <div className="br-req">
        <span className="br-verb">GET</span>
        <code>/api/v1/accounts/</code>
        <input value={no} onChange={(e) => setNo(e.target.value)} aria-label="Account number" spellCheck={false} />
        <button type="button" className="demo-primary" onClick={send}>Send</button>
      </div>
      <div className="demo-actions">
        {TRY.map((t) => <button key={t.no} type="button" aria-pressed={no === t.no} onClick={() => setNo(t.no)}>{t.label}</button>)}
      </div>
      <div className="demo-actions">
        <button type="button" onClick={wait}>Wait five minutes</button>
        <button type="button" aria-pressed={!world.mainframeUp} onClick={() => setWorld((w) => ({ ...w, mainframeUp: !w.mainframeUp }))}>
          {world.mainframeUp ? 'Take the mainframe down' : 'Bring the mainframe back'}
        </button>
        <button type="button" onClick={reset}>Reset</button>
      </div>

      <ol className="br-path" aria-label="Where the last request went">
        {STAGES.map((s) => (
          <li key={s} className={passed.has(s) ? 'on' : ''}>{NAMES[s]}</li>
        ))}
      </ol>

      <div className="br-grid">
        <div>
          <p className="demo-h">Response {last && <b className={last.status === 200 ? 'br-ok' : 'br-bad'}>{last.status}</b>}</p>
          <pre className="cb-json">{last ? JSON.stringify(last.body, null, 2) : 'Send a request'}</pre>
        </div>
        <div>
          <p className="demo-h">Bridge</p>
          <dl className="br-stats">
            <div><dt>Requests</dt><dd>{count.requests}</dd></div>
            <div><dt>Cache hits</dt><dd>{count.hits}</dd></div>
            <div><dt>Mainframe calls</dt><dd>{count.calls}</dd></div>
            <div><dt>Clock</dt><dd>{world.now / 60} min</dd></div>
          </dl>
          <p className="demo-h">In Redis</p>
          <ul className="br-cache">
            {cached.length === 0 && <li>empty</li>}
            {cached.map(([k, v]) => <li key={k}><code>{k}</code> <span>{v.expires - world.now}s left</span></li>)}
          </ul>
        </div>
      </div>
      <Log title="Request trace" lines={log} empty="No requests yet" />
    </div>
  )
}
