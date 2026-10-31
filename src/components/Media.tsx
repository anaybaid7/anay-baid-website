import { useEffect, useRef } from 'react'
import type { DemoKind } from '../details'
import { clip, hasClip, thumb } from '../showcase'
import { calm, resolvedTheme, useSettings } from '../settings'
import { useHydrated } from '../hydrated'

// a demo's picture, in the current theme
export function Shot({ kind, eager }: { kind: DemoKind; eager?: boolean }) {
  const load = eager ? 'eager' : 'lazy'
  return (
    <span className="shot">
      <img className="lt" src={thumb(kind, 'light')} alt="" width={640} height={400} loading={load} decoding="async" />
      <img className="dk" src={thumb(kind, 'dark')} alt="" width={640} height={400} loading={load} decoding="async" />
    </span>
  )
}

// A demo playing on a loop when there's a recording of it, its picture
// otherwise, before hydration, and when motion is reduced. It only plays
// while it's on screen.
export function Clip({ kind, eager }: { kind: DemoKind; eager?: boolean }) {
  const settings = useSettings()
  const hydrated = useHydrated()
  const video = useRef<HTMLVideoElement>(null)
  const still = !hydrated || !hasClip(kind) || calm(settings)

  useEffect(() => {
    const v = video.current
    if (!v || typeof IntersectionObserver !== 'function') return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) v.play().catch(() => {})
      else v.pause()
    })
    io.observe(v)
    return () => io.disconnect()
  }, [still])

  if (still) return <Shot kind={kind} eager={eager} />
  const theme = resolvedTheme(settings)
  return (
    <span className="shot">
      <video ref={video} key={theme} poster={thumb(kind, theme)} width={960} height={600} autoPlay muted loop playsInline preload="metadata" aria-hidden="true">
        <source src={clip(kind, theme, 'webm')} type="video/webm" />
        <source src={clip(kind, theme, 'mp4')} type="video/mp4" />
      </video>
    </span>
  )
}
