import { useEffect, useRef, useState } from 'react'
import { ago, merged, type Change } from '../github'

// The last few pull requests merged into this site's repo, read from GitHub
// when the colophon is near. Hidden if the request fails.
export default function Changes({ user, repo }: { user: string; repo: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [list, setList] = useState<Change[] | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') return
    let live = true
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        merged(user, repo).then((l) => live && setList(l))
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => {
      live = false
      io.disconnect()
    }
  }, [user, repo])

  return (
    <div ref={ref} className="wide changes" hidden={list !== null && list.length === 0}>
      <dt>Recently merged</dt>
      <dd>
        {list === null ? (
          <p className="lately-wait">Checking GitHub</p>
        ) : (
          <ol>
            {list.map((c) => (
              <li key={c.number}>
                <a href={c.url} target="_blank" rel="noreferrer">#{c.number}</a> {c.title} <small>{ago(c.merged)}</small>
              </li>
            ))}
          </ol>
        )}
      </dd>
    </div>
  )
}
