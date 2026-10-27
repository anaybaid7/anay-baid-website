import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'
import { ENTRIES } from './entries'
import { DETAILS } from './details'
import { experience, projects, allTech, education, profile, skills } from './data'

// Vitest always runs from the project root, so this resolves the same way
// regardless of which file imports it (unlike import.meta.url, which can be
// a non-file URL under some transform pipelines).
const publicDir = resolve(process.cwd(), 'public')

describe('data integrity', () => {
  it('has no duplicate entries in allTech', () => {
    const unique = new Set(allTech)
    expect(unique.size).toBe(allTech.length)
  })

  it('every tech tag used in experience appears in allTech', () => {
    for (const e of experience) {
      for (const tech of e.tech) {
        expect(allTech).toContain(tech)
      }
    }
  })

  it('every tech tag used in projects appears in allTech', () => {
    for (const p of projects) {
      for (const tech of p.tech) {
        expect(allTech).toContain(tech)
      }
    }
  })

  it('no experience entry has empty bullets or tech', () => {
    for (const e of experience) {
      expect(e.bullets.length).toBeGreaterThan(0)
      expect(e.tech.length).toBeGreaterThan(0)
      for (const b of e.bullets) {
        expect(b.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('no project entry has empty bullets or tech', () => {
    for (const p of projects) {
      expect(p.bullets.length).toBeGreaterThan(0)
      expect(p.tech.length).toBeGreaterThan(0)
    }
  })

  it('every project link, if present, is a valid absolute URL', () => {
    for (const p of projects) {
      if (p.link) {
        expect(() => new URL(p.link!)).not.toThrow()
      }
    }
  })

  it('every social/org link is a valid absolute URL', () => {
    expect(() => new URL(profile.links.github)).not.toThrow()
    expect(() => new URL(profile.links.linkedin)).not.toThrow()
    expect(() => new URL(profile.links.devpost)).not.toThrow()
    for (const e of experience) {
      expect(() => new URL(e.orgUrl)).not.toThrow()
    }
  })

  it('email looks like an email', () => {
    expect(profile.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)
  })

  it('education has at least one highlight', () => {
    expect(education.highlights.length).toBeGreaterThan(0)
  })

  it('every experience and education logo file actually exists in public/', () => {
    // Catches a typo'd path (the kind TypeScript can't, since it's just a
    // string) before it ships as a broken image instead of a logo.
    for (const e of experience) {
      expect(e.logo.startsWith('/')).toBe(true)
      expect(existsSync(`${publicDir}${e.logo}`)).toBe(true)
    }
    expect(education.logo.startsWith('/')).toBe(true)
    expect(existsSync(`${publicDir}${education.logo}`)).toBe(true)
  })

  it('the technical skills section has entries in every category', () => {
    expect(skills.languages.length).toBeGreaterThan(0)
    expect(skills.frameworks.length).toBeGreaterThan(0)
    expect(skills.devops.length).toBeGreaterThan(0)
  })

  it('the downloadable resume PDF file exists', () => {
    // The actual file every download button serves (see downloadResume.ts).
    // If this ever goes missing, every download button 404s silently.
    expect(existsSync(`${publicDir}/Anay_Baid_Resume.pdf`)).toBe(true)
  })
})

describe('headline numbers', () => {
  it('every job and project has one', () => {
    for (const e of experience) expect(e.highlight, e.org).toBeDefined()
    for (const p of projects) expect(p.highlight, p.title).toBeDefined()
  })
})

describe('drawer details', () => {
  it('belong to real entries, and every edge joins two real boxes', () => {
    const ids = new Set(ENTRIES.map((e) => e.id))
    for (const [id, d] of Object.entries(DETAILS)) {
      expect(ids.has(id), id).toBe(true)
      const nodes = new Set(d.arch.nodes.map((n) => n.id))
      for (const e of d.arch.edges) {
        expect(nodes.has(e.from), `${id} ${e.from}`).toBe(true)
        expect(nodes.has(e.to), `${id} ${e.to}`).toBe(true)
      }
      for (const g of d.arch.groups ?? []) for (const n of g.nodes) expect(nodes.has(n), `${id} group ${n}`).toBe(true)
    }
  })

  it('never put two boxes in the same spot', () => {
    for (const [id, d] of Object.entries(DETAILS)) {
      const spots = d.arch.nodes.map((n) => `${n.col},${n.row}`)
      expect(new Set(spots).size, id).toBe(spots.length)
    }
  })

  it("never draw a group box around a box that isn't in the group", () => {
    for (const [id, d] of Object.entries(DETAILS)) {
      for (const g of d.arch.groups ?? []) {
        const members = d.arch.nodes.filter((n) => g.nodes.includes(n.id))
        const [c0, c1] = [Math.min(...members.map((n) => n.col)), Math.max(...members.map((n) => n.col))]
        const [r0, r1] = [Math.min(...members.map((n) => n.row)), Math.max(...members.map((n) => n.row))]
        for (const n of d.arch.nodes) {
          if (g.nodes.includes(n.id)) continue
          const inside = n.col >= c0 && n.col <= c1 && n.row >= r0 && n.row <= r1
          expect(inside, `${id}: ${n.id} sits inside "${g.label}"`).toBe(false)
        }
      }
    }
  })

  it('give every job a drawer', () => {
    for (const e of ENTRIES.filter((x) => x.kind === 'job')) expect(DETAILS[e.id], e.id).toBeDefined()
  })
})
