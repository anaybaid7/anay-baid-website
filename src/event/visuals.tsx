import type { ReactElement } from 'react'
import rough from 'roughjs'
import type { Visual, SketchItem } from './content'

// Small pictures that open under a step or a point on the event slides. Each
// one is drawn from a plain spec in content.ts, so a new one is a few lines
// there, not new code here.

const wrap = (text: string, max: number) => {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(' ')) {
    if (line && (line + ' ' + word).length > max) {
      lines.push(line)
      line = word
    } else line = line ? `${line} ${word}` : word
  }
  if (line) lines.push(line)
  return lines
}

function Table({ v }: { v: Extract<Visual, { kind: 'table' }> }) {
  return (
    <div className="vz-table-wrap">
      <table className="vz-table">
        <thead>
          <tr>{v.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
        </thead>
        <tbody>
          {v.rows.map((r, i) => (
            <tr key={i} className={v.highlight?.includes(i) ? 'hl' : ''}>
              {r.map((c, j) => (j === 0 ? <th key={j} scope="row">{c}</th> : <td key={j}>{typeof c === 'number' ? c.toLocaleString('en-CA') : c}</td>))}
            </tr>
          ))}
        </tbody>
      </table>
      {v.caption && <p className="vz-caption">{v.caption}</p>}
    </div>
  )
}

function Lines({ v }: { v: Extract<Visual, { kind: 'lines' }> }) {
  const W = 600, H = 280, L = 52, R = 16, T = 44, B = 34
  const all = v.series.flatMap((s) => s.values)
  const lo = Math.min(...all) * 0.9, hi = Math.max(...all) * 1.05
  const X = (i: number) => L + ((W - L - R) * i) / (v.labels.length - 1)
  const Y = (n: number) => T + (H - T - B) * (1 - (n - lo) / (hi - lo))
  const ticks = [lo, (lo + hi) / 2, hi]
  return (
    <svg className="vz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={v.alt}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={L} x2={W - R} y1={Y(t)} y2={Y(t)} className="vz-grid" />
          <text x={L - 8} y={Y(t) + 4} className="vz-axis" textAnchor="end">{Math.round(t / 1000)}K</text>
        </g>
      ))}
      {v.labels.map((l, i) => (i % 2 === 0 ? <text key={l} x={X(i)} y={H - 10} className="vz-axis" textAnchor="middle">{l}</text> : null))}
      {v.series.map((s) => (
        <polyline key={s.name} className={`vz-line ${s.tone}`} points={s.values.map((n, i) => `${X(i)},${Y(n)}`).join(' ')} />
      ))}
      {v.marks?.map((m) => {
        const raw = v.series.find((x) => x.tone === 'muted') ?? v.series[0]
        const clean = v.series.find((x) => x.tone === 'accent')
        const x = X(m.at), y = Y(raw.values[m.at])
        // the label goes on the side away from the cleaned line
        const below = clean ? raw.values[m.at] < clean.values[m.at] : y < H / 2
        const anchor = m.at > v.labels.length * 0.7 ? 'end' : m.at < v.labels.length * 0.3 ? 'start' : 'middle'
        return (
          <g key={m.at} className="vz-mark">
            <circle cx={x} cy={y} r="5" />
            <text x={x + (anchor === 'end' ? -10 : anchor === 'start' ? 10 : 0)} y={below ? y + 26 : y - 14} textAnchor={anchor}>{m.text}</text>
          </g>
        )
      })}
      <g className="vz-legend">
        {v.series.map((s, i) => (
          <g key={s.name} transform={`translate(${L + i * 150}, 12)`}>
            <line x1="0" x2="20" y1="0" y2="0" className={`vz-line ${s.tone}`} />
            <text x="28" y="4">{s.name}</text>
          </g>
        ))}
      </g>
    </svg>
  )
}

function Flow({ v }: { v: Extract<Visual, { kind: 'flow' }> }) {
  const W = 640, colW = 176, nodeH = 52, gap = 14
  const cols = [v.inputs, [v.center], v.outputs].filter((c) => c.length)
  const H = Math.max(...cols.map((c) => c.length)) * (nodeH + gap) + 20
  const xs = cols.length === 3 ? [0, (W - colW) / 2, W - colW] : [0, W - colW]
  const ys = (n: number) => Array.from({ length: n }, (_, i) => (H - n * nodeH - (n - 1) * gap) / 2 + i * (nodeH + gap))
  const center = cols.length === 3 ? 1 : 0
  const node = (label: string, x: number, y: number, key: string, strong = false) => (
    <g key={key} className={`vz-node${strong ? ' strong' : ''}`}>
      <rect x={x} y={y} width={colW} height={nodeH} rx="8" />
      {wrap(label, 20).map((ln, i, a) => (
        <text key={i} x={x + colW / 2} y={y + nodeH / 2 + 5 + (i - (a.length - 1) / 2) * 17} textAnchor="middle">{ln}</text>
      ))}
    </g>
  )
  const cy = ys(1)[0] + nodeH / 2
  return (
    <svg className="vz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={v.alt}>
      {cols.length === 3 && ys(v.inputs.length).map((y, i) => (
        <path key={`a${i}`} className="vz-edge" d={`M${xs[0] + colW},${y + nodeH / 2} C${xs[0] + colW + 50},${y + nodeH / 2} ${xs[1] - 50},${cy} ${xs[1]},${cy}`} />
      ))}
      {ys(v.outputs.length).map((y, i) => (
        <path key={`b${i}`} className="vz-edge" d={`M${xs[center] + colW},${cy} C${xs[center] + colW + 50},${cy} ${xs[center + 1] - 50},${y + nodeH / 2} ${xs[center + 1]},${y + nodeH / 2}`} />
      ))}
      {cols.length === 3 && ys(v.inputs.length).map((y, i) => node(v.inputs[i], xs[0], y, `i${i}`))}
      {node(v.center, xs[center], ys(1)[0], 'c', true)}
      {ys(v.outputs.length).map((y, i) => node(v.outputs[i], xs[center + 1], y, `o${i}`))}
    </svg>
  )
}

