import { describe, it, expect } from 'vitest'
import { score, decide } from './score'
import { compareSchemas } from './compareSchemas'
import { planBuild, serviceOf } from './planBuild'
import { check, merge, runPipeline } from './pipeline'
import { checkSale, makeSale, rng } from './sales'
import { MODULES, runTask } from './workflow'
import { next, points } from './npc'
import { initial, matchRoute, reducer, validateEvent } from './appStore'
import { botShot, FLEET, N, placeFleet } from '../../battleship'

const ROWS = [
  { terminal: 412, week: 44, volume: 100 },
  { terminal: 418, week: 44, volume: 200 },
]

describe('pipeline', () => {
  it('runs every task when the data is clean', () => {
    const r = runPipeline(ROWS, new Map())
    expect(r.ok).toBe(true)
    expect(r.runs.map((t) => t.state)).toEqual(Array(6).fill('success'))
  })

  it('stops at validate and skips everything downstream', () => {
    const r = runPipeline([...ROWS, { terminal: 999, week: 60, volume: -1 }], new Map())
    expect(r.runs.map((t) => t.state)).toEqual(['success', 'failed', 'upstream_failed', 'upstream_failed', 'upstream_failed', 'upstream_failed'])
    expect(r.runs[1].log[0]).toBe('row 3: unknown terminal 999')
  })

  it('reconciles with MERGE semantics, so a rerun updates instead of doubling', () => {
    const first = merge(new Map(), ROWS)
    const again = merge(first.next, ROWS)
    expect([first.inserted, first.updated]).toEqual([2, 0])
    expect([again.inserted, again.updated, again.next.size]).toEqual([0, 2, 2])
  })

  it('checks week range and negative volume', () => {
    expect(check({ terminal: 412, week: 0, volume: 1 })).toMatch(/out of range/)
    expect(check({ terminal: 412, week: 4, volume: -5 })).toMatch(/negative/)
  })
})

describe('sales stream', () => {
  it('replays the same stream from the same seed', () => {
    const a = rng(3)
    const b = rng(3)
    expect(makeSale(1, a, false)).toEqual(makeSale(1, b, false))
  })

  it('holds back duplicates, missing showtimes and negative amounts', () => {
    const ok = { id: 1, theatre: 'Downtown', show: 88001, tickets: 2, gross: 30 }
    expect(checkSale(ok, new Set())).toBeNull()
    expect(checkSale(ok, new Set([1]))).toMatch(/duplicate/)
    expect(checkSale({ ...ok, show: null }, new Set())).toMatch(/showtime/)
    expect(checkSale({ ...ok, gross: -3 }, new Set())).toMatch(/negative/)
  })
})

describe('fraud score', () => {
  it('scores a quiet transaction low and a risky one high', () => {
    const quiet = score({ amount: 40, hour: 13, newMerchant: false, abroad: false, lastHour: 0 })
    const risky = score({ amount: 3000, hour: 3, newMerchant: true, abroad: true, lastHour: 7 })
    expect(quiet.probability).toBeLessThan(0.1)
    expect(risky.probability).toBeGreaterThan(0.9)
    expect(risky.fired).toHaveLength(3)
    expect(decide(quiet.probability, quiet.fired, 0.5)).toBe(false)
  })
})

describe('reconcile', () => {
  it('finds missing columns, type drift and row gaps, each with a fix', () => {
    const issues = compareSchemas([['a', 'INT'], ['b', 'DATE']], [['b', 'TEXT']], 10, 7)
    expect(issues.map((i) => i.problem)).toEqual(['a is missing on-prem', 'b is DATE in Azure but TEXT on-prem', 'Row counts differ by 3'])
    expect(issues[0].fix).toBe('ALTER TABLE box_office ADD a INT;')
  })
})

describe('build trigger', () => {
  it('maps files to services and only builds what changed', () => {
    expect(serviceOf('web/src/App.tsx')).toBe('web')
    const p = planBuild(['web/src/App.tsx', 'web/x.ts'], 'dev', 'main')
    expect(p.build).toEqual(['web'])
    expect(p.skip).toEqual(['api', 'worker', 'docs'])
  })

  it('refuses to deploy a feature branch to prod', () => {
    expect(planBuild(['api/a.py'], 'prod', 'feature/login').ok).toBe(false)
    expect(planBuild(['api/a.py'], 'prod', 'main').ok).toBe(true)
  })
})

describe('extension workflow', () => {
  it('fills the log from the page', () => {
    const r = runTask(MODULES[0], { Resident: 'A', Room: 'R1', 'Student #': '1', Packages: '2 waiting' })
    expect(r.entry?.Packages).toBe('2 picked up')
    expect(r.stages.every((s) => s.ok)).toBe(true)
  })

  it('stops at validate when there is nothing to pick up', () => {
    const r = runTask(MODULES[0], { Resident: 'A', Room: 'R1', 'Student #': '1', Packages: '0 waiting' })
    expect(r.entry).toBeNull()
    expect(r.stages.at(-1)).toMatchObject({ stage: 'Validate', ok: false })
  })
})

describe('npc state machine', () => {
  it('moves on known events, ignores the rest, and scores state changes', () => {
    expect(next('Wandering', 'PlayerNear')).toBe('Following')
    expect(next('Sleeping', 'Fed')).toBeNull()
    expect(points('Hungry', 'Eating')).toBe(10)
    expect(points('Hungry', 'Sleeping')).toBe(-5)
  })
})

describe('routing app', () => {
  it('matches static routes before params', () => {
    expect(matchRoute('/events/new')?.route).toBe('/events/new')
    expect(matchRoute('/events/42')).toEqual({ route: '/events/:id', params: { id: '42' } })
    expect(matchRoute('/nope')).toBeNull()
  })

  it('updates and adds events through the reducer', () => {
    const s = reducer(initial, { type: 'events/updated', payload: { id: 42, seats: 3 } })
    expect(s.events.find((e) => e.id === 42)?.seats).toBe(3)
    expect(reducer(s, { type: 'events/added', payload: { id: 43, title: 'x', seats: 1 } }).events).toHaveLength(3)
  })

  it('validates the form', () => {
    expect(Object.keys(validateEvent({ title: '', email: 'x', seats: '0' }))).toEqual(['title', 'email', 'seats'])
    expect(validateEvent({ title: 'a', email: 'a@b.co', seats: '2' })).toEqual({})
  })
})

describe('battleship', () => {
  it('places the whole fleet without overlaps', () => {
    for (let seed = 1; seed < 50; seed++) {
      const rand = rng(seed)
      const cells = placeFleet(rand).flatMap((s) => s.cells)
      expect(cells.length).toBe(FLEET.reduce((a, f) => a + f.size, 0))
      expect(new Set(cells).size).toBe(cells.length)
    }
  })

  it('aims next to an open hit, and never repeats a shot', () => {
    const hit = 3 * N + 3
    const shot = botShot([hit], [hit])
    expect([hit - N, hit + N, hit - 1, hit + 1]).toContain(shot)
    const all = Array.from({ length: N * N - 1 }, (_, i) => i)
    expect(botShot(all, [])).toBe(N * N - 1)
  })
})
