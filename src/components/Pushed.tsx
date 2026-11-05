import { useEffect, useRef, useState } from 'react'
import { ago, lastCommit, repoOf, repos } from '../github'

// How recently a project's public repo was touched, read from GitHub once
// the card is near the screen. Nothing shows if the repo isn't public, the
// request fails, or the last commit is over a year old.
export default function Pushed({ url }: { url: string }) {
  const ref = useRef<HTMLElement>(null)
  const [text, setText] = useState('')

  useEffect(() => {
    // the label is hidden while empty and its row has no box of its own,
    // so watch the entry it belongs to
    const el = ref.current?.closest('.entry')
    const r = repoOf(url)
    if (!el || !r || typeof IntersectionObserver !== 'function') return
    let live = true
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        repos(r.user).then(async (all) => {
          const hit = all.find((x) => x.name.toLowerCase() === r.repo.toLowerCase())
          // repos outside the first page of the list fall back to their newest commit
          const when = hit?.pushed_at ?? (await lastCommit(r.user, r.repo))?.date
          // only worth saying while it's recent
          if (live && when && Date.now() - Date.parse(when) < 365 * 864e5) setText(`last commit ${ago(when)}`)
        })
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => {
      live = false
      io.disconnect()
    }
  }, [url])

  return (
    <small ref={ref} className="pushed" aria-live="polite">
      {text}
    </small>
  )
}
