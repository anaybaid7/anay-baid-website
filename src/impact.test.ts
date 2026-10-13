import { describe, it, expect } from 'vitest'
import { splitImpact } from './impact'
import { experience, projects, education } from './data'

const hits = (t: string) => splitImpact(t).filter((p) => p.hit).map((p) => p.text)

describe('impact numbers', () => {
  it('finds results and ranges', () => {
    expect(hits('Cut planning turnaround 10 to 20x and diagnostics 40% by owning')).toEqual(['10 to 20x', '40%'])
    expect(hits('processing 100K+ forecast records')).toEqual(['100K+'])
    expect(hits('for 10,000+ users')).toEqual(['10,000+'])
  })
  it('leaves course codes and versions alone', () => {
    expect(hits('100% in CS 445 and CS 446')).toEqual(['100%'])
    expect(hits('integrating Java 8 JDK with Layer 3 configs')).toEqual([])
  })
  it('keeps the text intact', () => {
    const t = experience[0].bullets[0]
    expect(splitImpact(t).map((p) => p.text).join('')).toBe(t)
  })
  it('lists what it catches across the site', () => {
    const all = [...experience.flatMap((e) => e.bullets), ...projects.flatMap((p) => [p.description, ...p.bullets]), ...education.highlights].flatMap(hits)
    expect(all.length).toBeGreaterThan(10)
  })
})
