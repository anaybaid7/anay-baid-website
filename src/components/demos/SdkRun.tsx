import { useState } from 'react'
import { initialHost, onEvent, type HostState, type WidgetEvent } from './callbridge'
import { Frame } from '../sim/Frame'
import { Log, type LogLine } from '../sim/Log'
import { useSequence } from '../sim/useSequence'

const CODE = [
  "import { Meeting } from '@iotum/callbridge-js'",
  '',
  'const meeting = new Meeting(',
  "  { domain, sso: { token, hostId }, container: '#meeting' },",
  '  accessCode,',
  '  { skipJoin: true },',
  ')',
  "meeting.on('room.READY', () => setReady(true))",
  "meeting.on('participant.CHANGE', updatePeople)",
  "meeting.on('conference.SPEAKER', ({ speakerId }) => highlight(speakerId))",
  "meeting.on('widget.STORAGE_ACCESS_REQUIRED', showWidget)",
  "meeting.on('widget.ERROR', showError)",
  '',
  'return () => meeting.unload()',
]

// which code line handles each event
const LINE: Partial<Record<WidgetEvent['type'], number>> = {
  'room.READY': 7,
  'participant.CHANGE': 8,
  'conference.SPEAKER': 9,
  'widget.STORAGE_ACCESS_REQUIRED': 10,
  'widget.STORAGE_ACCESS_GRANTED': 10,
  'widget.ERROR': 11,
  'conference.CONFERENCE_CALL_EXIT': 13,
}

const GUESTS = ['Priya', 'Marco', 'Lena', 'Kofi']
const payload = (e: WidgetEvent) => {
  const { type, ...rest } = e
  return Object.keys(rest).length ? `${type} ${JSON.stringify(rest)}` : type
}

