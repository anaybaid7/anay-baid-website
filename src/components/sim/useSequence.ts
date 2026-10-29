import { useCallback, useEffect, useRef, useState } from 'react'
import { getSpeed } from './speed'

export const calm = () =>
  document.documentElement.dataset.motion === 'reduced' ||
  (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches)

// Runs a list of steps one after another with a delay between them, and
// stops cleanly on unmount or when a new run starts. With reduced motion on,
// every step runs at once.
export function useSequence() {
  const timers = useRef<number[]>([])
  const [running, setRunning] = useState(false)

  const stop = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t))
    timers.current = []
    setRunning(false)
  }, [])

  useEffect(() => stop, [stop])

  const run = useCallback(
    (steps: (() => void)[], gap = 600) => {
      stop()
      if (calm()) {
        steps.forEach((s) => s())
        return
      }
      setRunning(true)
      gap = gap / getSpeed()
      steps.forEach((step, i) => {
        timers.current.push(window.setTimeout(step, i * gap))
      })
      timers.current.push(window.setTimeout(() => setRunning(false), steps.length * gap))
    },
    [stop],
  )

  return { run, stop, running }
}
