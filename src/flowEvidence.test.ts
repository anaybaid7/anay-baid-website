import { describe, it, expect } from 'vitest'
import { stepsUsing } from './flowEvidence'

describe('steps using a skill', () => {
  it('finds the flow steps that show a skill, one per flow', () => {
    const t = stepsUsing('Terraform', 5)
    expect(t.some((h) => h.id === 'job-purolator' && h.flowName === 'Deploying a change')).toBe(true)
    expect(new Set(t.map((h) => `${h.id}${h.flow}`)).size).toBe(t.length)
  })

  it('matches whole words and skips very short names', () => {
    expect(stepsUsing('R')).toEqual([])
    expect(stepsUsing('Socket.IO').length).toBeGreaterThan(0)
  })
})
