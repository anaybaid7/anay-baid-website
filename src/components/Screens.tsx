import { useState } from 'react'
import { slides } from '../event/content'
import type { ScreenKind } from '../details'

// The forecast tool screens from the event page, mock data, with the same
// numbered call-outs. Pick a call-out to outline that part and read about it.
function ForecastTool() {
  const shots = slides.filter((s) => s.image && s.spots?.length)
  const [at, setAt] = useState(0)
  const [spot, setSpot] = useState(0)
  const shot = shots[at]
  const active = shot.spots![spot]
  return (
    <div className="shots">
      <div className="shot-tabs" role="tablist" aria-label="Screens">
        {shots.map((s, i) => (
          <button
            key={s.image}
            type="button"
            role="tab"
            aria-selected={i === at}
            className={i === at ? 'on' : ''}
            onClick={() => {
              setAt(i)
              setSpot(0)
            }}
          >
            {s.title}
          </button>
        ))}
      </div>
      <div className="shot">
        <img src={shot.image} alt={`${shot.title}, a screen with mock data`} loading="lazy" />
        {shot.spots!.map((s, i) => (
          <button
            key={s.title}
            type="button"
            className={i === spot ? 'spot on' : 'spot'}
            style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`, height: `${s.h * 100}%` }}
            aria-label={`${i + 1}, ${s.title}`}
            aria-pressed={i === spot}
            onClick={() => setSpot(i)}
          >
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
      <p className="shot-note" aria-live="polite">
        <b>{active.title}</b> {active.text}
      </p>
      <p className="metrics-note">Mock data. These are the screens from my intern event talk.</p>
    </div>
  )
}

// a low-fidelity layout of the review dashboard, with made-up rows
function InsightVaultWire() {
  const rows = [
    ['TX-10482', '$4,980', '2', 0.91],
    ['TX-10477', '$1,210', '1', 0.64],
    ['TX-10463', '$86', '0', 0.12],
    ['TX-10458', '$2,450', '1', 0.73],
  ] as const
  return (
    <div className="wire">
      <div className="wire-bar"><i /><i /><i /><span>Fraud alerts</span></div>
      <div className="wire-body iv">
        <table className="wire-table">
          <thead>
            <tr><th>Transaction</th><th>Amount</th><th>Rules fired</th><th>Model</th></tr>
          </thead>
          <tbody>
            {rows.map(([id, amt, rules, score], i) => (
              <tr key={id} className={i === 0 ? 'on' : ''}>
                <td>{id}</td><td>{amt}</td><td>{rules}</td>
                <td><span className="wire-score"><span style={{ width: `${score * 100}%` }} /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
        <aside className="wire-side">
          <p className="wire-h">TX-10482</p>
          <p className="wire-k">Rules fired</p>
          <p>2</p>
          <p className="wire-k">Model score</p>
          <p>0.91</p>
          <p className="wire-actions"><span>Escalate</span><span>Clear</span></p>
        </aside>
      </div>
      <p className="metrics-note">Wireframe with made-up rows, showing the layout of the review dashboard.</p>
    </div>
  )
}

// the extension's popup over the StarRez page, low fidelity
function StarRezWire() {
  return (
    <div className="wire">
      <div className="wire-bar"><i /><i /><i /><span>StarRez</span></div>
      <div className="wire-body sr">
        <div className="wire-page">
          <span className="wire-line w60" />
          <span className="wire-line w40" />
          <span className="wire-block" />
          <span className="wire-line w80" />
          <span className="wire-line w50" />
        </div>
        <div className="wire-popup">
          <p className="wire-h">Log a task</p>
          <span className="wire-btn on">Package pickup</span>
          <span className="wire-btn">Package label</span>
          <span className="wire-btn">Key lockout</span>
          <p className="wire-k">Read from the page</p>
          <span className="wire-line w80" />
          <span className="wire-line w60" />
          <span className="wire-btn primary">Log it</span>
        </div>
      </div>
      <p className="metrics-note">Wireframe of the extension over a StarRez page. The tasks are the ones in the repo.</p>
    </div>
  )
}

export default function Screens({ kind }: { kind: ScreenKind }) {
  if (kind === 'forecast-tool') return <ForecastTool />
  if (kind === 'insightvault') return <InsightVaultWire />
  return <StarRezWire />
}
