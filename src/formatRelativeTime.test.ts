import { describe, it, expect } from 'vitest'
import { formatRelativeTime } from './formatRelativeTime'

describe('formatRelativeTime', () => {
  it('renders a recent timestamp as "just now"', () => {
    expect(formatRelativeTime(new Date().toISOString())).toBe('just now')
  })

  it('renders hours ago for same-day timestamps', () => {
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago')
  })

  it('renders days ago within the last month', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(fiveDaysAgo)).toBe('5d ago')
  })

  it('renders months ago beyond 30 days', () => {
    const twoMonthsAgo = new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(twoMonthsAgo)).toBe('2mo ago')
  })

  it('renders years ago beyond a year', () => {
    const twoYearsAgo = new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(twoYearsAgo)).toBe('2y ago')
  })
})
