import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'
import type { Architecture, ArchNode } from '../details'

const W = 170
const H = 60
const GX = 58
const GY = 50
const PAD = 22

interface Box {
  x: number
  y: number
  node: ArchNode
}

// the start and end of a line between two boxes, plus a path that bends at
// right angles when they aren't on the same row or column
function route(a: Box, b: Box) {
  const ax = a.x + W / 2
  const ay = a.y + H / 2
  const bx = b.x + W / 2
  const by = b.y + H / 2
  if (Math.abs(ay - by) < 1) {
    const [x1, x2] = bx > ax ? [a.x + W, b.x] : [a.x, b.x + W]
    return { d: `M${x1},${ay} H${x2}`, mx: (x1 + x2) / 2, my: ay }
  }
  if (Math.abs(ax - bx) < 1) {
    const [y1, y2] = by > ay ? [a.y + H, b.y] : [a.y, b.y + H]
    return { d: `M${ax},${y1} V${y2}`, mx: ax + 10, my: (y1 + y2) / 2 + 11, side: true }
  }
  const right = bx > ax
  const x1 = right ? a.x + W : a.x
  const x2 = right ? b.x : b.x + W
  const mid = (x1 + x2) / 2
  return { d: `M${x1},${ay} H${mid} V${by} H${x2}`, mx: mid, my: (ay + by) / 2 }
}

// An architecture diagram drawn from data. Pick a box with the mouse or the
// keyboard and its connections light up and its note shows underneath.
// Play walks the connections in order, one hop at a time, with a dot moving
// along each line. Reduced motion keeps the steps and drops the dot.
const STEP_MS = 2400

function useCalm() {
  const [calm, setCalm] = useState(
    () =>
      document.documentElement.dataset.motion === 'reduced' ||
      (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches),
  )
  useEffect(() => {
    const o = new MutationObserver(() => setCalm(document.documentElement.dataset.motion === 'reduced'))
    o.observe(document.documentElement, { attributes: true, attributeFilter: ['data-motion'] })
    return () => o.disconnect()
  }, [])
  return calm
}

