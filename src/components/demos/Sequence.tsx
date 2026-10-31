import { useState } from 'react'
import { useSequence } from '../sim/useSequence'
import { LANE_NAME, LANES, messages, type Opts } from './sequence'

const COL = 150
const ROW = 30

// Step through one run. Break the token or the mail login and run it again.
export default function Sequence() {
  const [opts, setOpts] = useState<Opts>({ token: true, email: true, smtpAuth: true })
  const [shown, setShown] = useState(0)
  const seq = useSequence()
  const msgs = messages(opts)
  const lx = (l: (typeof LANES)[number]) => 80 + LANES.indexOf(l) * COL
  const H = 60 + msgs.length * ROW

  const run = () => {
    setShown(0)
    seq.run(msgs.map((_, i) => () => setShown(i + 1)), 360)
  }
  const flip = (k: keyof Opts) => {
    seq.stop()
    setShown(0)
    setOpts((o) => ({ ...o, [k]: !o[k] }))
  }

  return (
    <div className="demo seqd">
      <div className="demo-actions checks">
        <label className="demo-inline"><input type="checkbox" checked={opts.token} onChange={() => flip('token')} />Token valid</label>
        <label className="demo-inline"><input type="checkbox" checked={opts.email} onChange={() => flip('email')} />SEND_EMAIL_NOTIFICATION</label>
        <label className="demo-inline"><input type="checkbox" checked={opts.smtpAuth} onChange={() => flip('smtpAuth')} disabled={!opts.email} />SMTP password right</label>
        <button type="button" className="demo-primary" onClick={run} disabled={seq.running}>Run</button>
      </div>
      <div className="seq-scroll">
        <svg className="seq" viewBox={`0 0 ${80 + COL * 3 + 80} ${H}`} role="img" aria-label="Messages in one run">
          <defs>
            <marker id="seq-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="arrowhead" />
            </marker>
          </defs>
          {LANES.map((l) => (
            <g key={l}>
              <rect className="lane-head" x={lx(l) - 66} y={4} width={132} height={26} />
              <text className="lane-name" x={lx(l)} y={21} textAnchor="middle">{LANE_NAME[l]}</text>
              <line className="life" x1={lx(l)} x2={lx(l)} y1={30} y2={H - 4} />
            </g>
          ))}
          {msgs.slice(0, shown).map((m, i) => {
            const y = 50 + i * ROW
            const tone = m.tone ?? ''
            if (m.from === m.to)
              return (
                <g key={i} className={`msg ${tone}`}>
                  <path d={`M${lx(m.from)},${y - 8} h18 v12 h-16`} markerEnd="url(#seq-arrow)" />
                  <text x={lx(m.from) + 26} y={y}>{m.text}</text>
                </g>
              )
            const x1 = lx(m.from)
            const x2 = lx(m.to)
            return (
              <g key={i} className={`msg ${tone}`}>
                <line x1={x1} x2={x2 + (x2 > x1 ? -2 : 2)} y1={y} y2={y} markerEnd="url(#seq-arrow)" />
                <text x={(x1 + x2) / 2} y={y - 5} textAnchor="middle">{m.text}</text>
              </g>
            )
          })}
        </svg>
      </div>
      {shown === msgs.length && shown > 0 && (
        <p className={`net-verdict ${opts.token ? 'ok' : 'bad'}`}>
          {opts.token ? 'Build queued in the target repo' : 'Nothing queued, and the step still exits 0'}
          {opts.email && (opts.smtpAuth ? ', email sent' : ', mail failed and was only logged')}
        </p>
      )}
    </div>
  )
}
