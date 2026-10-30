import { useState } from 'react'
import { Frame } from '../sim/Frame'
import { Log, type LogLine } from '../sim/Log'
import { useSequence } from '../sim/useSequence'

const CODE = [
  "import { createClient } from '@iotum/sdk'",
  '',
  "const client = createClient({ region: 'ca' })",
  'await client.auth.signIn(await getToken())',
  '',
  'const session = await client.sessions.create({ title })',
  "client.on('participant.joined', (p) => addPerson(p))",
  "client.on('participant.left', (p) => removePerson(p.id))",
  '',
  'return <Room session={session} people={people} />',
]

interface Ui {
  status: string
  user?: string
  room?: string
  people: string[]
  live: boolean
}

interface Step {
  lines: number[]
  say: string
  net: LogLine[]
  ui: (u: Ui) => Ui
}

const STEPS: Step[] = [
  {
    lines: [2],
    say: 'One client for the whole app, created once at start-up.',
    net: [{ src: 'sdk', text: 'client ready, region ca' }],
    ui: (u) => ({ ...u, status: 'Starting' }),
  },
  {
    lines: [3],
    say: 'The app’s own backend mints a short-lived token, so the API key never reaches the browser.',
    net: [
      { src: 'app', text: 'POST /api/token  200  (your backend)' },
      { src: 'sdk', text: 'POST /v1/auth/token-exchange  200', tone: 'ok' },
    ],
    ui: (u) => ({ ...u, status: 'Signed in', user: 'Anay' }),
  },
  {
    lines: [5],
    say: 'Creating a session returns a typed object the UI renders directly.',
    net: [{ src: 'sdk', text: 'POST /v1/sessions  201  { id: "s_4821" }', tone: 'ok' }],
    ui: (u) => ({ ...u, status: 'Session open', room: 'Design review', people: ['Anay'] }),
  },
  {
    lines: [6, 7],
    say: 'Events arrive over one persistent connection, and handlers update React state.',
    net: [{ src: 'sdk', text: 'WSS /v1/events  open, subscribed to participant.*', tone: 'ok' }],
    ui: (u) => ({ ...u, live: true }),
  },
  {
    lines: [9],
    say: 'The screen renders from state, so it always matches the session without polling.',
    net: [{ src: 'app', text: 'rendered <Room> with 1 participant' }],
    ui: (u) => u,
  },
]

const GUESTS = ['Priya', 'Marco', 'Lena', 'Kofi']

// A reference app integrating the SDK, line by line. Run it to watch each
// call light up in the code, go out on the network, and change the screen.
// After that, people join and leave as live events.
export default function SdkRun() {
  const [at, setAt] = useState(-1)
  const [ui, setUi] = useState<Ui>({ status: 'Not started', people: [], live: false })
  const [net, setNet] = useState<LogLine[]>([])
  const [online, setOnline] = useState(true)
  const [evLine, setEvLine] = useState<number | null>(null)
  const seq = useSequence()
  const step = at >= 0 ? STEPS[at] : null
  const done = at >= STEPS.length - 1

  const apply = (i: number) => {
    setAt(i)
    setEvLine(null)
    setUi((u) => STEPS[i].ui(u))
    setNet((n) => [...n, ...STEPS[i].net])
  }
  const reset = () => {
    seq.stop()
    setAt(-1)
    setUi({ status: 'Not started', people: [], live: false })
    setNet([])
    setOnline(true)
    setEvLine(null)
  }
  const runAll = () => {
    reset()
    seq.run(STEPS.map((_, i) => () => apply(i)), 1400)
  }

  const join = () => {
    const name = GUESTS.find((g) => !ui.people.includes(g))
    if (!name) return
    setUi((u) => ({ ...u, people: [...u.people, name] }))
    setNet((n) => [...n, { src: 'event', text: `participant.joined  { name: "${name}" }`, tone: 'info' }])
    setEvLine(6)
  }
  const leave = () => {
    const name = ui.people.at(-1)
    if (!name || ui.people.length < 2) return
    setUi((u) => ({ ...u, people: u.people.slice(0, -1) }))
    setNet((n) => [...n, { src: 'event', text: `participant.left  { name: "${name}" }`, tone: 'info' }])
    setEvLine(7)
  }
  const drop = () => {
    setOnline(false)
    setNet((n) => [...n, { src: 'sdk', text: 'connection lost, retrying in 1s', tone: 'warn' }])
    seq.run(
      [
        () => {},
        () => {
          setOnline(true)
          setNet((n) => [
            ...n,
            { src: 'sdk', text: 'WSS /v1/events  reconnected, resubscribed', tone: 'ok' },
            { src: 'sdk', text: `GET /v1/sessions/s_4821  200  (state resynced)`, tone: 'ok' },
          ])
        },
      ],
      1200,
    )
  }

  // a joined or left event highlights the handler that ran
  const hot = evLine !== null ? [evLine] : (step?.lines ?? [])
  const full = GUESTS.every((g) => ui.people.includes(g))

  return (
    <div className="demo sdk">
      <p className="demo-lede">
        A reference app integrating the SDK. Run it to see each call highlighted in the code, sent over the network and
        reflected on screen. Then add people to the session as live events.
      </p>
      <div className="sdk-grid">
        <pre className="sdk-code" aria-label="Reference app source" tabIndex={0}>
          {CODE.map((l, i) => (
            <span key={i} className={hot.includes(i) ? 'ln hot' : 'ln'}>
              <i>{i + 1}</i>
              {l || ' '}
              {'\n'}
            </span>
          ))}
        </pre>
        <Frame title="Reference app" url="localhost:5173/room" className="sdk-app">
          <p className="sdk-status">
            <span className={online && ui.live ? 'dot-live on' : 'dot-live'} aria-hidden="true" />
            {online ? ui.status : 'Reconnecting'}
            {ui.user && <span className="sdk-user">{ui.user}</span>}
          </p>
          {ui.room ? (
            <>
              <h4>{ui.room}</h4>
              <ul className="sdk-people">
                {ui.people.map((p) => (
                  <li key={p}>
                    <span aria-hidden="true">{p[0]}</span>
                    {p}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="sdk-empty">No session yet</p>
          )}
        </Frame>
      </div>
      <p className="sdk-say" aria-live="polite">{evLine !== null ? 'Handled by the event listener, no refetch.' : step ? step.say : 'Press run to start the app.'}</p>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={runAll} disabled={seq.running}>
          {at < 0 ? 'Run the app' : 'Run it again'}
        </button>
        <button type="button" onClick={() => !done && apply(at + 1)} disabled={seq.running || done}>
          Next line
        </button>
        <button type="button" onClick={join} disabled={!done || !online || full}>
          Someone joins
        </button>
        <button type="button" onClick={leave} disabled={!done || !online || ui.people.length < 2}>
          Someone leaves
        </button>
        <button type="button" onClick={drop} disabled={!done || !online}>
          Drop the connection
        </button>
        <button type="button" onClick={reset}>Reset</button>
      </div>
      <Log title="Network" lines={net} empty="No requests yet" />
      <p className="demo-note">SDK method names are simplified for the demo.</p>
    </div>
  )
}
