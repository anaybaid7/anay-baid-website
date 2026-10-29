import { useEffect, useId, useMemo, useState, type KeyboardEvent } from 'react'
import type { Architecture, ArchNode, Flow, NodeKind } from '../details'

const W = 188
const H = 62
const GX = 56
const GY = 52
const PAD = 22
const STEP_MS = 3200

interface Box {
  x: number
  y: number
  node: ArchNode
}

// a path between two boxes that bends at right angles when they aren't on
// the same row or column. Works in either direction.
function route(a: Box, b: Box) {
  const ax = a.x + W / 2
  const ay = a.y + H / 2
  const bx = b.x + W / 2
  const by = b.y + H / 2
  if (Math.abs(ay - by) < 1) {
    const [x1, x2] = bx > ax ? [a.x + W, b.x] : [a.x, b.x + W]
    return `M${x1},${ay} H${x2}`
  }
  if (Math.abs(ax - bx) < 1) {
    const [y1, y2] = by > ay ? [a.y + H, b.y] : [a.y, b.y + H]
    return `M${ax},${y1} V${y2}`
  }
  const right = bx > ax
  const x1 = right ? a.x + W : a.x
  const x2 = right ? b.x : b.x + W
  const mid = (x1 + x2) / 2
  return `M${x1},${ay} H${mid} V${by} H${x2}`
}

// small line icons for what each box is, drawn in a 16px box
const ICONS: Record<NodeKind, string> = {
  client: 'M2 3h12v10H2z M2 6h12',
  service: 'M2 2h12v5H2z M2 9h12v5H2z M5 4.5h.01 M5 11.5h.01',
  store: 'M2 4c0-1.5 12-1.5 12 0v8c0 1.5-12 1.5-12 0z M2 4c0 1.5 12 1.5 12 0 M2 8c0 1.5 12 1.5 12 0',
  job: 'M8 2a6 6 0 1 0 .01 0z M8 5v3l2 2',
  queue: 'M2 3h12 M2 6.5h12 M2 10h12 M2 13.5h12',
  cloud: 'M4.5 12.5h7a3 3 0 0 0 .3-6 4 4 0 0 0-7.6-.8A2.9 2.9 0 0 0 4.5 12.5z',
  person: 'M8 2.5a2.5 2.5 0 1 0 .01 0z M3 14c.5-3 2.5-4.5 5-4.5s4.5 1.5 5 4.5',
  file: 'M4 2h5l3 3v9H4z M9 2v3h3',
  code: 'M6 4 2 8l4 4 M10 4l4 4-4 4',
}

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

// Older entries only list edges. Turn those into a single flow so every
// diagram plays the same way.
function flowsOf(arch: Architecture, flows?: Flow[]): Flow[] {
  if (flows?.length) return flows
  const label = (id: string) => arch.nodes.find((n) => n.id === id)!
  return [
    {
      name: 'How it connects',
      steps: arch.edges.map((e) => ({ from: e.from, to: e.to, title: `${label(e.from).label} to ${label(e.to).label}`, detail: label(e.to).note })),
    },
  ]
}

