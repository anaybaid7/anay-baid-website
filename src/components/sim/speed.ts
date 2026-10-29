import { useSyncExternalStore } from 'react'

// one playback speed shared by every simulation and diagram on the page
export const SPEEDS = [0.5, 1, 2] as const
let speed = 1
const subs = new Set<() => void>()

export const getSpeed = () => speed
export function setSpeed(next: number) {
  speed = next
  subs.forEach((f) => f())
}
export const useSpeed = () =>
  useSyncExternalStore(
    (f) => (subs.add(f), () => subs.delete(f)),
    () => speed,
    () => speed,
  )
