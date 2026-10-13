import { useEffect, useMemo, useState } from 'react'

interface GhEvent {
  type: string
  created_at: string
  repo: { name: string }
}

const DAYS = 91 // thirteen weeks, as far back as GitHub's public events go

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const LABELS: Record<string, string> = {
  PushEvent: 'pushes',
  PullRequestEvent: 'pull requests',
  CreateEvent: 'new branches and repos',
  IssuesEvent: 'issues',
}

// Public GitHub activity for the last 13 weeks, one square per day. Pulled
// live from the public events API, three pages at most.
export default function Activity({ user }: { user: string }) {
  const [events, setEvents] = useState<GhEvent[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const all: GhEvent[] = []
      for (let page = 1; page <= 3; page++) {
        const res = await fetch(`https://api.github.com/users/${user}/events/public?per_page=100&page=${page}`)
        if (!res.ok) throw new Error(String(res.status))
        const batch: GhEvent[] = await res.json()
        all.push(...batch)
        if (batch.length < 100) break
      }
      return all
    }
    load()
      .then((all) => !cancelled && setEvents(all))
      .catch(() => !cancelled && setFailed(true))
    return () => {
      cancelled = true
    }
  }, [user])

  const { days, max, total, repos, kinds } = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const counts = new Map<string, number>()
    const repoSet = new Set<string>()
    const kindCount = new Map<string, number>()
    for (const e of events ?? []) {
      const d = new Date(e.created_at)
      if ((today.getTime() - d.getTime()) / 864e5 > DAYS) continue
      counts.set(dayKey(d), (counts.get(dayKey(d)) ?? 0) + 1)
      repoSet.add(e.repo.name)
      if (LABELS[e.type]) kindCount.set(e.type, (kindCount.get(e.type) ?? 0) + 1)
    }
    // line the grid up so each column is a week starting on Sunday
    const start = new Date(today)
    start.setDate(start.getDate() - (DAYS - 1) - start.getDay())
    const list: { date: Date; n: number }[] = []
    for (const d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
      list.push({ date: new Date(d), n: counts.get(dayKey(d)) ?? 0 })
    }
    const total = [...counts.values()].reduce((a, b) => a + b, 0)
    return {
      days: list,
      max: Math.max(1, ...counts.values()),
      total,
      repos: repoSet.size,
      kinds: [...kindCount.entries()].sort((a, b) => b[1] - a[1]),
    }
  }, [events])

  if (failed) return null

  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4)))

  return (
    <div className="activity">
      <div className="activity-grid" role="img" aria-label={`${total} public GitHub events in the last 13 weeks`}>
        {days.map(({ date, n }) => (
          <span
            key={date.toISOString()}
            className={`cell l${events ? level(n) : 0}`}
            title={`${date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}: ${n} ${n === 1 ? 'event' : 'events'}`}
          />
        ))}
      </div>
      <p className="activity-sum">
        {events === null ? (
          'Loading activity...'
        ) : (
          <>
            {total} public events across {repos} {repos === 1 ? 'repo' : 'repos'} in the last 13 weeks
            {kinds.length > 0 && <>, mostly {kinds.slice(0, 2).map(([k, n]) => `${n} ${LABELS[k]}`).join(' and ')}</>}.
          </>
        )}
      </p>
    </div>
  )
}
