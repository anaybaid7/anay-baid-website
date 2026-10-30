import { useState } from 'react'
import { Status, type State } from '../sim/Status'
import { Log, type LogLine } from '../sim/Log'
import { useSequence } from '../sim/useSequence'

const STAGES = ['install', 'lint', 'unit', 'e2e', 'build', 'release'] as const
const SPECS = [
  'signs in with a backend token',
  'creates a session',
  'joins a session from the invite link',
  'shows people as they join',
  'removes people when they leave',
]
const BROKEN = 3

// The release pipeline for the reference apps. Selenium drives a real
// browser through each spec, and one failing spec stops the release.
export default function ReleaseRun() {
  const [regress, setRegress] = useState(false)
  const [stage, setStage] = useState<Record<string, State>>({})
  const [specs, setSpecs] = useState<State[]>(SPECS.map(() => 'idle'))
  const [log, setLog] = useState<LogLine[]>([])
  const seq = useSequence()

  const run = () => {
    const fail = regress
    setStage({})
    setSpecs(SPECS.map(() => 'idle'))
    setLog([])
    const steps: (() => void)[] = []
    const say = (l: LogLine) => setLog((x) => [...x, l])
    const mark = (s: string, v: State) => setStage((x) => ({ ...x, [s]: v }))

    for (const s of ['install', 'lint', 'unit'] as const) {
      steps.push(() => mark(s, 'running'))
      steps.push(() => {
        mark(s, 'success')
        say({ src: s, text: s === 'install' ? 'npm ci, 812 packages' : s === 'lint' ? 'eslint, no problems' : 'mocha unit, all passing', tone: 'ok' })
      })
    }
    steps.push(() => {
      mark('e2e', 'running')
      say({ src: 'e2e', text: 'selenium-webdriver, chrome headless' })
    })
    SPECS.forEach((name, i) => {
      steps.push(() => setSpecs((x) => x.map((v, j) => (j === i ? 'running' : v))))
      steps.push(() => {
        const bad = fail && i === BROKEN
        setSpecs((x) => x.map((v, j) => (j === i ? (bad ? 'failed' : 'success') : v)))
        say(
          bad
            ? { src: 'e2e', text: `✗ ${name}  expected 2 people in [data-test=people], found 1`, tone: 'err' }
            : { src: 'e2e', text: `✓ ${name}`, tone: 'ok' },
        )
      })
    })
    if (fail) {
      steps.push(() => {
        mark('e2e', 'failed')
        mark('build', 'skipped')
        mark('release', 'skipped')
        say({ src: 'ci', text: '1 failing spec, release blocked before it reached users', tone: 'err' })
      })
    } else {
      steps.push(() => mark('e2e', 'success'))
      for (const s of ['build', 'release'] as const) {
        steps.push(() => mark(s, 'running'))
        steps.push(() => {
          mark(s, 'success')
          say({ src: s, text: s === 'build' ? 'vite build, dist ready' : 'released to production', tone: 'ok' })
        })
      }
    }
    seq.run(steps, 380)
  }

  return (
    <div className="demo release">
      <p className="demo-hint">Turn on the regression and run it.</p>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={run} disabled={seq.running}>Run the pipeline</button>
        <label className="demo-check">
          <input type="checkbox" checked={regress} onChange={(e) => setRegress(e.target.checked)} disabled={seq.running} />
          Introduce a regression in the join handler
        </label>
      </div>
      <ol className="stages">
        {STAGES.map((s) => (
          <li key={s} className={`st-${stage[s] ?? 'idle'}`}>
            <Status state={stage[s] ?? 'idle'} />
            <code>{s}</code>
          </li>
        ))}
      </ol>
      <div className="release-grid">
        <ul className="specs" aria-label="Browser specs">
          {SPECS.map((s, i) => (
            <li key={s}>
              <Status state={specs[i]} />
              {s}
            </li>
          ))}
        </ul>
        <Log title="CI output" lines={log} empty="Waiting for a run" />
      </div>
    </div>
  )
}
