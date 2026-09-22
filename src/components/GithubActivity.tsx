import { useEffect, useState } from 'react'
import { profile } from '../data'
import { formatRelativeTime } from '../formatRelativeTime'
import { selectRepos, type Repo } from '../githubRepoSelection'

type State =
  | { status: 'loading' }
  | { status: 'ok'; repos: Repo[] }
  | { status: 'error' }

// A real client-side fetch against GitHub's public REST API — not static
// content. GitHub serves Access-Control-Allow-Origin: * on unauthenticated
// GETs to public endpoints, so this works from any static deployment.
// Degrades gracefully to a plain link if the fetch fails for any reason
// (offline, rate-limited, or a restrictive network). Fetches a wider page
// than it displays (30, not 3) purely so a pinned repo further down the
// "last updated" order still has a chance to be found by selectRepos.
export default function GithubActivity() {
  const [state, setState] = useState<State>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false
    fetch(`https://api.github.com/users/anaybaid7/repos?sort=updated&per_page=30`)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.json()
      })
      .then((repos: Repo[]) => {
        if (!cancelled) setState({ status: 'ok', repos: selectRepos(repos, profile.pinnedRepos) })
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'error' })
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="rounded-md px-3 py-3" style={{ background: 'var(--screen-bg-2)', border: '1px solid var(--line)' }}>
      <p className="text-xs font-semibold mb-2" style={{ color: 'var(--ink-dim)' }}>
        LATEST FROM GITHUB (LIVE)
      </p>

      {state.status === 'loading' && (
        <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>
          fetching…
        </p>
      )}

      {state.status === 'error' && (
        <p className="text-sm">
          couldn't reach the GitHub API right now,{' '}
          <a href={profile.links.github} target="_blank" rel="noreferrer" style={{ color: 'var(--c-home)' }}>
            see github.com/anaybaid7
          </a>{' '}
          directly.
        </p>
      )}

      {state.status === 'ok' && state.repos.length === 0 && (
        <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>no public repos found.</p>
      )}

      {state.status === 'ok' && state.repos.length > 0 && (
        <ul className="flex flex-col gap-2">
          {state.repos.map((r) => (
            <li key={r.name} className="text-sm">
              <a href={r.html_url} target="_blank" rel="noreferrer" className="font-semibold" style={{ color: 'var(--ink-bright)' }}>
                {r.name}
              </a>{' '}
              <span style={{ color: 'var(--ink-dim)' }}>
                {r.language ? `${r.language} · ` : ''}updated {formatRelativeTime(r.pushed_at)}
              </span>
              {r.description && <div style={{ color: 'var(--ink-dim)' }}>{r.description}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
