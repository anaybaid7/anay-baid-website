import { useEffect, useRef, useState } from 'react'
import { profile, repos } from '../data'
import { formatRelativeTime } from '../formatRelativeTime'

interface Live {
  language: string | null
  pushed_at: string
}

// My public repos with my own summaries. The list renders straight away, and
// the language and last push fill in from GitHub's API when it answers. Once
// GitHub has answered, any repo it didn't list (private or renamed) is left
// out, so the page never links to a 404.
export default function GithubActivity() {
  const [live, setLive] = useState<Record<string, Live> | null>(null)
  const [near, setNear] = useState(() => typeof IntersectionObserver === 'undefined')
  const ref = useRef<HTMLUListElement>(null)

  // only call GitHub once the section is about to scroll into view
  useEffect(() => {
    if (near || !ref.current) return
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setNear(true), { rootMargin: '600px 0px' })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [near])

  useEffect(() => {
    if (!near) return
    let cancelled = false
    fetch(`https://api.github.com/users/anaybaid7/repos?per_page=100`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((list: ({ name: string } & Live)[]) => {
        if (!cancelled) setLive(Object.fromEntries(list.map((r) => [r.name, { language: r.language, pushed_at: r.pushed_at }])))
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [near])

  return (
    <>
      <ul className="repos" ref={ref}>
        {repos.filter((r) => !live || live[r.name]).map((r) => {
          const info = live?.[r.name]
          return (
            <li key={r.name}>
              <a href={`${profile.links.github}/${r.name}`} target="_blank" rel="noreferrer">{r.name}</a>
              <p>{r.about}</p>
              {info && (
                <p className="repo-meta">
                  {info.language && <span>{info.language}</span>}
                  <span>updated {formatRelativeTime(info.pushed_at)}</span>
                </p>
              )}
            </li>
          )
        })}
      </ul>
      <p className="repos-more">
        Everything else is on <a href={profile.links.github} target="_blank" rel="noreferrer">github.com/anaybaid7</a>.
      </p>
    </>
  )
}
