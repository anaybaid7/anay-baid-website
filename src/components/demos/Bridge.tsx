import { useMemo, useState } from 'react'
import { BREAK_AFTER, BREAK_FOR, GENERATED, OUTAGE, handle, replay, type Opts, type Outcome, type Result, type World } from './bridge'
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
const STAGES: Result['steps'][number]['at'][] = ['api', 'zod', 'redis', 'breaker', 'cics', 'map']
const NAMES = { api: 'Express route', zod: 'Zod check', redis: 'Redis', breaker: 'Breaker', cics: 'GETACCT on CICS', map: 'Record to JSON' }
const SAYS: Record<Outcome, string> = { hit: 'answered from Redis', miss: 'GETACCT ran', missing: 'not on file, GETACCT ran', failed: 'timed out 3 times, 15s wait', shed: 'breaker open, failed fast', stale: 'old copy, marked stale' }
// the generated route, then each change on top of it
const PLANS: { name: string; opts: Opts }[] = [
  { name: 'No cache', opts: { ...GENERATED, ttl: 0 } },
  { name: 'Generated route, 5 min cache', opts: GENERATED },
  { name: '+ remember 404s for 1 min', opts: { ...GENERATED, notFoundTtl: 60 } },
  { name: `+ breaker, ${BREAK_AFTER} timeouts opens it ${BREAK_FOR}s`, opts: { ...GENERATED, notFoundTtl: 60, breaker: true } },
  { name: '+ last good copy when CICS is down', opts: { ...GENERATED, notFoundTtl: 60, breaker: true, staleFor: 1800 } },
]

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
  const [plan, setPlan] = useState(1)
  const runs = useMemo(() => PLANS.map((p) => replay(FRESH, layout, p.opts)), [layout])
  const run = runs[plan]
  const opts = PLANS[plan].opts

  const send = () => {
    const r = handle(world, layout, no.trim(), `req-${count.requests + 1}`, opts)
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

      <p className="demo-h br-replay-h">Replay 120 requests, one every 15 seconds, with the mainframe down for requests {OUTAGE[0] + 1} to {OUTAGE[1]}</p>
      <div className="br-plans" role="group" aria-label="Which version of the route">
        {PLANS.map((p, i) => <button key={p.name} type="button" aria-pressed={plan === i} onClick={() => setPlan(i)}>{p.name}</button>)}
      </div>
      <div className="br-strip-wrap">
        <ol className="br-strip" aria-label={`${run.calls} calls reached the mainframe`}>
          {run.out.map((o, i) => <li key={i} className={`${o} ${i >= OUTAGE[0] && i < OUTAGE[1] ? 'down' : ''}`} title={`#${i + 1} ${SAYS[o]}`} />)}
        </ol>
      </div>
      <p className="demo-legend">
        {(Object.keys(SAYS) as Outcome[]).map((o) => <span key={o}><i className={o} /> {SAYS[o]}</span>)}
      </p>
      <div className="table-scroll">
        <table className="plan-table br-compare">
          <thead><tr><th>Route</th><th>Calls to CICS</th><th>Timed out</th><th>Errors returned</th><th>Callers waited</th></tr></thead>
          <tbody>
            {PLANS.map((p, i) => (
              <tr key={p.name} className={i === plan ? 'picked' : ''} onClick={() => setPlan(i)}>
                <td>{p.name}</td>
                <td>{runs[i].calls}</td>
                <td>{runs[i].timeouts}</td>
                <td>{runs[i].errors}</td>
                <td>{runs[i].waited}s</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="demo-note">Retries count as calls. The generated route stops at the cache, and the rows below it are what I’d add. A stale balance is flagged in its metadata so the app can label it. The buttons above use the version picked here.</p>
    </div>
  )
}
