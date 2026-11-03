import type { Visual } from './content'

// Small pictures that open under a step on the event slides. Each
// one is drawn from a plain spec in content.ts, so a new one is a few lines
// there, not new code here.

type Of<K extends Visual['kind']> = Extract<Visual, { kind: K }>

const fmt = (n: number) => n.toLocaleString('en-CA')

// split a label into lines of about `max` characters
const wrap = (text: string, max: number) =>
  text.split(' ').reduce<string[]>((lines, word) => {
    const last = lines[lines.length - 1]
    if (last && (last + ' ' + word).length <= max) lines[lines.length - 1] = `${last} ${word}`
    else lines.push(word)
    return lines
  }, [])

/* A table. One column can carry a small bar under its numbers. */
function Table({ v }: { v: Of<'table'> }) {
  const barCol = v.bars
  const hi = barCol === undefined ? 0 : Math.max(...v.rows.map((r) => Number(r[barCol]) || 0))
  return (
    <div className="vz-table-wrap">
      <table className="vz-table">
        <thead>
          <tr>{v.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
        </thead>
        <tbody>
          {v.rows.map((r, i) => (
            <tr key={i} style={{ animationDelay: `${i * 30}ms` }}>
              {r.map((c, j) => {
                if (j === 0) return <th key={j} scope="row">{c}</th>
                const text = typeof c === 'number' ? fmt(c) : c
                if (j !== barCol) return <td key={j}>{text}</td>
                return (
                  <td key={j} className="vz-barcell">
                    <span className="vz-track"><i style={{ width: `${(Number(c) / hi) * 100}%` }} /></span>
                    {text}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      {v.caption && <p className="vz-caption">{v.caption}</p>}
    </div>
  )
}

/* Two lines over the same weeks, with notes on the points that differ. */
function Lines({ v }: { v: Of<'lines'> }) {
  const W = 600, H = 290, L = 52, R = 16, T = 48, B = 34
  const all = v.series.flatMap((s) => s.values)
  const lo = Math.min(...all) * 0.9, hi = Math.max(...all) * 1.05
  const X = (i: number) => L + ((W - L - R) * i) / (v.labels.length - 1)
  const Y = (n: number) => T + (H - T - B) * (1 - (n - lo) / (hi - lo))
  const raw = v.series.find((s) => s.tone === 'muted') ?? v.series[0]
  const clean = v.series.find((s) => s.tone === 'accent')
  return (
    <svg className="vz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={v.alt}>
      {[lo, (lo + hi) / 2, hi].map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} className="vz-grid" />
          <text x={L - 8} y={Y(t) + 4} className="vz-axis" textAnchor="end">{Math.round(t / 1000)}K</text>
        </g>
      ))}
      {v.labels.map((l, i) => i % 2 === 0 && <text key={l} x={X(i)} y={H - 10} className="vz-axis" textAnchor="middle">{l}</text>)}
      {v.series.map((s) => (
        <polyline key={s.name} pathLength={1} className={`vz-line ${s.tone}`} points={s.values.map((n, i) => `${X(i)},${Y(n)}`).join(' ')} />
      ))}
      {v.marks?.map((m) => {
        const x = X(m.at), y = Y(raw.values[m.at]), y2 = clean ? Y(clean.values[m.at]) : y
        const below = y > y2
        const anchor = m.at > v.labels.length * 0.7 ? 'end' : m.at < v.labels.length * 0.3 ? 'start' : 'middle'
        const dx = anchor === 'end' ? -10 : anchor === 'start' ? 10 : 0
        return (
          <g key={m.at} className="vz-mark">
            <line x1={x} x2={x} y1={y} y2={y2} className="vz-fix" />
            <circle cx={x} cy={y} r="5" />
            <text x={x + dx} y={below ? y + 24 : y - 14} textAnchor={anchor}>{m.text}</text>
          </g>
        )
      })}
      <g className="vz-legend">
        {v.series.map((s, i) => (
          <g key={s.name} transform={`translate(${L + i * 150}, 14)`}>
            <line x1="0" x2="20" y1="0" y2="0" className={`vz-line ${s.tone} still`} />
            <text x="28" y="4">{s.name}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

/* Inputs on the left, one box in the middle, outputs on the right. */
function Flow({ v }: { v: Of<'flow'> }) {
  const W = 640, colW = 176, nodeH = 52, gap = 14
  const H = Math.max(v.inputs.length, v.outputs.length, 1) * (nodeH + gap) + 20
  const ys = (n: number) => Array.from({ length: n }, (_, i) => (H - n * nodeH - (n - 1) * gap) / 2 + i * (nodeH + gap))
  const xs = [0, (W - colW) / 2, W - colW]
  const cy = H / 2
  const curve = (x1: number, y1: number, x2: number, y2: number) => `M${x1},${y1} C${x1 + 50},${y1} ${x2 - 50},${y2} ${x2},${y2}`
  const node = (label: string, x: number, y: number, key: string, strong = false) => (
    <g key={key} className={`vz-node${strong ? ' strong' : ''}`}>
      <rect x={x} y={y} width={colW} height={nodeH} rx="8" />
      {wrap(label, 20).map((ln, i, a) => (
        <text key={i} x={x + colW / 2} y={y + nodeH / 2 + 5 + (i - (a.length - 1) / 2) * 17} textAnchor="middle">{ln}</text>
      ))}
    </g>
  )
  return (
    <svg className="vz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={v.alt}>
      {ys(v.inputs.length).map((y, i) => <path key={`a${i}`} className="vz-edge" d={curve(xs[0] + colW, y + nodeH / 2, xs[1], cy)} />)}
      {ys(v.outputs.length).map((y, i) => <path key={`b${i}`} className="vz-edge" d={curve(xs[1] + colW, cy, xs[2], y + nodeH / 2)} />)}
      {ys(v.inputs.length).map((y, i) => node(v.inputs[i], xs[0], y, `i${i}`))}
      {node(v.center, xs[1], cy - nodeH / 2, 'c', true)}
      {ys(v.outputs.length).map((y, i) => node(v.outputs[i], xs[2], y, `o${i}`))}
    </svg>
  )
}

export default function VisualView({ v }: { v: Visual }) {
  switch (v.kind) {
    case 'table': return <Table v={v} />
    case 'lines': return <Lines v={v} />
    case 'flow': return <Flow v={v} />
  }
}
