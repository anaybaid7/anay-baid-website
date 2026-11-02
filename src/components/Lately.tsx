import { useEffect, useRef, useState } from 'react'
import { repos as notes } from '../data'

interface Repo {
  name: string
  html_url: string
  description: string | null
  language: string | null
  pushed_at: string
  fork: boolean
}

const ago = (iso: string, now = Date.now()) => {
  const mins = Math.max(1, Math.round((now - Date.parse(iso)) / 60000))
  const [n, unit] = mins < 60 ? [mins, 'minute'] : mins < 1440 ? [Math.round(mins / 60), 'hour'] : mins < 43200 ? [Math.round(mins / 1440), 'day'] : [Math.round(mins / 43200), 'month']
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

// What I've pushed to lately, read live from GitHub's public API once the
// block scrolls near. Private work doesn't show, and if the API is down or
// rate limited the block just isn't there.
export default function Lately({ user }: { user: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [list, setList] = useState<Repo[] | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver !== 'function') return
    const ctrl = new AbortController()
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      io.disconnect()
      fetch(`https://api.github.com/users/${user}/repos?sort=pushed&per_page=8`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
        .then((all: Repo[]) => setList(all.filter((r) => !r.fork).slice(0, 4)))
        .catch(() => setList([]))
    }, { rootMargin: '400px' })
    io.observe(el)
    return () => {
      io.disconnect()
      ctrl.abort()
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
