import { describe, it, expect } from 'vitest'
import { complete, run } from './terminal'

describe('terminal', () => {
  it('lists work and prints one entry', () => {
    expect(run('ls jobs').lines.join('\n')).toContain('purolator')
    const cat = run('cat insight').lines.join('\n')
    expect(cat).toContain('InsightVault')
    expect(cat).toContain('stack: ')
  })

  it('opens an entry on a given tab', () => {
    expect(run('open star code').action).toEqual({ kind: 'open', id: 'project-starrez-enterprise-automation-suite', tab: 'code' })
  })

  it('searches bullets and stacks', () => {
    expect(run('grep terraform').lines.some((l) => l.startsWith('purolator'))).toBe(true)
    expect(run('grep zzzz').lines[0]).toContain('no matches')
  })

  it('filters by a real skill and rejects anything else', () => {
    expect(run('filter docker').action).toEqual({ kind: 'filter', skills: ['Docker'] })
    expect(run('filter cobol').action).toBeUndefined()
    expect(run('filter clear').action).toEqual({ kind: 'filter', skills: [] })
  })

  it('reports unknown commands', () => {
    expect(run('sudo hire').lines[0]).toBe('sudo: command not found, try help')
  })

  it('completes commands and names', () => {
    expect(complete('gr')).toBe('grep ')
    expect(complete('cat insi')).toBe('cat insightvault ')
    expect(complete('theme d')).toBe('theme dark ')
    expect(complete('c')).toBe('c')
  })
})

describe('terminal, inside the work', () => {
  it('explains why an entry exists', () => {
    const out = run('why starrez').lines.join('\n')
    expect(out).toContain('before  I worked the front desk')
    expect(out).toContain('result  80%')
  })

  it('lists flows and traces one step into the drawer', () => {
    expect(run('flows battleship').lines[0]).toBe('1  A shot is fired')
    const t = run('trace battleship 1 2')
    expect(t.lines[0]).toBe('A shot is fired, step 2: The server checks the move')
    expect(t.action).toEqual({ kind: 'open', id: 'project-battleship-for-purolator', tab: 'how', at: { flow: 1, step: 2 } })
    expect(run('trace battleship 9 9').lines[0]).toContain('no flow 9 step 9')
  })

  it('greps inside flow payloads', () => {
    expect(run('grep repository_dispatch').lines.some((l) => l.includes('flow 1 step'))).toBe(true)
  })
})
