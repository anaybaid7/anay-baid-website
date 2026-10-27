import { describe, it, expect } from 'vitest'
import { jsonResume, personLd, plainText, vcard } from './resumeFormats'
import { experience, projects } from './data'

describe('contact card', () => {
  it('is a valid vCard with the essentials', () => {
    const card = vcard()
    expect(card.startsWith('BEGIN:VCARD\r\nVERSION:3.0')).toBe(true)
    expect(card).toContain('FN:Anay Baid')
    expect(card).toContain('EMAIL;TYPE=INTERNET:a2baid@uwaterloo.ca')
    expect(card.trim().endsWith('END:VCARD')).toBe(true)
  })
})

describe('JSON Resume', () => {
  it('carries every job and project with real dates', () => {
    const r = jsonResume()
    expect(r.work).toHaveLength(experience.length)
    expect(r.projects).toHaveLength(projects.length)
    expect(r.work[0]).toMatchObject({ startDate: '2026-05', endDate: '2026-12' })
    for (const w of r.work) expect(w.startDate).toMatch(/^\d{4}-\d{2}$/)
  })

  it('lists the hackathon wins as awards', () => {
    expect(jsonResume().awards.map((a) => a.title)).toEqual(['Best Use of GitHub', 'Best Gaming Hack (Big Blue Bubble)'])
  })
})

describe('plain text resume', () => {
  it('has every job, project and skill group, and no line wider than 80', () => {
    const text = plainText()
    for (const e of experience) expect(text).toContain(`${e.role}, ${e.org}`)
    for (const p of projects) expect(text).toContain(p.title)
    expect(text).toContain('Cloud & infra:')
    for (const line of text.split('\n')) expect(line.length).toBeLessThanOrEqual(80)
  })
})

describe('search engine data', () => {
  it('names the person, current employer and school', () => {
    const ld = personLd()
    expect(ld).toMatchObject({ '@type': 'Person', name: 'Anay Baid', worksFor: { name: 'Purolator Inc' } })
    expect(ld.knowsAbout).toContain('Python')
  })
})
