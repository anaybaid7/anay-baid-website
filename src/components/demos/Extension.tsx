import { useState } from 'react'
import { MODULES, runTask, STAGES, type Record_, type StageResult } from './workflow'
import { Frame } from '../sim/Frame'
import { Log, type LogLine } from '../sim/Log'
import { Status, type State } from '../sim/Status'
import { useSequence } from '../sim/useSequence'

const PAGE: Record_ = {
  Resident: 'Sam Lee',
  Room: 'V1 South 305',
  'Student #': '20871234',
  Packages: '2 waiting',
  Carrier: 'Canada Post',
  'Key type': 'Room key',
}

// The extension working on a resident record. The content script reads each
// field from the page, messages go through the service worker, and the
// workflow engine runs the picked task module stage by stage.
export default function Extension() {
  const [task, setTask] = useState(MODULES[0].id)
  const [empty, setEmpty] = useState(false)
  const [reading, setReading] = useState<string | null>(null)
  const [stages, setStages] = useState<(StageResult | 'running' | null)[]>(STAGES.map(() => null))
  const [entry, setEntry] = useState<Record_ | null>(null)
  const [log, setLog] = useState<LogLine[]>([])
  const [typed, setTyped] = useState(0)
  const seq = useSequence()
  const m = MODULES.find((x) => x.id === task)!
  const page = empty ? { ...PAGE, Packages: '0 waiting' } : PAGE

  const run = () => {
    const res = runTask(m, page)
    setEntry(null)
    setStages(STAGES.map(() => null))
    setLog([])
    setTyped(0)
    const say = (l: LogLine) => setLog((x) => [...x, l])
    const stage = (i: number, v: StageResult | 'running') => setStages((s) => s.map((x, j) => (j === i ? v : x)))
    const steps: (() => void)[] = [
      () => say({ src: 'popup', text: `run ${m.id}` }),
      () => say({ src: 'worker', text: `forwarding to tab 3, content script` }),
      () => stage(0, 'running'),
      () => stage(0, res.stages[0]),
      () => stage(1, 'running'),
      ...m.fields.map((f) => () => {
        setReading(f)
        say({ src: 'content', text: `read "${f}" → ${page[f]}` })
      }),
      () => {
        setReading(null)
        stage(1, res.stages[1])
        say({ src: 'content', text: `sendMessage({ task: '${m.id}', record })` })
      },
    ]
    res.stages.slice(2).forEach((r, k) => {
      steps.push(() => stage(k + 2, 'running'))
      steps.push(() => {
        stage(k + 2, r)
        if (!r.ok) say({ src: 'engine', text: r.note, tone: 'err' })
      })
    })
    steps.push(() => {
      if (res.entry) {
        setEntry(res.entry)
        setTyped(Object.values(res.entry).join('').length)
        say({ src: 'engine', text: `log filled, ${m.fields.length} fields`, tone: 'ok' })
      } else say({ src: 'engine', text: 'stopped, nothing written to the log', tone: 'warn' })
    })
    seq.run(steps, 320)
  }

  const stateOf = (s: StageResult | 'running' | null): State => (s === null ? 'idle' : s === 'running' ? 'running' : s.ok ? 'success' : 'failed')

  return (
    <div className="demo ext">
      <p className="demo-lede">
        Pick a front desk task and run it on the resident record. Watch the fields get read off the page, the messages pass
        between the extension’s parts, and the log fill itself in.
      </p>
      <div className="ext-grid">
        <Frame title="StarRez" url="housing.example.ca/starrez/resident/20871234" className="ext-page">
          <p className="ext-h">Resident record</p>
          <dl>
            {Object.entries(page).map(([k, v]) => (
              <div key={k} className={reading === k ? 'reading' : m.fields.includes(k) ? 'used' : ''}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </Frame>

        <div className="ext-popup">
          <p className="ext-h">Front desk logger</p>
          <div className="ext-tasks" role="radiogroup" aria-label="Task">
            {MODULES.map((x) => (
              <label key={x.id} className={task === x.id ? 'on' : ''}>
                <input type="radio" name="ext-task" checked={task === x.id} onChange={() => setTask(x.id)} disabled={seq.running} />
                {x.name}
              </label>
            ))}
          </div>
          <ol className="ext-stages">
            {STAGES.map((s, i) => {
              const v = stages[i]
              return (
                <li key={s}>
                  <Status state={stateOf(v)} />
                  <span>{s}</span>
                  {v && v !== 'running' && <small>{v.note}</small>}
                </li>
              )
            })}
          </ol>
          <button type="button" className="demo-primary" onClick={run} disabled={seq.running}>Run {m.name.toLowerCase()}</button>
        </div>
      </div>

      <div className="ext-grid lower">
        <div className="sr-log">
          <p className="sr-title">{m.name} log</p>
          {m.fields.map((f) => (
            <label key={f} className="sr-field">
              <span>{f}</span>
              <input readOnly value={entry?.[f] ?? ''} />
            </label>
          ))}
          {entry && (
            <p className="ext-saved">
              {typed} characters that would have been typed by hand, filled in one click.
            </p>
          )}
        </div>
        <Log title="Extension messages" lines={log} empty="Run a task to see the messages" />
      </div>

      <label className="demo-check">
        <input type="checkbox" checked={empty} onChange={(e) => setEmpty(e.target.checked)} disabled={seq.running} />
        Resident has no packages waiting
      </label>
      <p className="demo-note">Made-up resident, just to show the idea.</p>
    </div>
  )
}
