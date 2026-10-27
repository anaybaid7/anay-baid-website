import type { ReactElement } from 'react'
import type { Visual, WireItem } from './content'

// Small pictures that open under a step or a point on the event slides. Each
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

/* Bars with their value on top and, given a total, what that share works out to. */
function Bars({ v }: { v: Of<'bars'> }) {
  const W = 600, H = 280, T = 34, B = v.total ? 54 : 34
  const hi = Math.max(...v.values)
  const step = W / v.labels.length
  const bw = step * 0.56
  return (
    <svg className="vz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={v.alt}>
      {v.values.map((n, i) => {
        const x = step * (i + 0.22)
        const h = Math.max(((H - T - B) * n) / hi, 2)
        const y = H - B - h
        return (
          <g key={v.labels[i]} className={v.accent?.includes(i) ? 'vz-bar accent' : 'vz-bar'}>
            <rect x={x} y={y} width={bw} height={h} rx="3" style={{ animationDelay: `${i * 40}ms` }} />
            <text x={x + bw / 2} y={y - 8} textAnchor="middle" className="vz-val">{n}{v.unit}</text>
            <text x={x + bw / 2} y={H - B + 22} textAnchor="middle" className="vz-axis strong">{v.labels[i]}</text>
            {v.total && <text x={x + bw / 2} y={H - B + 42} textAnchor="middle" className="vz-axis">{fmt(Math.round((v.total * n) / 100))}</text>}
          </g>
        )
      })}
      <line x1="0" x2={W} y1={H - B} y2={H - B} className="vz-grid" />
    </svg>
  )
}

/* A plain wireframe: boxes, fields, buttons and placeholder charts. */
function Glyph({ it }: { it: WireItem }) {
  const { x, y, w = 0, h = 0 } = it
  const pad = 10, iw = w - pad * 2, ih = h - pad * 2
  if (it.chart === 'line') {
    const pts = [0.6, 0.45, 0.55, 0.3, 0.5, 0.35, 0.2, 0.4, 0.15].map((p, i, a) => `${x + pad + (iw * i) / (a.length - 1)},${y + pad + ih * p}`)
    return <polyline className="wf-ink accent" points={pts.join(' ')} />
  }
  if (it.chart === 'bars') {
    const hs = [0.55, 0.7, 0.62, 0.8, 0.66, 0.74, 0.58, 0.85, 0.7, 0.77]
    const bw = iw / hs.length
    return <>{hs.map((p, i) => <rect key={i} className="wf-fill accent" x={x + pad + bw * i + bw * 0.15} y={y + pad + ih * (1 - p)} width={bw * 0.7} height={ih * p} />)}</>
  }
  if (it.chart === 'donut') {
    const r = Math.min(iw, ih) / 2 - 4
    return <circle className="wf-ink accent thick" cx={x + w / 2} cy={y + h / 2} r={r} strokeDasharray={`${r * 4.2} ${r * 2.1}`} />
  }
  if (it.chart === 'rows') {
    const n = Math.max(2, Math.floor(ih / 16))
    return <>{Array.from({ length: n }, (_, i) => <rect key={i} className="wf-fill" x={x + pad} y={y + pad + i * 16} width={iw * (i % 3 === 0 ? 0.9 : 0.7)} height={6} rx={3} />)}</>
  }
  return null
}

function Wireframe({ v }: { v: Of<'wireframe'> }) {
  const draw = (it: WireItem, i: number): ReactElement => {
    const { x, y, w = 0, h = 0, label } = it
    const cls = ['wf', it.type, it.strong ? 'strong' : '', it.faint ? 'faint' : '', it.size === 'lg' ? 'lg' : ''].filter(Boolean).join(' ')
    switch (it.type) {
      case 'mark':
        return <rect key={i} className="wf-mark" x={x} y={y} width={w} height={h} rx="4" />
      case 'line':
        return <line key={i} className="wf-rule" x1={x} y1={y} x2={x + w} y2={y + h} />
      case 'text':
        return <text key={i} className={cls} x={x} y={y} textAnchor={it.align === 'end' ? 'end' : 'start'}>{label}</text>
      case 'bar':
        return <rect key={i} className="wf-fill" x={x} y={y} width={w} height={h || 8} rx="4" />
      default:
        return (
          <g key={i} className={cls}>
            <rect x={x} y={y} width={w} height={h} rx={it.type === 'box' ? 8 : 6} />
            {it.chart && <Glyph it={it} />}
            {it.type === 'select' && <path className="wf-chev" d={`M${x + w - 22},${y + h / 2 - 3} l6,6 l6,-6`} />}
            {label && it.type === 'box' && <text className="wf title" x={x + 12} y={y + 22}>{label}</text>}
            {label && it.type !== 'box' && (
              <text x={it.type === 'button' ? x + w / 2 : x + 12} y={y + h / 2 + 5} textAnchor={it.type === 'button' ? 'middle' : 'start'}>{label}</text>
            )}
          </g>
        )
    }
  }
  return (
    <svg className="vz-svg vz-wire" viewBox={`0 0 ${v.w} ${v.h}`} role="img" aria-label={v.alt}>
      {v.items.map(draw)}
    </svg>
  )
}

export default function VisualView({ v }: { v: Visual }) {
  switch (v.kind) {
    case 'table': return <Table v={v} />
    case 'lines': return <Lines v={v} />
    case 'flow': return <Flow v={v} />
    case 'bars': return <Bars v={v} />
    case 'wireframe': return <Wireframe v={v} />
    case 'image': return <img className="vz-img" src={v.src} alt={v.alt} />
  }
}