// An architecture diagram drawn from data. Each flow is one scenario through
// the system, played a hop at a time with a dot moving along the line, and
// every hop shows what is sent and what happens with it.
export default function ArchDiagram({ arch, flows: given, name, initialPick }: { arch: Architecture; flows?: Flow[]; name: string; initialPick?: string }) {
  const flows = useMemo(() => flowsOf(arch, given), [arch, given])
  // a shared link can point at one step of one flow, as ?flow=1&step=2
  const [start] = useState(() => {
    const q = new URLSearchParams(location.search)
    const fl = Math.min(Math.max(0, Number(q.get('flow') ?? 1) - 1), flows.length - 1)
    const st = Number(q.get('step') ?? 0) - 1
    return { f: fl, step: Math.min(st, flows[fl].steps.length - 1) }
  })
  const [f, setF] = useState(start.f)
  const [step, setStep] = useState(initialPick ? -1 : start.step)
  const [copied, setCopied] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [picked, setPicked] = useState<string | null>(initialPick ?? null)
  const calm = useCalm()
  const marker = useId().replace(/:/g, '')
  const flow = flows[f]
  const steps = flow.steps
  const active = step >= 0 ? steps[step] : null

  const goTo = (i: number) => {
    setPicked(null)
    setStep(Math.max(0, Math.min(steps.length - 1, i)))
  }

  useEffect(() => {
    if (!playing) return
    if (step >= steps.length - 1) {
      setPlaying(false)
      return
    }
    const t = setTimeout(() => goTo(step + 1), step < 0 ? 150 : STEP_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, step])

  // keep the flow and step in the URL so the exact hop can be shared
  useEffect(() => {
    const url = new URL(location.href)
    if (step >= 0 || f > 0) {
      url.searchParams.set('flow', String(f + 1))
      if (step >= 0) url.searchParams.set('step', String(step + 1))
      else url.searchParams.delete('step')
    } else {
      url.searchParams.delete('flow')
      url.searchParams.delete('step')
    }
    history.replaceState(history.state, '', url)
  }, [f, step])

  const copyLink = () =>
    navigator.clipboard?.writeText(location.href).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )

  // Space plays or pauses, the arrows step, and 1 to 9 pick a flow, whenever
  // focus is in the diagram but not on a box (boxes use the arrows to move)
  const onFigureKey = (e: KeyboardEvent<HTMLElement>) => {
    const t = e.target as HTMLElement
    if (t.closest('.arch-node, input, textarea')) return
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      setPlaying(false)
      goTo(step + (e.key === 'ArrowRight' ? 1 : -1))
    } else if (e.key === ' ' && t.tagName !== 'BUTTON') {
      e.preventDefault()
      play()
    } else if (/^[1-9]$/.test(e.key) && Number(e.key) <= flows.length) {
      pickFlow(Number(e.key) - 1)
    }
  }

  const play = () => {
    if (playing) return setPlaying(false)
    if (step >= steps.length - 1) setStep(-1)
    setPlaying(true)
  }
  const pickFlow = (i: number) => {
    setF(i)
    setStep(-1)
    setPlaying(false)
    setPicked(null)
  }

  const top = arch.groups?.length ? 30 : 0
  const boxes = useMemo(() => {
    const map = new Map<string, Box>()
    for (const node of arch.nodes) map.set(node.id, { node, x: PAD + node.col * (W + GX), y: PAD + top + node.row * (H + GY) })
    return map
  }, [arch, top])
  const cols = Math.max(...arch.nodes.map((n) => n.col)) + 1
  const rows = Math.max(...arch.nodes.map((n) => n.row)) + 1
  const width = PAD * 2 + cols * W + (cols - 1) * GX
  const height = PAD * 2 + top + rows * H + (rows - 1) * GY

  // nodes this flow touches stay bright, the rest fade back a little
  const inFlow = new Set(steps.flatMap((s) => [s.from, s.to]))
  const focus = picked ?? active?.to ?? null
  const pickedNode = picked ? boxes.get(picked)!.node : null
  const ids = arch.nodes.map((n) => n.id)

  const onKey = (e: KeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setPlaying(false)
      setPicked(id)
    }
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      const next = ids[(ids.indexOf(id) + (e.key === 'ArrowRight' ? 1 : ids.length - 1)) % ids.length]
      setPicked(next)
      ;(e.currentTarget.ownerSVGElement?.querySelector(`[data-node="${next}"]`) as SVGGElement | null)?.focus()
    }
  }

  return (
    <figure className="arch" onKeyDown={onFigureKey}>
      {flows.length > 1 && (
        <div className="flow-tabs" role="tablist" aria-label="Flows">
          {flows.map((fl, i) => (
            <button key={fl.name} type="button" role="tab" aria-selected={i === f} onClick={() => pickFlow(i)}>
              {fl.name}
            </button>
          ))}
        </div>
      )}
      {flow.summary && <p className="flow-summary">{flow.summary}</p>}

      <div className="arch-scroll">
        <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="group" aria-label={`How ${name} fits together`}>
          <defs>
            <marker id={marker} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="arch-head" />
            </marker>
            <marker id={`${marker}-on`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" className="arch-head on" />
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

          {arch.edges.map((e) => (
            <path key={`${e.from}-${e.to}`} className="arch-wire" d={route(boxes.get(e.from)!, boxes.get(e.to)!)} markerEnd={`url(#${marker})`} />
          ))}

          {steps.map((s, i) =>
            i < step ? (
              <path key={`done-${i}`} className="arch-wire done" d={route(boxes.get(s.from)!, boxes.get(s.to)!)} />
            ) : null,
          )}

          {active && (
            <g className="arch-live" key={`${f}-${step}`}>
              <path d={route(boxes.get(active.from)!, boxes.get(active.to)!)} markerEnd={`url(#${marker}-on)`} />
              {!calm && (
                <circle r="6" className="arch-packet">
                  <animateMotion dur="1.1s" fill="freeze" path={route(boxes.get(active.from)!, boxes.get(active.to)!)} calcMode="spline" keySplines="0.25 0.1 0.25 1" keyTimes="0;1" />
                </circle>
              )}
            </g>
          )}

          {[...boxes.values()].map(({ node, x, y }) => {
            const on = node.id === focus
            const from = active?.from === node.id
            const faded = !inFlow.has(node.id)
            return (
              <g
                key={node.id}
                data-node={node.id}
                className={['arch-node', on ? 'on' : '', from ? 'from' : '', faded ? 'faded' : ''].join(' ')}
                transform={`translate(${x},${y})`}
                tabIndex={0}
                role="button"
                aria-pressed={on}
                aria-label={`${node.label}${node.sub ? `, ${node.sub}` : ''}`}
                onClick={() => {
                  setPlaying(false)
                  setPicked(node.id)
                }}
                onKeyDown={(e) => onKey(e, node.id)}
              >
                <rect width={W} height={H} />
                {node.kind && (
                  <path d={ICONS[node.kind]} transform="translate(12,12)" className="arch-icon" />
                )}
                <text x={node.kind ? 36 : 14} y={25} className="arch-label">{node.label}</text>
                {node.sub && <text x={14} y={47} className="arch-sub">{node.sub}</text>}
              </g>
            )
          })}
        </svg>
      </div>

      <div className="arch-bar">
        <button type="button" className="arch-play" onClick={play} aria-pressed={playing}>
          {playing ? 'Pause' : step >= steps.length - 1 ? 'Replay' : step >= 0 ? 'Resume' : 'Play this flow'}
        </button>
        <button type="button" onClick={() => { setPlaying(false); goTo(step - 1) }} disabled={step <= 0} aria-label="Previous step">←</button>
        <button type="button" onClick={() => { setPlaying(false); goTo(step + 1) }} disabled={step >= steps.length - 1} aria-label="Next step">→</button>
        <span className="arch-count">{step >= 0 ? `Step ${step + 1} of ${steps.length}` : `${steps.length} steps`}</span>
      </div>

      <div className="flow-panel">
        <ol className="flow-steps">
          {steps.map((s, i) => (
            <li key={i}>
              <button type="button" className={i === step ? 'on' : i < step ? 'done' : ''} onClick={() => { setPlaying(false); goTo(i) }}>
                <span className="flow-n">{i + 1}</span>
                {s.title}
              </button>
            </li>
          ))}
        </ol>
        <div className="flow-detail" aria-live="polite">
          {pickedNode ? (
            <>
              <p className="flow-hop">{pickedNode.sub ?? 'Component'}</p>
              <h3>{pickedNode.label}</h3>
              <p>{pickedNode.note}</p>
            </>
          ) : active ? (
            <>
              <p className="flow-hop">
                {boxes.get(active.from)!.node.label} → {boxes.get(active.to)!.node.label}
              </p>
              <h3>{active.title}</h3>
              <p>{active.detail}</p>
              <button type="button" className="flow-link" onClick={copyLink}>
                {copied ? 'Link copied' : 'Copy a link to this step'}
              </button>
              {active.payload && (
                <div className="flow-payload">
                  <p>{active.payload.label}</p>
                  <pre>{active.payload.code}</pre>
                </div>
              )}
            </>
          ) : (
            <p className="flow-hint">Press play, pick a step, or click any part of the diagram.</p>
          )}
        </div>
      </div>
      {arch.footnote && <p className="arch-foot">{arch.footnote}</p>}
    </figure>
  )
}