function Bars({ v }: { v: Extract<Visual, { kind: 'bars' }> }) {
  const W = 600, H = 260, T = 30, B = 34
  const hi = Math.max(...v.values)
  const bw = (W / v.labels.length) * 0.56
  return (
    <svg className="vz-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={v.alt}>
      {v.values.map((n, i) => {
        const x = (W / v.labels.length) * (i + 0.22)
        const h = ((H - T - B) * n) / hi
        const y = H - B - h
        return (
          <g key={v.labels[i]} className={v.accent?.includes(i) ? 'vz-bar accent' : 'vz-bar'}>
            <rect x={x} y={y} width={bw} height={Math.max(h, 1.5)} rx="3" />
            <text x={x + bw / 2} y={y - 8} textAnchor="middle" className="vz-val">{n}{v.unit}</text>
            <text x={x + bw / 2} y={H - 12} textAnchor="middle" className="vz-axis">{v.labels[i]}</text>
          </g>
        )
      })}
      <line x1="0" x2={W} y1={H - B} y2={H - B} className="vz-grid" />
    </svg>
  )
}

// hand-drawn wireframe in the style of a Balsamiq mockup
const gen = rough.generator()
const toPaths = (d: ReturnType<typeof gen.rectangle>) => gen.toPaths(d)

function Sketch({ v }: { v: Extract<Visual, { kind: 'sketch' }> }) {
  const draw = (it: SketchItem, i: number) => {
    const o = { seed: i + 1, roughness: 1.1, bowing: 1.2, strokeWidth: 1.4, stroke: 'currentColor' }
    const shapes: ReactElement[] = []
    let n = 0
    const paths = (d: ReturnType<typeof gen.rectangle>, cls: string) =>
      toPaths(d).map((p) => <path key={`p${n++}`} d={p.d} className={cls} fill="none" stroke="currentColor" strokeWidth={p.strokeWidth} />)
    const { x, y, w = 0, h = 0 } = it
    if (it.type === 'mark') shapes.push(...paths(gen.rectangle(x, y, w, h, { ...o, stroke: 'none', fill: 'currentColor', fillStyle: 'hachure', hachureGap: 7, fillWeight: 1.2 }), 'sk-mark'))
    if (it.type === 'box' || it.type === 'button' || it.type === 'input' || it.type === 'select') shapes.push(...paths(gen.rectangle(x, y, w, h, o), it.type === 'button' && it.strong ? 'sk-strong' : 'sk-ink'))
    if (it.type === 'line') shapes.push(...paths(gen.line(x, y, x + w, y + h, o), 'sk-faint'))
    const label = it.label
    if (label) {
      const cls = `sk-text${it.type === 'input' && it.faint ? ' faint' : ''}${it.strong ? ' strong' : ''}${it.size === 'lg' ? ' lg' : ''}`
      if (it.type === 'button') shapes.push(<text key="t" x={x + w / 2} y={y + h / 2 + 7} textAnchor="middle" className={cls}>{label}</text>)
      else if (it.type === 'text') shapes.push(<text key="t" x={x} y={y} textAnchor={it.align === 'end' ? 'end' : 'start'} className={cls}>{label}</text>)
      else shapes.push(<text key="t" x={x + 10} y={y + h / 2 + 7} className={cls}>{label}</text>)
    }
    if (it.type === 'select') shapes.push(...paths(gen.linearPath([[x + w - 22, y + h / 2 - 3], [x + w - 15, y + h / 2 + 4], [x + w - 8, y + h / 2 - 3]], o), 'sk-ink'))
    return <g key={i} className={`sk-${it.type}`}>{shapes}</g>
  }
  return (
    <svg className="vz-svg vz-sketch" viewBox={`0 0 ${v.w} ${v.h}`} role="img" aria-label={v.alt}>
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
    case 'sketch': return <Sketch v={v} />
    case 'image': return <img className="vz-img" src={v.src} alt={v.alt} />
  }
}
