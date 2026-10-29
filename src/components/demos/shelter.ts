// One animal in Pashu, ported from AnimalController.cs. Health and water drain
// every tick, crossing 50 picks the next state, and every state change that
// matters is an event the score listens to.

export type AnimalState = 'Wander' | 'goToFood' | 'goToWater' | 'Dead'

export interface Animal {
  name: string
  type: string
  health: number
  water: number
  decay: number
  state: AnimalState
  // looking for a bowl that isn't there yet
  waiting?: boolean
}

export interface Bowls {
  food: number
  water: number
}

export type GameEvent =
  | { kind: 'hungry' | 'thirsty' | 'no-food' | 'no-water'; name: string }
  | { kind: 'ate' | 'drank'; name: string; xp: number }
  | { kind: 'died'; name: string; xp: -75 }

export function tick(a: Animal, dt: number, bowls: Bowls, rand: () => number = Math.random) {
  if (a.state === 'Dead') return { animal: a, bowls, events: [] as GameEvent[] }
  const events: GameEvent[] = []
  let { health, water, state } = a
  let { food, water: bowlsWater } = bowls
  health -= dt * a.decay
  water -= dt * (a.decay / 2)

  if (health <= 0 || water <= 0) {
    events.push({ kind: 'died', name: a.name, xp: -75 })
    return { animal: { ...a, health: 0, water: 0, state: 'Dead' as const }, bowls, events }
  }
  if (health < 50 && state !== 'goToFood') {
    state = 'goToFood'
    events.push({ kind: 'hungry', name: a.name })
  }
  if (water < 50 && state !== 'goToWater') {
    state = 'goToWater'
    events.push({ kind: 'thirsty', name: a.name })
  }

  // reaching a bowl takes a tick of walking, then it's used up
  if (state === 'goToFood' && a.state === 'goToFood') {
    if (food > 0) {
      food--
      health = 100
      state = 'Wander'
      events.push({ kind: 'ate', name: a.name, xp: 10 + Math.floor(rand() * 10) })
    } else if (!a.waiting) {
      events.push({ kind: 'no-food', name: a.name })
    }
  }
  if (state === 'goToWater' && a.state === 'goToWater') {
    if (bowlsWater > 0) {
      bowlsWater--
      water = 100
      state = 'Wander'
      events.push({ kind: 'drank', name: a.name, xp: 10 + Math.floor(rand() * 10) })
    } else if (!a.waiting) {
      events.push({ kind: 'no-water', name: a.name })
    }
  }
  // with no bowl out, the animal keeps looking until one appears, which is
  // what the game's per-frame check works out to
  const waiting = (state === 'goToFood' && food === 0) || (state === 'goToWater' && bowlsWater === 0)
  return { animal: { ...a, health, water, state, waiting }, bowls: { food, water: bowlsWater }, events }
}

// XP over 100 rolls into a level, under 0 drops one, as in Stats.cs
export function applyXp(xp: number, level: number, delta: number) {
  let x = xp + delta
  let l = level
  if (x >= 100) {
    x -= 100
    l++
  }
  if (x < 0) {
    x += 100
    l--
  }
  return { xp: x, level: l }
}
