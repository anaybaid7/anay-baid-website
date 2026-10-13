import { describe, it, expect } from 'vitest'
import { parsePeriod, monthIndex, monthLabel } from './timeline'

describe('parsePeriod', () => {
  it('reads month names', () => {
    expect(parsePeriod('May 2025 to August 2025')).toEqual({ start: monthIndex(2025, 4), end: monthIndex(2025, 7) })
  })
  it('reads a term and present', () => {
    const now = new Date(2026, 9, 13)
    expect(parsePeriod('Spring 2026 to Present', now)).toEqual({ start: monthIndex(2026, 4), end: monthIndex(2026, 9) })
  })
  it('gives up on nonsense', () => {
    expect(parsePeriod('sometime')).toBeNull()
  })
  it('labels months', () => {
    expect(monthLabel(monthIndex(2024, 0))).toBe('Jan 2024')
  })
})
