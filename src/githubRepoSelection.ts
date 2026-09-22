export interface Repo {
  name: string
  description: string | null
  language: string | null
  html_url: string
  pushed_at: string
}

const MAX_REPOS = 3

// Picks which repos actually get shown, out of a live fetch of everything
// public. profile.pinnedRepos lets a specific repo be guaranteed a spot
// (by exact name) regardless of when it was last pushed to, since "most
// recently updated" alone can just as easily surface a scratch or
// interview-prep repo as real work. Any pinned slot that doesn't match an
// existing repo, plus any leftover slots when fewer than 3 are pinned, is
// filled from the most-recently-updated repos, so this never renders empty
// just because a pinned name was mistyped or a repo got renamed.
export function selectRepos(all: Repo[], pinned: string[]): Repo[] {
  const byName = new Map(all.map((r) => [r.name, r]))
  const selected: Repo[] = []
  for (const name of pinned) {
    const repo = byName.get(name)
    if (repo) selected.push(repo)
    if (selected.length >= MAX_REPOS) break
  }
  for (const repo of all) {
    if (selected.length >= MAX_REPOS) break
    if (!selected.includes(repo)) selected.push(repo)
  }
  return selected
}
