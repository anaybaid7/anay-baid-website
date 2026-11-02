import { useEffect, useRef, useState } from 'react'
import { calm, useSettings } from '../settings'

// Counts the numbers in a figure like "92.9%" or "10-20×" up from zero the
// first time it scrolls into view. The page renders the final value, and
// anything already on screen at load is left alone so nothing flickers.
const scale = (text: string, t: number) =>
  text.replace(/\d+(\.\d+)?/g, (n) => {
    const places = n.split('.')[1]?.length ?? 0
    return (Number(n) * t).toFixed(places)
  })

export default function CountUp({ value }: { value: string }) {
  const settings = useSettings()
  const ref = useRef<HTMLElement>(null)
  const [t, setT] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el || calm(settings) || typeof IntersectionObserver !== 'function' || !/\d/.test(value)) return
    if (el.getBoundingClientRect().top < innerHeight) return
    let frame = 0
    setT(0)
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / 700)
        setT(1 - (1 - p) ** 3)
        if (p < 1) frame = requestAnimationFrame(step)
      }
      frame = requestAnimationFrame(step)
    }, { threshold: 0.6 })
    io.observe(el)
    return () => {
      io.disconnect()
      cancelAnimationFrame(frame)
      setT(1)
    }
    // only on mount: settings changes don't restart a count
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <b ref={ref} className="count">
      {t === 1 ? value : (
        <>
          <span className="sr-only">{value}</span>
          <span aria-hidden="true">{scale(value, t)}</span>
        </>
      )}
    </b>
  )
}
