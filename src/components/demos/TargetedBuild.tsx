import { useEffect, useRef, useState } from 'react'

const SERVICES = ['api', 'web', 'worker', 'docs']
const ENVS = ['dev', 'staging', 'prod'] as const

// What the uOttaHack tool does, on a made-up repo: only the services that
// changed get built, the environment is checked first, and the result is emailed.
export default function TargetedBuild() {
  const [changed, setChanged] = useState<string[]>(['api', 'web'])
  const [env, setEnv] = useState<(typeof ENVS)[number]>('staging')
  const [lines, setLines] = useState<string[]>([])
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearInterval(timer.current), [])

  const script = () => {
    const skip = SERVICES.filter((s) => !changed.includes(s))
    return [
      `$ build-trigger --env ${env}`,
      `checking ${env} ... ok`,
      `changed since last build: ${changed.length ? changed.map((c) => `${c}/`).join(' ') : 'nothing'}`,
      ...(changed.length
        ? [
            `triggering ${changed.length} of ${SERVICES.length} builds through the GitHub API`,
            ...changed.map((c) => `  POST /actions/workflows/${c}.yml/dispatches  204`),
          ]
        : ['nothing to build']),
      ...(skip.length ? [`skipped ${skip.join(', ')}, no changes`] : []),
      `emailed the result over SMTP (TLS)`,
    ]
  }

  const run = () => {
    window.clearInterval(timer.current)
    const all = script()
    if (document.documentElement.dataset.motion === 'reduced') return setLines(all)
    setLines([])
    let i = 0
    timer.current = window.setInterval(() => {
      i++
      setLines(all.slice(0, i))
      if (i >= all.length) window.clearInterval(timer.current)
    }, 260)
  }

  return (
    <div className="demo build">
      <p className="demo-lede">Pick what changed and where it's going, then run it.</p>
      <div className="build-opts">
        <fieldset>
          <legend>Changed</legend>
          {SERVICES.map((s) => (
            <label key={s} className="demo-check">
              <input
                type="checkbox"
                checked={changed.includes(s)}
                onChange={(e) => setChanged(e.target.checked ? [...changed, s] : changed.filter((c) => c !== s))}
              />
              <code>{s}/</code>
            </label>
          ))}
        </fieldset>
        <fieldset>
          <legend>Environment</legend>
          {ENVS.map((e) => (
            <label key={e} className="demo-check">
              <input type="radio" name="build-env" checked={env === e} onChange={() => setEnv(e)} /> {e}
            </label>
          ))}
        </fieldset>
        <button type="button" className="demo-primary" onClick={run}>Run</button>
      </div>
      <pre className="term" aria-live="polite">
        {lines.length ? lines.join('\n') : 'Press Run'}
      </pre>
      <p className="demo-note">Made-up repo and output. It shows what the tool does, not its exact logs.</p>
    </div>
  )
}
