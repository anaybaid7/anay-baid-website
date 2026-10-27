import { describe, it, expect } from 'vitest'
import { uses, whereUsed, slug } from './evidence'

describe('skill evidence', () => {
  it('matches across naming differences', () => {
    expect(uses('React.js', 'React')).toBe(true)
    expect(uses('AWS', 'AWS S3')).toBe(true)
    expect(uses('Java', 'JavaScript')).toBe(false)
    expect(uses('CI/CD', 'CI/CD')).toBe(true)
    expect(uses('S3', 'AWS S3')).toBe(true)
    expect(uses('ECS/EKS', 'ECS/Fargate')).toBe(true)
    expect(uses('REST APIs', 'REST')).toBe(true)
  })
  it('finds where Docker was used', () => {
    const labels = whereUsed('Docker').map((e) => e.label)
    expect(labels).toContain('Purolator')
    expect(labels).toContain('Nationwide Appraisals')
  })
  it('returns nothing for a skill with no tagged work', () => {
    expect(whereUsed('Kotlin')).toEqual([])
  })
  it('makes clean slugs', () => {
    expect(slug('Pashu (Animal Welfare Game)')).toBe('pashu')
    expect(slug('CI/CD Build Automation Tool')).toBe('ci-cd-build-automation-tool')
  })
})
