// Public repo data from GitHub's API, fetched at most once per page view and
// shared by everything that shows it. Unauthenticated calls are limited to
// 60 an hour per visitor, so this stays at one list call, plus a commit
// lookup only for a repo that isn't in the list.

export interface Repo {
  name: string
  html_url: string
  description: string | null
  language: string | null
  pushed_at: string
  fork: boolean
}

export interface Commit {
  message: string
  url: string
  date: string
}

const API = 'https://api.github.com'
let list: Promise<Repo[]> | null = null
const commits = new Map<string, Promise<Commit | null>>()

const json = (url: string) => fetch(url, { headers: { Accept: 'application/vnd.github+json' } }).then((r) => (r.ok ? r.json() : Promise.reject(r.status)))

export function repos(user: string) {
  list ??= json(`${API}/users/${user}/repos?sort=pushed&per_page=30`).catch(() => [])
  return list
}

// the newest commit on the default branch, first line of its message only
export function lastCommit(user: string, repo: string) {
  if (!commits.has(repo))
    commits.set(
      repo,
      json(`${API}/repos/${user}/${repo}/commits?per_page=1`)
        .then(([c]) => (c ? { message: String(c.commit.message).split('\n')[0], url: c.html_url, date: c.commit.author?.date ?? c.commit.committer?.date } : null))
        .catch(() => null),
    )
  return commits.get(repo)!
}

export const ago = (iso: string, now = Date.now()) => {
  const mins = Math.max(1, Math.round((now - Date.parse(iso)) / 60000))
  const [n, unit] = mins < 60 ? [mins, 'minute'] : mins < 1440 ? [Math.floor(mins / 60), 'hour'] : mins < 43200 ? [Math.floor(mins / 1440), 'day'] : mins < 525600 ? [Math.floor(mins / 43200), 'month'] : [Math.floor(mins / 525600), 'year']
  return `${n} ${unit}${n === 1 ? '' : 's'} ago`
}

// owner and repo from a github.com link, if it is one
export function repoOf(url?: string) {
  const m = url?.match(/github\.com\/([^/]+)\/([^/#?]+)/)
  return m ? { user: m[1], repo: m[2].replace(/\.git$/, '') } : null
}

export interface Change {
  number: number
  title: string
  url: string
  merged: string
}

let changes: Promise<Change[]> | null = null

// the most recently merged pull requests on a repo
export function merged(user: string, repo: string, n = 6) {
  changes ??= json(`${API}/repos/${user}/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=30`)
    .then((all: { number: number; title: string; html_url: string; merged_at: string | null }[]) =>
      all
        .filter((p) => p.merged_at)
        .sort((a, b) => Date.parse(b.merged_at!) - Date.parse(a.merged_at!))
        .slice(0, n)
        .map((p) => ({ number: p.number, title: p.title, url: p.html_url, merged: p.merged_at! })),
    )
    .catch(() => [])
  return changes
}
