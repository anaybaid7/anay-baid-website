import { useEffect, useState } from 'react'
import { applyXp, tick, type Animal, type AnimalState, type Bowls, type GameEvent } from './shelter'
import { Log, type LogLine } from '../sim/Log'
import { getSpeed } from '../sim/speed'
import { rng } from './sales'

const START: Animal[] = [
  { name: 'Milo', type: 'cat', health: 82, water: 90, decay: 1.6, state: 'Wander' },
  { name: 'Bessie', type: 'cow', health: 64, water: 70, decay: 1.2, state: 'Wander' },
  { name: 'Hopscotch', type: 'rabbit', health: 95, water: 58, decay: 1.9, state: 'Wander' },
  { name: 'Buddy', type: 'dog', health: 71, water: 85, decay: 1.4, state: 'Wander' },
]

const STATES: AnimalState[] = ['Wander', 'goToFood', 'goToWater', 'Dead']
// the four states and what moves an animal between them
const EDGES: [AnimalState, AnimalState, string][] = [
  ['Wander', 'goToFood', 'health < 50'],
  ['goToFood', 'Wander', 'reached a bowl and ate'],
  ['Wander', 'goToWater', 'water < 50'],
  ['goToWater', 'Wander', 'reached a bowl and drank'],
]

const say = (e: GameEvent): LogLine => {
  if (e.kind === 'hungry') return { src: e.name, text: 'health under 50 → goToFood' }
  if (e.kind === 'thirsty') return { src: e.name, text: 'water under 50 → goToWater' }
  if (e.kind === 'no-food') return { src: e.name, text: 'no food bowl out, still looking', tone: 'warn' }
  if (e.kind === 'no-water') return { src: e.name, text: 'no water bowl out, still looking', tone: 'warn' }
  if (e.kind === 'ate') return { src: e.name, text: `ate, health back to 100, +${e.xp} XP`, tone: 'ok' }
  if (e.kind === 'drank') return { src: e.name, text: `drank, water back to 100, +${e.xp} XP`, tone: 'ok' }
  return { src: e.name, text: 'health or water hit 0 → Dead, −75 XP', tone: 'err' }
}

// The shelter's animals running the same state machine as the game. Health
// and water drain on a clock, the state follows, and XP only moves when an
// event says so. Keep the bowls stocked or lose animals.
interface World {
  animals: Animal[]
  bowls: Bowls
  xp: { xp: number; level: number }
  log: LogLine[]
}

const FRESH: World = {
  animals: START,
  bowls: { food: 2, water: 2 },
  xp: { xp: 40, level: 1 },
  log: [{ src: 'shelter', text: '4 animals, 2 food bowls, 2 water bowls' }],
}

// one second of game time for every animal, in order, sharing the bowls
function advance(w: World, rand: () => number): World {
  let { bowls, xp } = w
  const lines: LogLine[] = []
  const animals = w.animals.map((a) => {
    const r = tick(a, 1, bowls, rand)
    bowls = r.bowls
    for (const e of r.events) {
      lines.push(say(e))
      if ('xp' in e) xp = applyXp(xp.xp, xp.level, e.xp)
    }
    return r.animal
  })
  return { animals, bowls, xp, log: lines.length ? [...w.log, ...lines].slice(-40) : w.log }
}

export default function Shelter() {
  const [world, setWorld] = useState(FRESH)
  const [on, setOn] = useState(false)
  const [rand, setRand] = useState(() => rng(5))
  const { animals, bowls, xp, log } = world
  const step = () => setWorld((w) => advance(w, rand))

  useEffect(() => {
    if (!on) return
    const t = window.setInterval(step, 260 / getSpeed())
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on])

  const reset = () => {
    setOn(false)
    setWorld(FRESH)
    setRand(() => rng(5))
  }
  const add = (k: keyof Bowls) => setWorld((w) => ({ ...w, bowls: { ...w.bowls, [k]: w.bowls[k] + 1 } }))
  const alive = animals.filter((a) => a.state !== 'Dead').length

  return (
    <div className="demo shelter">
      <p className="demo-hint">Start the clock. Keep the bowls stocked.</p>
      <div className="shelter-hud">
        <span>Level <b>{xp.level}</b></span>
        <span className="xpbar" role="progressbar" aria-label="XP to the next level" aria-valuemin={0} aria-valuemax={100} aria-valuenow={xp.xp}><i style={{ width: `${xp.xp}%` }} /></span>
        <span>Animals <b>{alive}</b></span>
        <span>Food bowls <b>{bowls.food}</b></span>
        <span>Water bowls <b>{bowls.water}</b></span>
      </div>
      <div className="demo-actions">
        <button type="button" className="demo-primary" onClick={() => setOn(!on)} aria-pressed={on}>
          {on ? 'Pause' : 'Start the clock'}
        </button>
        <button type="button" onClick={step} disabled={on}>Advance one tick</button>
        <button type="button" onClick={() => add('food')}>Put out food</button>
        <button type="button" onClick={() => add('water')}>Put out water</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>

      <div className="shelter-grid">
        <ul className="animals">
          {animals.map((a) => (
            <li key={a.name} className={`st-${a.state}`}>
              <p className="an-head">
                <b>{a.name}</b> <span>{a.type}</span>
                <code>{a.state}</code>
              </p>
              <p className="meter"><span>Health</span><i style={{ width: `${Math.max(0, a.health)}%` }} className={a.health < 50 ? 'low' : ''} /></p>
              <p className="meter"><span>Water</span><i style={{ width: `${Math.max(0, a.water)}%` }} className={a.water < 50 ? 'low' : ''} /></p>
            </li>
          ))}
        </ul>
        <div>
          <p className="demo-h">State machine</p>
          <ul className="fsm-table">
            {STATES.map((s) => (
              <li key={s} className={animals.some((a) => a.state === s) ? 'on' : ''}>
                <code>{s}</code>
                <span>{animals.filter((a) => a.state === s).map((a) => a.name).join(', ') || 'none'}</span>
              </li>
            ))}
          </ul>
          <ul className="fsm-edges">
            {EDGES.map(([a, b, why]) => (
              <li key={a + b}>
                <code>{a}</code> → <code>{b}</code> <span>{why}</span>
              </li>
            ))}
            <li><code>any</code> → <code>Dead</code> <span>health or water hits 0</span></li>
          </ul>
        </div>
      </div>
      <Log title="Events" lines={log} />
    </div>
  )
}
