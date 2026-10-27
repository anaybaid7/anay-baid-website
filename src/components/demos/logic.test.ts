import { describe, it, expect } from 'vitest'
import { score, decide } from './score'
import { compareSchemas } from './compareSchemas'
import { planBuild } from './planBuild'

describe('demo logic', () => {
  it('scores a quiet transaction low and a risky one high', () => {
    const quiet = score({ amount: 40, hour: 13, newMerchant: false, abroad: false, lastHour: 0 })
    const risky = score({ amount: 3000, hour: 3, newMerchant: true, abroad: true, lastHour: 7 })
    expect(quiet.probability).toBeLessThan(0.1)
    expect(risky.probability).toBeGreaterThan(0.9)
    expect(risky.fired).toHaveLength(3)
    expect(decide(quiet.probability, quiet.fired, 0.5)).toBe(false)
  })

  it('finds missing columns, type drift and row gaps', () => {
    const issues = compareSchemas([['a', 'INT'], ['b', 'DATE']], [['b', 'TEXT']], 10, 7).map((i) => i.problem)
    expect(issues).toEqual(['a is missing on-prem', 'b is DATE in Azure but TEXT on-prem', 'Row counts differ by 3'])
  })

  it('only builds what changed', () => {
    const out = planBuild(['api', 'web', 'docs'], ['web'], 'dev').join('\n')
    expect(out).toContain('triggering 1 of 3 builds')
    expect(out).toContain('skipped api, docs')
  })
})
