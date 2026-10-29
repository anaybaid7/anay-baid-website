import { DETAILS } from '../details'

const W = 30
const H = 15
const GX = 10
const GY = 12

// A thumbnail of an entry's architecture diagram, drawn from the same data.
// Pointing at it traces the first flow, and clicking opens the full diagram.
export default function MiniArch({ id, name, onOpen }: { id: string; name: string; onOpen: (id: string) => void }) {
  const d = DETAILS[id]
  if (!d) return null
  const pos = new Map(d.arch.nodes.map((n) => [n.id, { x: n.col * (W + GX), y: n.row * (H + GY) }]))
  const cols = Math.max(...d.arch.nodes.map((n) => n.col)) + 1
  const rows = Math.max(...d.arch.nodes.map((n) => n.row)) + 1
  const steps = d.flows?.[0]?.steps ?? []
  const line = (from: string, to: string) => {
    const a = pos.get(from)!
    const b = pos.get(to)!
    const [ax, ay, bx, by] = [a.x + W / 2, a.y + H / 2, b.x + W / 2, b.y + H / 2]
    return ax === bx || ay === by ? `M${ax},${ay} L${bx},${by}` : `M${ax},${ay} H${(ax + bx) / 2} V${by} H${bx}`
  }

  return (
    <button type="button" className="mini-arch" onClick={() => onOpen(id)} aria-label={`Open the system diagram for ${name}`}>
      <svg viewBox={`-2 -2 ${cols * (W + GX) - GX + 4} ${rows * (H + GY) - GY + 4}`} aria-hidden="true">
        {d.arch.edges.map((e) => (
          <path key={`${e.from}-${e.to}`} className="ma-wire" d={line(e.from, e.to)} />
        ))}
        {steps.map((s, i) => (
          <path key={i} className="ma-run" d={line(s.from, s.to)} style={{ animationDelay: `${i * 0.35}s` }} />
        ))}
        {d.arch.nodes.map((n) => {
          const p = pos.get(n.id)!
          return <rect key={n.id} x={p.x} y={p.y} width={W} height={H} />
        })}
      </svg>
      <small>
        {d.arch.nodes.length} parts, {d.flows?.length ?? 1} {d.flows?.length === 1 ? 'flow' : 'flows'}
      </small>
    </button>
  )
}
