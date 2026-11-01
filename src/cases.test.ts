import { describe, it, expect, afterEach } from 'vitest'
import { CASE_IDS, caseFromUrl, casePath, caseSlug } from './cases'

afterEach(() => history.replaceState(null, '', '/'))

describe('case study addresses', () => {
  it('gives every case study a short, unique path', () => {
    const slugs = CASE_IDS.map(caseSlug)
    expect(new Set(slugs).size).toBe(slugs.length)
    expect(casePath('job-purolator')).toBe('/work/purolator/')
    expect(casePath('project-insightvault')).toBe('/work/insightvault/')
  })

  it('opens from its path or from ?case=', () => {
    history.replaceState(null, '', '/work/starrez/')
    expect(caseFromUrl()).toBe('project-starrez-enterprise-automation-suite')
    history.replaceState(null, '', '/?case=project-legacybridge-ai')
    expect(caseFromUrl()).toBe('project-legacybridge-ai')
    history.replaceState(null, '', '/work/nope/')
    expect(caseFromUrl()).toBeNull()
  })
})
