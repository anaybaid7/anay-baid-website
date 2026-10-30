import { useState } from 'react'
import { findRoom, keyCodes, labelEntry, lockoutEntry, packageEntry, readStudent } from './starrez'
import { Frame } from '../sim/Frame'
import { Log, type LogLine } from '../sim/Log'
import { useSequence } from '../sim/useSequence'

const STAFF = 'Baid, Anay'
const RESIDENTS = [
  { name: 'Lee, Sam', id: '20871234', entry: '48213', room: 'V1S-305a', parcels: 2, keys: 'Bedroom: 4F21A\nLOANER L-1: L0932' },
  { name: 'Shah, Priya', id: '20895511', entry: '48377', room: 'MKV-4-112b', parcels: 1, keys: 'Bedroom: 7K30C' },
]

type Kind = 'package' | 'lockout' | 'label'
interface Entry {
  kind: Kind
  text: string
  at: Date
}

// A StarRez profile with the extension running on it. The buttons it adds
// sit next to the parts of the page staff already use. Each click reads the
// page, validates, formats and copies, and the popup keeps the shift's log.
export default function Extension() {
  const [who, setWho] = useState(0)
  const [noKeys, setNoKeys] = useState(false)
  const [injected, setInjected] = useState(true)
  const [reading, setReading] = useState<string | null>(null)
  const [copied, setCopied] = useState<Kind | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [asking, setAsking] = useState(false)
  const [reason, setReason] = useState('locked out after class')
  const [entries, setEntries] = useState<Entry[]>([])
  const [log, setLog] = useState<LogLine[]>([{ src: 'content', text: 'profile loaded, 4 buttons injected' }])
  const [filter, setFilter] = useState<'all' | Kind>('all')
  const seq = useSequence()
  const r = RESIDENTS[who]
  const keys = noKeys ? '' : r.keys

  // the text the content script sees, the same shape as the real page
  const pageText = `EntryID: ${r.entry}\nStudent Number ${r.id}\nRez 360\nRoom Space ${r.room}\n${r.parcels} Parcels`
  const say = (...l: LogLine[]) => setLog((x) => [...x, ...l].slice(-40))

  const run = (kind: Kind, extra?: string) => {
    const s = readStudent(r.name, pageText)
    const room = findRoom(pageText)
    const now = new Date(2026, 1, 18, 15, 42)
    const steps: (() => void)[] = [
      () => {
        setReading('name')
        say({ src: 'read', text: `breadcrumb → "${r.name}"` })
      },
      () => {
        setReading('id')
        say({ src: 'read', text: `/Student Number\\s+(\\d{8})/ → ${r.id}` })
      },
      () => {
        setReading('room')
        say({ src: 'read', text: `room, try ${room?.method} of 3 matched → ${room?.room}` })
      },
    ]
    if (kind === 'lockout') {
      steps.push(() => {
        setReading('keys')
        const codes = s && keyCodes(keys, s.studentNumber)
        say(codes ? { src: 'read', text: `Keys card → ${codes.join(', ')}${/LOANER/.test(keys) ? ' (loaner first)' : ''}` } : { src: 'read', text: 'No loaner keys found, no entry made', tone: 'warn' })
      })
    }
    steps.push(() => {
      setReading(null)
      const codes = s && keyCodes(keys, s.studentNumber)
      if (!s || (kind === 'lockout' && !codes)) return
      const text =
        kind === 'package' ? packageEntry(s, r.parcels, STAFF, now) : kind === 'label' ? labelEntry(s, STAFF, now) : lockoutEntry(s, codes!, extra ?? '', STAFF)
      say({ src: 'format', text: text.split('\n').join(' / '), tone: 'ok' }, { src: 'clipboard', text: 'copied, preview shown for 4s' })
      setEntries((e) => [{ kind, text, at: now }, ...e])
      setCopied(kind)
      setPreview(text)
    })
    steps.push(() => setCopied(null))
    seq.run(steps, 380)
  }

  const nextResident = () => {
    const to = (who + 1) % RESIDENTS.length
    seq.run(
      [
        () => {
          setInjected(false)
          setPreview(null)
          say({ src: 'observer', text: 'DOM changed, waiting 500 ms for it to settle' })
        },
        () => {
          setWho(to)
          say({ src: 'observer', text: `breadcrumb changed → "${RESIDENTS[to].name}", removing old buttons` })
        },
        () => say({ src: 'content', text: 'waiting for EntryID: on the page' }),
        () => {
          setInjected(true)
          say({ src: 'content', text: '4 buttons injected for the new profile', tone: 'ok' })
        },
      ],
      450,
    )
  }

  const btn = (kind: Kind, label: string, onClick: () => void) =>
    injected && (
      <button type="button" className={`sr-inj ${copied === kind ? 'done' : ''}`} onClick={onClick} disabled={seq.running}>
        {copied === kind ? 'Copied!' : label}
      </button>
    )

  const count = (k: Kind) => entries.filter((e) => e.kind === k).length
  const shown = entries.filter((e) => filter === 'all' || e.kind === filter)

  return (
    <div className="demo ext">
      <p className="demo-hint">Click an outlined button.</p>
      <div className="ext-grid">
        <Frame title="StarRez" url="uwaterloo.starrezhousing.com/StarRezWeb/main/directory" className="sr-mock">
          <p className={`sr-crumb ${reading === 'name' ? 'reading' : ''}`}>
            Dashboard › Desk › <b>{r.name}</b>
          </p>
          <div className="sr-cols">
            <div className="sr-main">
              <dl>
                <div><dt>EntryID:</dt><dd>{r.entry}</dd></div>
                <div className={reading === 'id' ? 'reading' : ''}><dt>Student Number</dt><dd>{r.id}</dd></div>
                <div className={reading === 'room' ? 'reading' : ''}><dt>Room Space</dt><dd>{r.room}</dd></div>
              </dl>
              <p className="sr-row">
                <span className="sr-native">{r.parcels} Parcels</span>
                {btn('package', `Copy ${r.parcels} pkg${r.parcels > 1 ? 's' : ''}`, () => run('package'))}
              </p>
              <p className="sr-row">
                <span className="sr-native">Entry Actions</span>
                {btn('label', 'Print Label', () => run('label'))}
              </p>
            </div>
            <aside className={`sr-keys ${reading === 'keys' ? 'reading' : ''}`}>
              <p className="sr-h">Rez 360</p>
              <p className="sr-k">KEYS</p>
              <pre>{keys || 'No keys on file'}</pre>
              {btn('lockout', 'Copy Lockout', () => setAsking(true))}
            </aside>
          </div>
          {asking && (
            <div className="sr-modal" role="dialog" aria-label="Lockout reason">
              <p>Reason for lockout</p>
              <input value={reason} onChange={(e) => setReason(e.target.value)} aria-label="Reason" />
              <p className="demo-actions">
                <button type="button" onClick={() => setAsking(false)}>Cancel</button>
                <button
                  type="button"
                  className="demo-primary"
                  onClick={() => {
                    setAsking(false)
                    run('lockout', reason.trim() || 'no reason given')
                  }}
                >
                  Copy entry
                </button>
              </p>
            </div>
          )}
          {preview && (
            <div className="sr-toast" aria-live="polite">
              <small>Logged by: {STAFF}</small>
              <pre>{preview}</pre>
            </div>
          )}
        </Frame>

        <div className="sr-popup">
          <p className="sr-pop-head">StarRez Logger, activity</p>
          <div className="sr-counts">
            <div><b>{count('package')}</b>Packages</div>
            <div><b>{count('lockout')}</b>Lockouts</div>
            <div><b>{count('label')}</b>Labels</div>
            <div><b>{entries.length}</b>Total</div>
          </div>
          <div className="sr-filters" role="radiogroup" aria-label="Filter">
            {(['all', 'package', 'lockout', 'label'] as const).map((f) => (
              <button key={f} type="button" role="radio" aria-checked={filter === f} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f[0].toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
          <ul className="sr-list">
            {shown.length === 0 && <li className="none">No entries this shift yet</li>}
            {shown.map((e, i) => (
              <li key={i}>
                <span className={`sr-type t-${e.kind}`}>{e.kind}</span>
                <code>{e.text.split('\n').join(' / ')}</code>
              </li>
            ))}
          </ul>
          <p className="sr-saved">
            {entries.length > 0
              ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} in one click each. By hand, each takes about 20 seconds of reading and typing.`
              : 'By hand, each entry takes about 20 seconds of reading and typing.'}
          </p>
        </div>
      </div>

      <div className="demo-actions">
        <button type="button" onClick={nextResident} disabled={seq.running}>Open another resident</button>
        <label className="demo-check">
          <input type="checkbox" checked={noKeys} onChange={(e) => setNoKeys(e.target.checked)} /> No keys on file
        </label>
      </div>
      <Log title="Content script" lines={log} />
    </div>
  )
}
