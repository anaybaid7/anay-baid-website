import type { Metric } from '../details'

// Results drawn from the resume figures. "less" shows before as a full bar
// and what's left after; a range like 10-20× faster shows as a band.
function Less({ m }: { m: Extract<Metric, { kind: 'less' }> }) {
  const [lo, hi] = Array.isArray(m.after) ? m.after : [m.after, m.after]
  const range = lo !== hi
  return (
    <div className="metric less">
      <p className="metric-label">
        {m.label} <b>{m.caption}</b>
      </p>
      <div className="bars" role="img" aria-label={`${m.label}, ${m.caption}. Before 100%, after ${range ? `${lo} to ${hi}%` : `${lo}%`}`}>
        <span className="bar-row">
          <span className="bar-name">Before</span>
          <span className="bar-track"><span className="bar before" style={{ width: '100%' }} /></span>
        </span>
        <span className="bar-row">
          <span className="bar-name">After</span>
          <span className="bar-track">
            <span className="bar after" style={{ width: `${lo}%` }} />
            {range && <span className="bar band" style={{ left: `${lo}%`, width: `${hi - lo}%` }} />}
          </span>
        </span>
      </div>
    </div>
  )
}

function Score({ m }: { m: Extract<Metric, { kind: 'score' }> }) {
  const r = 34
  const c = 2 * Math.PI * r
  return (
    <div className="metric score">
      <svg viewBox="0 0 84 84" width="84" height="84" role="img" aria-label={`${m.label} ${m.value}%`}>
        <circle cx="42" cy="42" r={r} className="ring-track" />
        <circle
          cx="42"
          cy="42"
          r={r}
          className="ring"
          strokeDasharray={`${(m.value / 100) * c} ${c}`}
          transform="rotate(-90 42 42)"
        />
        <text x="42" y="47" textAnchor="middle">{m.value}%</text>
      </svg>
      <p className="metric-label">{m.label}</p>
    </div>
  )
}

export default function Metrics({ metrics }: { metrics: Metric[] }) {
  const less = metrics.filter((m) => m.kind === 'less')
  const scores = metrics.filter((m) => m.kind === 'score')
  const figures = metrics.filter((m) => m.kind === 'figure')
  return (
    <div className="metrics">
      {less.map((m) => <Less key={m.label} m={m} />)}
      {scores.length > 0 && <div className="scores">{scores.map((m) => <Score key={m.label} m={m} />)}</div>}
      {figures.length > 0 && (
        <dl className="figures">
          {figures.map((m) => (
            <div key={m.label}>
              <dt>{m.value}</dt>
              <dd>{m.label}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="metrics-note">Every figure here is from my resume.</p>
    </div>
  )
}