// A host page embedding the Iotum meeting widget. Join a room, bring people
// in and out, switch speakers, and hit the two failure cases the SDK
// documents: Safari blocking the widget's cookie, and an error loading it.
export default function SdkRun() {
  const [s, setS] = useState<HostState>(initialHost)
  const [log, setLog] = useState<LogLine[]>([])
  const [hot, setHot] = useState<number[]>([])
  const [safari, setSafari] = useState(false)
  const seq = useSequence()
  const nextId = s.people.reduce((m, p) => Math.max(m, p.id), 100) + 1

  const emit = (e: WidgetEvent) => {
    setS((x) => onEvent(x, e))
    setLog((l) => [...l, { src: 'widget', text: payload(e), tone: e.type === 'widget.ERROR' ? 'err' : e.type.startsWith('widget.STORAGE') ? 'warn' : undefined } as LogLine].slice(-40))
    setHot(LINE[e.type] !== undefined ? [LINE[e.type]!] : [])
  }
  const host = (text: string, lines: number[]) => {
    setLog((l) => [...l, { src: 'host', text }].slice(-40))
    setHot(lines)
  }

  const join = (bad = false) => {
    setS(initialHost)
    setLog([])
    const steps: (() => void)[] = [
      () => host('POST /api/sso-token → { token, hostId } from your backend', []),
      () => host("new Meeting({ domain: 'acme.callbridge.com', sso, container }, '1234567', { skipJoin: true })", [2, 3, 4, 5, 6]),
      () => emit({ type: 'widget.LOAD' }),
    ]
    if (bad) steps.push(() => emit({ type: 'widget.ERROR', message: 'access code 1234567 not found' }))
    else if (safari) steps.push(() => emit({ type: 'widget.STORAGE_ACCESS_REQUIRED', step: 'request' }))
    else
      steps.push(
        () => emit({ type: 'room.READY' }),
        () => emit({ type: 'participant.CHANGE', id: 101, name: 'Anay', isCurrent: true, isMuted: false, isLeft: false }),
        () => emit({ type: 'participant.CHANGE', id: 102, name: 'Jordan', isCurrent: false, isMuted: true, isLeft: false }),
        () => emit({ type: 'conference.SPEAKER', speakerId: 101 }),
      )
    seq.run(steps, 650)
  }

  const grant = () =>
    seq.run(
      [
        () => host('user clicks inside the widget, browser grants access', [10]),
        () => emit({ type: 'widget.STORAGE_ACCESS_GRANTED' }),
        () => emit({ type: 'room.READY' }),
        () => emit({ type: 'participant.CHANGE', id: 101, name: 'Anay', isCurrent: true, isMuted: false, isLeft: false }),
      ],
      600,
    )

  const add = () => {
    const name = GUESTS.find((g) => !s.people.some((p) => p.name === g))
    if (name) emit({ type: 'participant.CHANGE', id: nextId, name, isCurrent: false, isMuted: false, isLeft: false })
  }
  const remove = () => {
    const p = [...s.people].reverse().find((x) => !x.isCurrent)
    if (p) emit({ type: 'participant.CHANGE', id: p.id, name: p.name, isCurrent: false, isMuted: p.isMuted, isLeft: true })
  }
  const speak = () => {
    const ids = s.people.map((p) => p.id)
    if (ids.length) emit({ type: 'conference.SPEAKER', speakerId: ids[(ids.indexOf(s.speaker ?? -1) + 1) % ids.length] })
  }
  const message = () => emit({ type: 'dashboard.UNREAD_MESSAGES', rooms: { general: s.unread + 1, design: 1 } })
  const leave = () => {
    emit({ type: 'conference.CONFERENCE_CALL_EXIT' })
    host('meeting.unload()', [13])
  }

  const ready = s.status === 'ready'
  const busy = seq.running

  return (
    <div className="demo sdk">
      <p className="demo-hint">Join, then bring people in. Try Safari mode.</p>
      <div className="sdk-grid">
        <pre className="sdk-code" aria-label="Host page source" tabIndex={0}>
          {CODE.map((l, i) => (
            <span key={i} className={hot.includes(i) ? 'ln hot' : 'ln'}>
              <i>{i + 1}</i>
              {l || ' '}
              {'\n'}
            </span>
          ))}
        </pre>
        <Frame title="Host app" url="app.acme.com/meet" className="sdk-app">
          <div className="host-bar">
            <b>Acme Clinic</b>
            <span>Meet</span>
            <span className="host-chat">
              Team chat {s.unread > 0 && <em aria-label={`${s.unread} unread`}>{s.unread}</em>}
            </span>
          </div>
          <div className={`room st-${s.status}`}>
            {s.status === 'idle' && <p className="room-msg">Enter access code 1234567</p>}
            {s.status === 'loading' && <p className="room-msg">Loading the meeting widget…</p>}
            {s.status === 'needs-access' && (
              <div className="room-msg">
                <p>Allow the meeting to use cookies</p>
                <button type="button" className="demo-primary" onClick={grant} disabled={busy}>Allow</button>
              </div>
            )}
            {s.status === 'error' && <p className="room-msg bad">{s.error}</p>}
            {s.status === 'left' && <p className="room-msg">You left the meeting</p>}
            {ready && (
              <div className="tiles-grid" data-n={Math.min(s.people.length, 4)}>
                {s.people.map((p) => (
                  <div key={p.id} className={['tile', p.id === s.speaker ? 'speaking' : '', p.isMuted ? 'muted' : ''].join(' ')}>
                    <span className="tile-face">{p.name[0]}</span>
                    <span className="tile-name">{p.name}{p.isCurrent && ' (you)'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Frame>
      </div>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={() => join()} disabled={busy}>{s.status === 'idle' ? 'Join' : 'Rejoin'}</button>
        <label className="demo-check">
          <input type="checkbox" checked={safari} onChange={(e) => setSafari(e.target.checked)} disabled={busy} /> Safari, cookies blocked
        </label>
        <button type="button" onClick={add} disabled={!ready || busy || s.people.length > GUESTS.length}>Someone joins</button>
        <button type="button" onClick={remove} disabled={!ready || busy || s.people.length < 2}>Someone leaves</button>
        <button type="button" onClick={speak} disabled={!ready || busy}>Next speaker</button>
        <button type="button" onClick={message} disabled={busy}>Chat message</button>
        <button type="button" onClick={leave} disabled={!ready || busy}>Leave</button>
        <button type="button" onClick={() => join(true)} disabled={busy}>Wrong code</button>
      </div>
      <Log title="Widget events" lines={log} empty="Press Join" />
    </div>
  )
}
