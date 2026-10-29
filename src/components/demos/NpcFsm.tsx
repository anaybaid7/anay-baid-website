import { useRef, useState } from 'react'
import { EVENTS, next, points, STATES, TRANSITIONS, type NpcEvent, type NpcState } from './npc'
import { Log, type LogLine } from '../sim/Log'
import { useSequence } from '../sim/useSequence'

// a short day in the game, played as events
const DAY: NpcEvent[] = ['PlayerNear', 'TimePasses', 'Fed', 'TimePasses', 'Night', 'Morning', 'Fed']

// where each state sits in the diagram
const POS: Record<NpcState, [number, number]> = {
  Wandering: [300, 80],
  Following: [510, 80],
  Sleeping: [90, 260],
  Hungry: [300, 260],
  Eating: [510, 260],
}
const R = 46
// Eating back to Wandering bends away from the Following to Hungry line
const BEND: Record<string, number> = { 'Eating>Wandering': -95 }

function arc(a: NpcState, b: NpcState) {
  const [x1, y1] = POS[a]
  const [x2, y2] = POS[b]
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  // a pair going both ways bends apart, so the two arrows don't overlap
  const paired = TRANSITIONS.some(([f, , t]) => f === b && t === a)
  const bend = BEND[`${a}>${b}`] ?? (paired ? 24 : 0)
  const p0 = [x1 + ux * R, y1 + uy * R]
  const p2 = [x2 - ux * (R + 6), y2 - uy * (R + 6)]
  const c = [(x1 + x2) / 2 - uy * bend, (y1 + y2) / 2 + ux * bend]
  return {
    d: `M${p0[0]},${p0[1]} Q${c[0]},${c[1]} ${p2[0]},${p2[1]}`,
    // the curve's own midpoint, where its label sits
    mx: 0.25 * p0[0] + 0.5 * c[0] + 0.25 * p2[0],
    my: 0.25 * p0[1] + 0.5 * c[1] + 0.25 * p2[1] + 4,
  }
}

// One animal's state machine. Send it events and watch it move between
// states. Events with no transition from the current state are ignored, and
// the score only changes when a state change says so.
export default function NpcFsm() {
  const [state, setState] = useState<NpcState>('Wandering')
  const [score, setScore] = useState(0)
  const [last, setLast] = useState<string | null>(null)
  const [log, setLog] = useState<LogLine[]>([{ src: 'npc', text: 'spawned in Wandering' }])

  const seq = useSequence()
  const add = (...lines: LogLine[]) => setLog((l) => [...l, ...lines].slice(-30))

  // the state as of the last event, so a played sequence reads its own updates
  const cur = useRef<NpcState>('Wandering')
  const send = (e: NpcEvent) => {
    const state = cur.current
    const to = next(state, e)
    if (!to) return add({ src: 'event', text: `${e} ignored in ${state}`, tone: 'warn' })
    const p = points(state, to)
    add({ src: 'event', text: `${e}: ${state} → ${to}` })
    if (p) add({ src: 'score', text: `${p > 0 ? '+' : ''}${p} on entering ${to}`, tone: p > 0 ? 'ok' : 'err' })
    setLast(`${state}>${e}>${to}`)
    setScore((s) => s + p)
    setState(to)
    cur.current = to
  }
  const reset = () => {
    seq.stop()
    setState('Wandering')
    cur.current = 'Wandering'
    setScore(0)
    setLast(null)
    setLog([{ src: 'npc', text: 'spawned in Wandering' }])
  }

  return (
    <div className="demo fsm">
      <p className="demo-lede">
        One animal’s state machine from Pashu. Send it events and watch the transitions. Anything that doesn’t apply to the
        current state is ignored, which is what keeps NPC behaviour predictable.
      </p>
      <div className="fsm-grid">
        <svg viewBox="0 0 600 330" className="fsm-svg" role="img" aria-label={`State machine, currently ${state}`}>
          <defs>
            <marker id="fsm-head" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" />
            </marker>
          </defs>
          {TRANSITIONS.map(([a, e, b]) => {
            const { d, mx, my } = arc(a, b)
            const hot = last === `${a}>${e}>${b}`
            const ready = a === state
            return (
              <g key={`${a}-${e}`} className={['fsm-edge', hot ? 'hot' : '', ready ? 'ready' : ''].join(' ')}>
                <path d={d} markerEnd="url(#fsm-head)" />
                <text x={mx} y={my}>{e}</text>
              </g>
            )
          })}
          {STATES.map((s) => (
            <g key={s} className={s === state ? 'fsm-state on' : 'fsm-state'} transform={`translate(${POS[s][0]},${POS[s][1]})`}>
              <circle r={R} />
              <text y="5">{s}</text>
            </g>
          ))}
        </svg>
        <div className="fsm-side">
          <p className="fsm-now">
            <span>Now</span> <b>{state}</b>
          </p>
          <p className="fsm-now">
            <span>Score</span> <b>{score}</b>
          </p>
          <p className="demo-h">Send an event</p>
          <div className="fsm-events">
            {EVENTS.map((e) => (
              <button key={e} type="button" className={next(state, e) ? 'live' : ''} onClick={() => send(e)}>
                {e}
              </button>
            ))}
          </div>
          <div className="demo-actions">
            <button type="button" className="demo-primary" onClick={() => { reset(); seq.run(DAY.map((e) => () => send(e)), 900) }} disabled={seq.running}>
              Play a day
            </button>
            <button type="button" onClick={reset}>Reset</button>
          </div>
          <Log title="Events" lines={log} />
        </div>
      </div>
    </div>
  )
}
