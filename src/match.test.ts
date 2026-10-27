import { describe, it, expect } from 'vitest'
import { matchPosting } from './match'

const skills = (text: string) => matchPosting(text).map((m) => m.skill)

describe('matchPosting', () => {
  it('finds stack items under their usual names and aliases', () => {
    const found = skills('Strong ReactJS and Node, Postgres, k8s, Amazon Web Services and Terraform.')
    for (const s of ['React.js', 'Node.js', 'PostgreSQL', 'Kubernetes', 'AWS', 'Terraform']) expect(found).toContain(s)
  })

  it('handles names with symbols in them', () => {
    expect(skills('Modern C++ and C# services')).toEqual(expect.arrayContaining(['C++', 'C#']))
  })

  it("doesn't read single letters as languages", () => {
    const found = skills('Grade C or better. R&D team. Plan A, B and C.')
    expect(found).not.toContain('C')
    expect(found).not.toContain('R')
  })

  it('does count them when the posting clearly means the language', () => {
    expect(skills('Systems work in C and some analysis using R')).toEqual(expect.arrayContaining(['C', 'R']))
  })

  it('says where each match was used on the page', () => {
    const docker = matchPosting('Docker').find((m) => m.skill === 'Docker')!
    expect(docker.where.map((w) => w.label)).toContain('Purolator')
  })

  it('returns nothing for empty text', () => {
    expect(matchPosting('   ')).toEqual([])
  })
})
