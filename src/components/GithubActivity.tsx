import { useEffect, useState } from 'react'
import { profile } from '../data'
import { formatRelativeTime } from '../formatRelativeTime'
import { selectRepos, type Repo } from '../githubRepoSelection'

type State =
  | { status: 'loading' }
  | { status: 'ok'; repos: Repo[] }
  | { status: 'error' }

// Pulled live from GitHub's public API each visit. If that fails for any
// reason it just points at the profile instead.
export default function GithubActivity() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch('https://api.github.com/users/anaybaid7/repos?sort=updated&per_page=30')
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((repos: Repo[]) => {
        // skip the profile README repo, it isn't a project
        const real = repos.filter((r) => r.name.toLowerCase() !== 'anaybaid7')
        if (!cancelled) setState({ status: 'ok', repos: selectRepos(real, profile.pinnedRepos) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (state.status === 'loading') {
    return <p className="muted">Checking GitHub...</p>
  }

  if (state.status === 'error' || state.repos.length === 0) {
    return (
      <p>
        Couldn't load this from GitHub just now. Everything is at{' '}
        <a href={profile.links.github} target="_blank" rel="noreferrer">github.com/anaybaid7</a>.
      </p>
    )
  }

  return (
    <ol className="feed">
      {state.repos.map((r) => (
        <li key={r.name}>
          <span className="feed-when">{formatRelativeTime(r.pushed_at)}</span>
          <span className="feed-what">
            <a href={r.html_url} target="_blank" rel="noreferrer">{r.name}</a>
            {r.language && <span className="muted"> {r.language}</span>}
            {r.description && <span className="feed-desc">{r.description}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
