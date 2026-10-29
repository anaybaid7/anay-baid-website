// An animal in Pashu is always in exactly one state. Events move it between
// states, and anything not in the table is ignored. Scoring listens for state
// changes instead of checking every frame.

export const STATES = ['Wandering', 'Following', 'Hungry', 'Eating', 'Sleeping'] as const
export type NpcState = (typeof STATES)[number]
export const EVENTS = ['PlayerNear', 'PlayerLeft', 'TimePasses', 'Fed', 'Night', 'Morning'] as const
export type NpcEvent = (typeof EVENTS)[number]

export const TRANSITIONS: [NpcState, NpcEvent, NpcState][] = [
  ['Wandering', 'PlayerNear', 'Following'],
  ['Following', 'PlayerLeft', 'Wandering'],
  ['Wandering', 'TimePasses', 'Hungry'],
  ['Following', 'TimePasses', 'Hungry'],
  ['Hungry', 'Fed', 'Eating'],
  ['Eating', 'TimePasses', 'Wandering'],
  ['Wandering', 'Night', 'Sleeping'],
  ['Hungry', 'Night', 'Sleeping'],
  ['Sleeping', 'Morning', 'Hungry'],
]

export function next(state: NpcState, event: NpcEvent): NpcState | null {
  return TRANSITIONS.find(([from, e]) => from === state && e === event)?.[2] ?? null
}

// points for good care, a penalty for leaving an animal hungry overnight
export function points(from: NpcState, to: NpcState) {
  if (to === 'Eating') return 10
  if (to === 'Following') return 2
  if (from === 'Hungry' && to === 'Sleeping') return -5
  return 0
}
