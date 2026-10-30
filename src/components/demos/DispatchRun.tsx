import { useState } from 'react'
import { jobsFor, payload, target, validate, type Inputs } from './dispatch'
import { Status, type State } from '../sim/Status'
import { Log, type LogLine } from '../sim/Log'
import { useSequence } from '../sim/useSequence'

const ENVS = ['dev', 'staging', 'production']
const START: Inputs = {
  GITHUB_REPO_NAME: 'planner-app',
  GITHUB_USERNAME: 'anaybaid7',
  GITHUB_BRANCH_NAME: 'refs/heads/main',
  ENVIRONMENT_NAME: 'staging',
  SEND_EMAIL_NOTIFICATION: true,
  INPUT_CUSTOM_DATA: '{ "triggered_by": "push" }',
}
const stamp = () => '03/04/2023 02:14:09 PM'

// The action end to end, with the same inputs it reads from the workflow.
// Clear a field to see it stop before dispatching, or change the environment
// to see which job the receiving workflow runs.
export default function DispatchRun() {
  const [env, setEnv] = useState(START)
  const [log, setLog] = useState<LogLine[]>([])
  const [request, setRequest] = useState<string | null>(null)
  const [jobs, setJobs] = useState<Record<string, State>>({})
  const [email, setEmail] = useState<string | null>(null)
  const seq = useSequence()
  const set = (k: keyof Inputs, v: string | boolean) => setEnv({ ...env, [k]: v })

  const run = () => {
    setLog([])
    setRequest(null)
    setJobs({})
    setEmail(null)
    const say = (l: LogLine) => setLog((x) => [...x, l])
    const steps: (() => void)[] = [() => say({ src: 'action', text: `${stamp()} Starting GitHub Dispatch action` })]
    const err = validate(env)
    let p: ReturnType<typeof payload> | null = null
    let bad: string | null = err
    if (!err) {
      try {
        p = payload(env)
      } catch {
        bad = 'Error: INPUT_CUSTOM_DATA is not valid JSON.'
      }
    }
    if (bad || !p) {
      steps.push(() => say({ src: 'action', text: bad!, tone: 'err' }))
      steps.push(() => say({ src: 'action', text: 'stopped before dispatch, nothing was built', tone: 'warn' }))
      return seq.run(steps, 350)
    }
    const req = p
    steps.push(
      () => say({ src: 'log', text: `writing /github/home/logs/github_dispatch_3f9a12c0-….log` }),
      () => say({ src: 'action', text: `${stamp()} Triggering build for ${target(env)}` }),
      () => setRequest(`POST ${req.url}\nAccept: application/vnd.github+json\n\n${JSON.stringify(req.body, null, 2)}`),
      () => say({ src: 'github', text: '204 No Content, repository_dispatch queued', tone: 'ok' }),
      () => setJobs(Object.fromEntries(jobsFor(env.ENVIRONMENT_NAME, ENVS).map((j) => [j.job, j.runs ? 'running' : 'skipped']))),
      () => setJobs(Object.fromEntries(jobsFor(env.ENVIRONMENT_NAME, ENVS).map((j) => [j.job, j.runs ? 'success' : 'skipped']))),
    )
    if (env.SEND_EMAIL_NOTIFICATION) {
      steps.push(
        () => say({ src: 'smtp', text: 'connect :587, EHLO, STARTTLS, login' }),
        () => {
          setEmail(`Subject: GitHub Action: Build triggered for ${target(env)}\n\nGitHub Action: Build triggered for ${target(env)}`)
          say({ src: 'smtp', text: 'notification sent', tone: 'ok' })
        },
      )
    }
    seq.run(steps, 420)
  }

  const field = (k: keyof Inputs, label = k) => (
    <label className="env-field">
      <code>{label}</code>
      <input value={String(env[k])} onChange={(e) => set(k, e.target.value)} disabled={seq.running} spellCheck={false} />
    </label>
  )

  return (
    <div className="demo build">
      <p className="demo-hint">Clear a field, or change the environment.</p>
      <div className="build-grid">
        <fieldset className="tree">
          <legend>Workflow env</legend>
          {field('GITHUB_REPO_NAME')}
          {field('GITHUB_USERNAME')}
          {field('GITHUB_BRANCH_NAME')}
          <label className="env-field">
            <code>ENVIRONMENT_NAME</code>
            <select value={env.ENVIRONMENT_NAME} onChange={(e) => set('ENVIRONMENT_NAME', e.target.value)} disabled={seq.running}>
              {['', ...ENVS].map((x) => <option key={x} value={x}>{x || '(empty)'}</option>)}
            </select>
          </label>
          {field('INPUT_CUSTOM_DATA')}
          <label className="demo-check">
            <input type="checkbox" checked={env.SEND_EMAIL_NOTIFICATION} onChange={(e) => set('SEND_EMAIL_NOTIFICATION', e.target.checked)} />
            <code>SEND_EMAIL_NOTIFICATION</code>
          </label>
          <button type="button" className="demo-primary" onClick={run} disabled={seq.running}>Run the action</button>
        </fieldset>
        <div>
          <Log title="Action output" lines={log} empty="Press Run the action" />
          {request && (
            <div className="flow-payload">
              <p>Request</p>
              <pre>{request}</pre>
            </div>
          )}
        </div>
      </div>

      <p className="demo-h">Receiving workflow, on repository_dispatch</p>
      <div className="wf-cards three">
        {ENVS.map((j) => (
          <div key={j} className={`wf s-${jobs[j] ?? 'idle'}`}>
            <p><Status state={jobs[j] ?? 'idle'} /> <code>{j}</code></p>
            <small>{jobs[j] === 'skipped' ? 'environment does not match' : jobs[j] === 'success' ? 'built' : jobs[j] ?? 'waiting'}</small>
          </div>
        ))}
      </div>

      {email && (
        <figure className="email">
          <figcaption>Notification email</figcaption>
          <pre>{email}</pre>
        </figure>
      )}
    </div>
  )
}