export default function ArchDiagram({ arch, name }: { arch: Architecture; name: string }) {
  const [selected, setSelected] = useState(arch.nodes[0].id)
  // -1 is "not stepping through", otherwise the index of the edge being shown
  const [step, setStep] = useState(-1)
  const [playing, setPlaying] = useState(false)
  const calm = useCalm()
  const steps = arch.edges

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(steps.length - 1, i))
    setStep(clamped)
    setSelected(steps[clamped].to)
  }

  useEffect(() => {
    if (!playing) return
    if (step >= steps.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => goTo(step + 1), step < 0 ? 200 : STEP_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step])

  const play = () => {
    if (playing) return setPlaying(false)
    if (step >= steps.length - 1 || step < 0) {
      setStep(-1)
      setSelected(steps[0].from)
    }
    setPlaying(true)
  }
  const pick = (id: string) => {
    setPlaying(false)
    setStep(-1)
    setSelected(id)
  }
  const active = step >= 0 ? steps[step] : null
  const marker = useId().replace(/:/g, '')
  const top = arch.groups?.length ? 30 : 0

  const boxes = useMemo(() => {
    const map = new Map<string, Box>()
    for (const node of arch.nodes) {
      map.set(node.id, { node, x: PAD + node.col * (W + GX), y: PAD + top + node.row * (H + GY) })
    }
    return map
  }, [arch, top])

  const cols = Math.max(...arch.nodes.map((n) => n.col)) + 1
  const rows = Math.max(...arch.nodes.map((n) => n.row)) + 1
  const width = PAD * 2 + cols * W + (cols - 1) * GX
  const height = PAD * 2 + top + rows * H + (rows - 1) * GY

  const linked = new Set(arch.edges.flatMap((e) => (e.from === selected || e.to === selected ? [e.from, e.to] : [])))
  const current = boxes.get(selected)!.node
  const ids = arch.nodes.map((n) => n.id)

  const onKey = (e: KeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      pick(id)
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = ids[(ids.indexOf(id) + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]
      pick(next)
      ;(e.currentTarget.ownerSVGElement?.querySelector(`[data-node="${next}"]`) as SVGGElement | null)?.focus()
    }
  }

  return (
    <figure className="arch">
      <div className="arch-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="group" aria-label={`How ${name} fits together`}>
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="arch-head" />
            </marker>
          </defs>

          {arch.groups?.map((g) => {
            const members = g.nodes.map((id) => boxes.get(id)!)
            const x = Math.min(...members.map((m) => m.x)) - 12
            const y = Math.min(...members.map((m) => m.y)) - 26
            const x2 = Math.max(...members.map((m) => m.x + W)) + 12
            const y2 = Math.max(...members.map((m) => m.y + H)) + 12
            return (
              <g key={g.label} className="arch-group">
                <rect x={x} y={y} width={x2 - x} height={y2 - y} />
                <text x={x + 10} y={y + 17}>{g.label}</text>
              </g>
            )
          })}

          {arch.edges.map((e) => {
            const r = route(boxes.get(e.from)!, boxes.get(e.to)!)
            const isActive = active === e
            const on = isActive || (!active && (e.from === selected || e.to === selected))
            return (
              <g key={`${e.from}-${e.to}`} className={['arch-edge', on ? 'on' : '', isActive ? 'live' : ''].join(' ')}>
                <path d={r.d} markerEnd={`url(#${marker})`} />
                {isActive && !calm && (
                  <circle r="5.5" className="arch-packet" key={step}>
                    <animateMotion dur="0.9s" fill="freeze" path={r.d} calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1" />
                  </circle>
                )}
                {e.label && (
                  <text x={r.mx} y={r.my - 7} textAnchor={'side' in r ? 'start' : 'middle'}>{e.label}</text>
                )}
              </g>
            )
          })}

          {[...boxes.values()].map(({ node, x, y }) => {
            const on = node.id === selected
            const near = linked.has(node.id)
            return (
              <g
                key={node.id}
                data-node={node.id}
                className={['arch-node', on ? 'on' : '', near && !on ? 'near' : ''].join(' ')}
                transform={`translate(${x},${y})`}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${node.label}${node.sub ? `, ${node.sub}` : ''}`}
                onClick={() => pick(node.id)}
                onMouseEnter={() => !playing && pick(node.id)}
                onKeyDown={(e) => onKey(e, node.id)}
              >
                <rect width={W} height={H} />
                <text x={14} y={node.sub ? 25 : 35} className="arch-label">{node.label}</text>
                {node.sub && <text x={14} y={44} className="arch-sub">{node.sub}</text>}
              </g>
            )
          })}
        </svg>
      </div>
      <div className="arch-bar">
        <button type="button" className="arch-play" onClick={play} aria-pressed={playing}>
          {playing ? 'Pause' : step >= steps.length - 1 ? 'Replay the flow' : step >= 0 ? 'Resume' : 'Play the flow'}
        </button>
        <button type="button" onClick={() => { setPlaying(false); goTo(step - 1) }} disabled={step <= 0} aria-label="Previous step">
          ←
        </button>
        <button type="button" onClick={() => { setPlaying(false); goTo(step + 1) }} disabled={step >= steps.length - 1} aria-label="Next step">
          →
        </button>
        <ol className="arch-steps" aria-hidden="true">
          {steps.map((s, i) => (
            <li key={`${s.from}-${s.to}`} className={i <= step ? 'done' : ''} />
          ))}
        </ol>
        <span className="arch-count">{step >= 0 ? `Step ${step + 1} of ${steps.length}` : `${steps.length} steps`}</span>
      </div>
      <figcaption className="arch-note" aria-live="polite">
        {active && (
          <span className="arch-hop">
            {boxes.get(active.from)!.node.label} → {boxes.get(active.to)!.node.label}
            {active.label ? `, ${active.label}` : ''}
          </span>
        )}
        <b>{current.label}</b> {current.note}
      </figcaption>
      {arch.footnote && <p className="arch-foot">{arch.footnote}</p>}
    </figure>
  )
}
