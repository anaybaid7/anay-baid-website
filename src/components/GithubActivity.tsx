import { useEffect, useState } from 'react'
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

  useEffect(() => {
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
  }, [])

  return (
    <>
      <ul className="repos">
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
