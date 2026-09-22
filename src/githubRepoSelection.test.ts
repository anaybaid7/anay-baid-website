import { describe, it, expect } from 'vitest'
import { selectRepos, type Repo } from './githubRepoSelection'

function repo(name: string, pushed_at = '2026-01-01T00:00:00Z'): Repo {
  return { name, description: null, language: null, html_url: `https://github.com/x/${name}`, pushed_at }
}

describe('selectRepos', () => {
  it('with no pinned repos, falls back to the first 3 (most recently updated, per the API sort)', () => {
    const all = [repo('a'), repo('b'), repo('c'), repo('d')]
    expect(selectRepos(all, []).map((r) => r.name)).toEqual(['a', 'b', 'c'])
  })

  it('surfaces a pinned repo even if it is not among the most recently updated', () => {
    // "old-but-real" sits last in the "most recently updated" order, exactly
    // the case that used to get a scratch repo shown instead of real work.
    const all = [repo('scratch-1'), repo('scratch-2'), repo('scratch-3'), repo('old-but-real')]
    const selected = selectRepos(all, ['old-but-real'])
    expect(selected.map((r) => r.name)).toContain('old-but-real')
    expect(selected).toHaveLength(3)
  })

  it('orders pinned repos first, in the order given', () => {
    const all = [repo('noise'), repo('second-pin'), repo('first-pin')]
    const selected = selectRepos(all, ['first-pin', 'second-pin'])
    expect(selected.map((r) => r.name)).toEqual(['first-pin', 'second-pin', 'noise'])
  })

  it('tops up with recently-updated repos when fewer than 3 are pinned', () => {
    const all = [repo('a'), repo('b'), repo('c'), repo('d')]
    const selected = selectRepos(all, ['c'])
    expect(selected).toHaveLength(3)
    expect(selected[0].name).toBe('c')
  })

  it('ignores a pinned name that does not match any real repo, without leaving a gap', () => {
    const all = [repo('a'), repo('b'), repo('c')]
    const selected = selectRepos(all, ['does-not-exist'])
    expect(selected).toHaveLength(3)
    expect(selected.map((r) => r.name)).toEqual(['a', 'b', 'c'])
  })

  it('never returns duplicates when a pinned repo would also be picked up by top-up', () => {
    const all = [repo('a'), repo('b'), repo('c')]
    const selected = selectRepos(all, ['a'])
    const names = selected.map((r) => r.name)
    expect(new Set(names).size).toBe(names.length)
  })
})
