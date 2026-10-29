import { useState } from 'react'
import { Status, type State } from '../sim/Status'
import { Log, type LogLine } from '../sim/Log'
import { useSequence } from '../sim/useSequence'

type Mode = 'device' | 'image' | 'ssh'

// each policy, and the line Intune or Azure logs when it lands
const POLICIES: [string, string][] = [
  ['Enrolled in Intune', 'device enrolled with a work account'],
  ['BitLocker disk encryption', 'BitLocker policy applied, encrypting the disk'],
  ['Password, 12 characters minimum', 'password policy applied'],
  ['Company Portal installed', 'required app installed, Company Portal'],
  ['Outlook installed', 'required app installed, Outlook'],
  ['VPN client installed', 'required app installed, VPN client'],
  ['Compliance reported to Azure', 'device marked compliant'],
]

// a laptop enrolling, and every policy and app arriving without anyone
// touching it. Turning encryption off afterwards marks it non-compliant
// until Intune puts it back.
function Device() {
  const [done, setDone] = useState<State[]>(POLICIES.map(() => 'idle'))
  const [log, setLog] = useState<LogLine[]>([])
  const seq = useSequence()
  const say = (l: LogLine) => setLog((x) => [...x, l])
  const set = (i: number, v: State) => setDone((d) => d.map((x, j) => (j === i ? v : x)))
  const compliant = done.every((d) => d === 'success')
  const broken = done[1] === 'failed'

  const enroll = () => {
    setDone(POLICIES.map(() => 'idle'))
    setLog([])
    seq.run(
      POLICIES.flatMap(([, line], i) => [
        () => set(i, 'running'),
        () => {
          set(i, 'success')
          say({ src: i === 6 ? 'azure' : 'intune', text: line, tone: 'ok' })
        },
      ]),
      350,
    )
  }
  const tamper = () => {
    set(1, 'failed')
    set(6, 'failed')
    say({ src: 'device', text: 'BitLocker turned off by the user', tone: 'warn' })
    say({ src: 'azure', text: 'device non-compliant, access to company resources blocked', tone: 'err' })
  }
  const remediate = () =>
    seq.run(
      [
        () => set(1, 'running'),
        () => {
          set(1, 'success')
          say({ src: 'intune', text: 'policy reapplied, BitLocker encrypting', tone: 'ok' })
        },
        () => {
          set(6, 'success')
          say({ src: 'azure', text: 'device compliant again', tone: 'ok' })
        },
      ],
      500,
    )

  return (
    <>
      <div className="prov-device">
        <div className={`laptop ${compliant ? 'ok' : broken ? 'bad' : ''}`}>
          <p>NA-LT-0142</p>
          <p className="laptop-state">{compliant ? 'Compliant' : broken ? 'Not compliant' : done[0] === 'idle' ? 'Not enrolled' : 'Enrolling'}</p>
        </div>
        <ul className="checks">
          {POLICIES.map(([p], i) => (
            <li key={p}>
              <Status state={done[i]} />
              {p}
            </li>
          ))}
        </ul>
      </div>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={enroll} disabled={seq.running}>Enroll the laptop</button>
        <button type="button" onClick={tamper} disabled={seq.running || !compliant}>Turn off encryption</button>
        <button type="button" onClick={remediate} disabled={seq.running || !broken}>Let Intune fix it</button>
      </div>
      <Log title="Intune and Azure" lines={log} empty="Nothing enrolled yet" />
    </>
  )
}

const ENVS = ['dev', 'staging', 'prod'] as const
const digest = (n: number) => `sha256:${(0x4f1c9a + n * 0x2b3d17).toString(16).slice(0, 6)}…`

