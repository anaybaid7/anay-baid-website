import { useState } from 'react'
import { planBuild, serviceOf, SERVICES, type Service } from './planBuild'
import { Status, type State } from '../sim/Status'
import { useSequence } from '../sim/useSequence'

const FILES = [
  'api/routes/users.py',
  'api/models.py',
  'web/src/App.tsx',
  'web/src/pages/Login.tsx',
  'worker/jobs/email.py',
  'docs/setup.md',
]
const ENVS = ['dev', 'staging', 'prod'] as const
const BRANCHES = ['main', 'feature/login'] as const
const TIME: Record<Service, string> = { api: '1m 42s', web: '2m 05s', worker: '58s', docs: '21s' }

// The build trigger end to end. Changed files map to services, the target
// environment is checked before anything is dispatched, only the changed
// services build, and one summary email goes out at the end.
export default function TargetedBuild() {
  const [changed, setChanged] = useState<string[]>(['api/routes/users.py', 'web/src/App.tsx'])
  const [env, setEnv] = useState<(typeof ENVS)[number]>('staging')
  const [branch, setBranch] = useState<(typeof BRANCHES)[number]>('main')
  const [failWeb, setFailWeb] = useState(false)
  const [checks, setChecks] = useState<State[]>([])
  const [wf, setWf] = useState<Partial<Record<Service, State>>>({})
  const [email, setEmail] = useState<string | null>(null)
  const seq = useSequence()
  const plan = planBuild(changed, env, branch)

  const run = () => {
    const p = plan
    setChecks([])
    setWf({})
    setEmail(null)
    const steps: (() => void)[] = []
    p.checks.forEach((c, i) => {
      steps.push(() => setChecks((x) => [...x.slice(0, i), 'running']))
      steps.push(() => setChecks((x) => [...x.slice(0, i), c.ok ? 'success' : 'failed']))
    })
    if (!p.ok) {
      steps.push(() => setEmail(`Subject: ${env} build blocked\n\nNothing was dispatched.\n${branch} is not allowed to deploy to ${env}. Merge to main first.`))
      return seq.run(steps, 300)
    }
    steps.push(() => setWf(Object.fromEntries(SERVICES.map((s) => [s, p.build.includes(s) ? 'queued' : 'skipped']))))
    p.build.forEach((s) => steps.push(() => setWf((x) => ({ ...x, [s]: 'running' }))))
    const result = (s: Service): State => (s === 'web' && failWeb ? 'failed' : 'success')
    p.build.forEach((s) => steps.push(() => setWf((x) => ({ ...x, [s]: result(s) }))))
    steps.push(() => {
      const lines = SERVICES.map((s) =>
        p.build.includes(s) ? `${s.padEnd(7)} ${result(s).padEnd(8)} ${TIME[s]}` : `${s.padEnd(7)} skipped  no changes`,
      )
      const bad = p.build.filter((s) => result(s) === 'failed').length
      setEmail(`Subject: ${env} build, ${p.build.length} of ${SERVICES.length} services${bad ? `, ${bad} failed` : ''}\n\n${lines.join('\n')}`)
    })
    seq.run(steps, 420)
  }

  const toggle = (f: string) => setChanged(changed.includes(f) ? changed.filter((x) => x !== f) : [...changed, f])

  return (
    <div className="demo build">
      <p className="demo-lede">
        Pick the files that changed, where they’re going and from which branch. The tool works out which services need
        building, checks the environment, and dispatches only those workflows.
      </p>
      <div className="build-grid">
        <fieldset className="tree">
          <legend>Changed files</legend>
          {FILES.map((f) => (
            <label key={f} className="demo-check">
              <input type="checkbox" checked={changed.includes(f)} onChange={() => toggle(f)} disabled={seq.running} />
              <code>{f}</code>
              <span className="svc">{serviceOf(f)}</span>
            </label>
          ))}
        </fieldset>
        <div className="build-opts">
          <fieldset>
            <legend>Environment</legend>
            {ENVS.map((e) => (
              <label key={e} className="demo-check">
                <input type="radio" name="build-env" checked={env === e} onChange={() => setEnv(e)} disabled={seq.running} /> {e}
              </label>
            ))}
          </fieldset>
          <fieldset>
            <legend>Branch</legend>
            {BRANCHES.map((b) => (
              <label key={b} className="demo-check">
                <input type="radio" name="build-branch" checked={branch === b} onChange={() => setBranch(b)} disabled={seq.running} /> <code>{b}</code>
              </label>
            ))}
          </fieldset>
          <label className="demo-check">
            <input type="checkbox" checked={failWeb} onChange={(e) => setFailWeb(e.target.checked)} disabled={seq.running} /> Break the web build
          </label>
          <button type="button" className="demo-primary" onClick={run} disabled={seq.running}>
            Run build-trigger
          </button>
        </div>
      </div>

      <pre className="term small">$ build-trigger --env {env} --branch {branch}{'\n'}changed: {plan.build.length ? plan.build.map((s) => `${s}/`).join(' ') : 'nothing'}</pre>

      <ul className="checks">
        {plan.checks.map((c, i) => (
          <li key={c.name}>
            <Status state={checks[i] ?? 'idle'} />
            {c.name}
          </li>
        ))}
      </ul>

      <div className="wf-cards">
        {SERVICES.map((s) => (
          <div key={s} className={`wf s-${wf[s] ?? 'idle'}`}>
            <p><Status state={wf[s] ?? 'idle'} /> <code>{s}.yml</code></p>
            <small>{wf[s] === 'skipped' ? 'no changes' : wf[s] === 'success' || wf[s] === 'failed' ? TIME[s] : wf[s] ?? 'waiting'}</small>
          </div>
        ))}
      </div>

      {email && (
        <figure className="email">
          <figcaption>Summary email, sent over SMTP with TLS</figcaption>
          <pre>{email}</pre>
        </figure>
      )}
      <p className="demo-note">Made-up repo, just to show the idea.</p>
    </div>
  )
}
