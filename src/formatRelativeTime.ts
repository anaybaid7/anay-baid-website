// pushed_at comes back from GitHub as an absolute ISO timestamp; "updated 3d
// ago" is the actually useful reading of it at a glance. Handles singular
// units and falls back to a plain date once something's more than a month
// old, since "37d ago" stops being meaningfully more readable than the date.
export function formatRelativeTime(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  const units: [string, number][] = [
    ['y', 60 * 60 * 24 * 365],
    ['mo', 60 * 60 * 24 * 30],
  ]
  for (const [label, secondsPerUnit] of units) {
    const value = Math.floor(seconds / secondsPerUnit)
    if (value >= 1) return `${value}${label} ago`
  }
  const days = Math.floor(seconds / (60 * 60 * 24))
  if (days >= 1) return `${days}d ago`
  const hours = Math.floor(seconds / (60 * 60))
  if (hours >= 1) return `${hours}h ago`
  return 'just now'
}