// one image built once and promoted, versus rebuilding per environment
function Image() {
  const [build, setBuild] = useState(0)
  const [running, setRunning] = useState<Record<string, number | undefined>>({})
  const [log, setLog] = useState<LogLine[]>([])
  const say = (l: LogLine) => setLog((x) => [...x, l])

  const make = () => {
    const n = build + 1
    setBuild(n)
    setRunning({ dev: n })
    say({ src: 'docker', text: `built appraisal-api@${digest(n)}, deployed to dev`, tone: 'ok' })
  }
  const promote = (i: number) => {
    const from = ENVS[i - 1]
    setRunning((r) => ({ ...r, [ENVS[i]]: r[from] }))
    say({ src: 'deploy', text: `${ENVS[i]} pulled the same digest ${digest(running[from]!)} from ${from}`, tone: 'ok' })
  }
  const rebuild = (i: number) => {
    const n = build + 1
    setBuild(n)
    setRunning((r) => ({ ...r, [ENVS[i]]: n }))
    say({ src: 'docker', text: `rebuilt for ${ENVS[i]}, got a new digest ${digest(n)}`, tone: 'warn' })
  }
  const same = ENVS.every((e) => running[e] !== undefined) && new Set(ENVS.map((e) => running[e])).size === 1

  return (
    <>
      <div className="envs">
        {ENVS.map((e, i) => (
          <div key={e} className={`env ${running[e] ? 'on' : ''}`}>
            <p className="env-name">{e}</p>
            <p className="env-digest">{running[e] ? digest(running[e]!) : 'nothing deployed'}</p>
            {i > 0 && (
              <p className="env-act">
                <button type="button" onClick={() => promote(i)} disabled={!running[ENVS[i - 1]]}>Promote</button>
                <button type="button" onClick={() => rebuild(i)} disabled={!running[ENVS[i - 1]]}>Rebuild here</button>
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={make}>Build the image</button>
      </div>
      <p className={`demo-out ${ENVS.every((e) => running[e]) && !same ? 'warn' : ''}`} aria-live="polite">
        {same
          ? 'Every environment runs the same digest, so what passed in staging is exactly what runs in prod.'
          : ENVS.every((e) => running[e])
            ? 'The environments run different builds, so staging no longer proves anything about prod.'
            : 'Build once, then promote the same image up the chain.'}
      </p>
      <Log title="Deployments" lines={log} empty="No builds yet" />
    </>
  )
}

const QUERIES = [
  { q: 'SELECT COUNT(*) FROM appraisals;', ok: '18 204' },
  { q: 'SELECT COUNT(*) FROM appraisals WHERE owner_id IS NULL;', ok: '0', bad: '3' },
  { q: 'SELECT COUNT(*) FROM appraisals a LEFT JOIN properties p ON p.id = a.property_id WHERE p.id IS NULL;', ok: '0' },
]

// checks against a private database, through an SSH tunnel
function Ssh() {
  const [lines, setLines] = useState<LogLine[]>([])
  const [fixed, setFixed] = useState(false)
  const [ran, setRan] = useState(false)
  const seq = useSequence()
  const say = (l: LogLine) => setLines((x) => [...x, l])

  const run = (clean = fixed) => {
    setLines([])
    setRan(true)
    seq.run(
      [
        () => say({ src: '$', text: 'ssh -N -L 5433:db.internal:5432 ops@bastion' }),
        () => say({ src: 'ssh', text: 'tunnel open, localhost:5433 → db.internal:5432', tone: 'ok' }),
        () => say({ src: '$', text: 'psql -h localhost -p 5433 appraisals' }),
        ...QUERIES.flatMap((x) => [
          () => say({ src: 'sql', text: x.q }),
          () => {
            const v = !clean && x.bad ? x.bad : x.ok
            say({ src: 'result', text: v, tone: x.bad && v === x.bad ? 'err' : 'ok' })
          },
        ]),
        () => say(clean ? { src: 'check', text: 'all validation queries passed', tone: 'ok' } : { src: 'check', text: '3 appraisals have no owner', tone: 'err' }),
      ],
      420,
    )
  }
  const fix = () => {
    setFixed(true)
    say({ src: 'sql', text: 'UPDATE appraisals SET owner_id = o.id FROM owners o WHERE appraisals.owner_email = o.email AND owner_id IS NULL;' })
    say({ src: 'result', text: 'UPDATE 3', tone: 'ok' })
  }

  return (
    <>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={() => run()} disabled={seq.running}>
          {ran ? 'Run the checks again' : 'Open the tunnel and check'}
        </button>
        <button type="button" onClick={fix} disabled={seq.running || fixed || !ran}>Backfill the missing owners</button>
      </div>
      <Log title="Terminal" lines={lines} empty="Not connected" />
    </>
  )
}

const MODES: [Mode, string][] = [
  ['device', 'Enroll a device'],
  ['image', 'Ship one image'],
  ['ssh', 'Validate over SSH'],
]

export default function Provision() {
  const [mode, setMode] = useState<Mode>('device')
  return (
    <div className="demo prov">
      <p className="demo-lede">Three pieces of the infrastructure work, each one runnable.</p>
      <div className="sub-tabs" role="tablist" aria-label="Scenarios">
        {MODES.map(([m, label]) => (
          <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => setMode(m)}>{label}</button>
        ))}
      </div>
      {mode === 'device' && <Device />}
      {mode === 'image' && <Image />}
      {mode === 'ssh' && <Ssh />}
    </div>
  )
}
