import { useEffect, useRef, useState } from 'react'
import { repos as notes } from '../data'
import { ago, repos, type Repo } from '../github'

// the profile README repo and this site's own repo aren't news
const SKIP = (user: string) => new Set([user.toLowerCase(), 'anay-baid-website'])

// What I've pushed to lately, read live from GitHub once the block scrolls
// near. Private work doesn't show, and if
// the API is down or rate limited the block just isn't there.
export default function Lately({ user }: { user: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [list, setList] = useState<Repo[] | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') return
    let live = true
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return
        io.disconnect()
        const skip = SKIP(user)
        repos(user)
          .then((all) => all.filter((r) => !r.fork && !skip.has(r.name.toLowerCase())).slice(0, 4))
          .then((rows) => live && setList(rows))
      },
      { rootMargin: '400px' },
    )
    io.observe(el)
    return () => {
      live = false
      io.disconnect()
    }
  }, [user])

  return (
    <div ref={ref} className="about-block lately" hidden={list !== null && list.length === 0}>
      <h3>Lately on GitHub</h3>
      {list === null ? (
        <p className="lately-wait">Checking GitHub</p>
      ) : (
        <ol>
          {list.map((r) => (
            <li key={r.name}>
              <a href={r.html_url} target="_blank" rel="noreferrer">{r.name}</a>
              <span>{notes.find((n) => n.name === r.name)?.about ?? r.description ?? ''}</span>
              <small>{[r.language, `pushed ${ago(r.pushed_at)}`].filter(Boolean).join(', ')}</small>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
