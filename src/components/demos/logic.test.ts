import { describe, it, expect } from 'vitest'
import { score, decide } from './score'
import { compareSchemas } from './compareSchemas'
import { jobsFor, payload, validate, type Inputs } from './dispatch'
import { check, merge, runPipeline } from './pipeline'
import { checkSale, makeSale, rng } from './sales'
import { findRoom, initials, keyCodes, lockoutEntry, packageEntry, readStudent } from './starrez'
import { averageShape, applyOp, editTotal, gapCheck, normalize, revert, runOp, splitWeek, sumsTo100, total } from './planner'
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

const ENV: Inputs = {
  GITHUB_REPO_NAME: 'app',
  GITHUB_USERNAME: 'me',
  GITHUB_BRANCH_NAME: 'refs/heads/main',
  ENVIRONMENT_NAME: 'staging',
  SEND_EMAIL_NOTIFICATION: false,
  INPUT_CUSTOM_DATA: '{"a": 1}',
}

describe('build trigger', () => {
  it('names the missing variable and stops', () => {
    expect(validate({ ...ENV, ENVIRONMENT_NAME: '' })).toBe('Error: Required environment variable ENVIRONMENT_NAME is missing.')
    expect(validate(ENV)).toBeNull()
  })

  it('sends one repository_dispatch with the branch, environment and custom data', () => {
    const p = payload(ENV)
    expect(p.url).toBe('https://api.github.com/repos/me/app/dispatches')
    expect(p.body).toEqual({ event_type: 'build', client_payload: { ref: 'refs/heads/main', environment: 'staging', a: 1 } })
  })

  it('runs only the matching job on the receiving side', () => {
    expect(jobsFor('staging', ['dev', 'staging', 'production']).filter((j) => j.runs).map((j) => j.job)).toEqual(['staging'])
  })
})

describe('starrez extension', () => {
  const text = 'EntryID: 1\nStudent Number 20871234\nRez 360\nRoom Space V1S-305a\n2 Parcels'

  it('makes initials either way round', () => {
    expect(initials('Lee, Sam')).toBe('S.L')
    expect(initials('Sam Lee')).toBe('S.L')
    expect(initials(null)).toBe('X.X')
  })

  it('reads and validates the student from the page text', () => {
    expect(readStudent('Lee, Sam', text)).toEqual({ fullName: 'Lee, Sam', studentNumber: '20871234', roomSpace: 'V1S-305a' })
    expect(readStudent('Lee, Sam', text.replace('20871234', '2087'))).toBeNull()
    expect(findRoom('Room A1-101a/V1S-305a')).toEqual({ room: 'V1S-305a', method: 1 })
  })

  it('formats package and lockout entries the way the desk log expects', () => {
    const s = readStudent('Lee, Sam', text)!
    expect(packageEntry(s, 2, 'Baid, Anay', new Date(2026, 1, 18, 15, 42))).toBe('S.L (20871234) V1S-305a 2 pkgs @ 3:42 pm - A.B')
    expect(lockoutEntry(s, ['L0932'], 'locked out', 'Baid, Anay')).toBe('S.L (20871234) V1S-305a KC: L0932; locked out - A.B')
  })

  it('prefers loaner keys and returns nothing when there are none', () => {
    expect(keyCodes('Bedroom: 4F21A\nLOANER L-1: L0932', '20871234')).toEqual(['L0932'])
    expect(keyCodes('Bedroom: 4F21A', '20871234')).toEqual(['4F21A'])
    expect(keyCodes('', '20871234')).toBeNull()
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

describe('forecast planner', () => {
  const w = { week: 48, pcl: 300, agent: 100, origPcl: 300, origAgent: 100 }

  it('scales PCL and Agent together when Total changes', () => {
    const e = editTotal(w, 500)
    expect([e.pcl, e.agent]).toEqual([375, 125])
    expect(editTotal({ ...w, pcl: 0, agent: 0, origPcl: 0, origAgent: 0 }, 100)).toMatchObject({ pcl: 50, agent: 50 })
  })

  it('runs operations in sequence and reverts one step at a time', () => {
    const a = runOp([w], {}, [48], '=', 500)
    const b = runOp(a.weeks, a.stacks, [48], '+', 500)
    expect(total(b.weeks[0])).toBe(1000)
    const back = revert(b.weeks, b.stacks, [48])
    expect(total(back.weeks[0])).toBe(500)
    expect(applyOp(400, '%+', 10)).toBe(440)
  })

  it('averages overlay weeks into a shape that sums to 100', () => {
    const a = averageShape([[10, 20, 70], [20, 20, 60]])!
    expect(a).toEqual([15, 20, 65])
    expect(averageShape([])).toBeNull()
  })

  it('normalizes to exactly 100 and splits without losing volume', () => {
    const n = normalize([0.4, 20.6, 20.1, 0, 19.7, 18.9, 0.5])
    expect(n.reduce((a, b) => a + b, 0)).toBeCloseTo(100, 6)
    expect(sumsTo100(n)).toBe(true)
    expect(splitWeek(18241, n).reduce((a, b) => a + b, 0)).toBe(18241)
  })

  it('flags only gaps of 50% and 100 pieces, and leaves holidays out of the baseline', () => {
    const quebec = { terminal: 744, day: 'Wed', forecast: 720, history: [{ value: 600 }, { value: 620 }, { value: 0, holiday: 'x' }, { value: 580 }] }
    expect(gapCheck(quebec).check).toBe(false)
    expect(gapCheck(quebec, false)).toMatchObject({ baseline: 450, check: true })
    expect(gapCheck({ terminal: 1, day: 'Fri', forecast: 140, history: [{ value: 80 }, { value: 90 }, { value: 70 }, { value: 85 }] }).check).toBe(false)
  })
})

describe('battleship match report', () => {
  it('counts hits, accuracy, first hit, best streak and sunk vehicles', async () => {
    const { report, openHits } = await import('../../battleship')
    const fleet = [{ name: 'Scooter', cells: [0, 1] }, { name: 'Van', cells: [10, 11, 12] }]
    const r = report([5, 0, 1, 10, 7], fleet)
    expect(r).toEqual({ shots: 5, hits: 3, accuracy: '60%', firstHit: '#2', bestStreak: 3, sunk: 1 })
    expect(openHits([0, 1, 10], fleet)).toEqual([10])
  })
})

describe('callbridge host state', () => {
  it('tracks people, the speaker and unread counts from widget events', async () => {
    const { initialHost, onEvent } = await import('./callbridge')
    let s = onEvent(initialHost, { type: 'room.READY' })
    s = onEvent(s, { type: 'participant.CHANGE', id: 1, name: 'A', isCurrent: true, isMuted: false, isLeft: false })
    s = onEvent(s, { type: 'participant.CHANGE', id: 2, name: 'B', isCurrent: false, isMuted: false, isLeft: false })
    s = onEvent(s, { type: 'conference.SPEAKER', speakerId: 2 })
    s = onEvent(s, { type: 'participant.CHANGE', id: 2, name: 'B', isCurrent: false, isMuted: false, isLeft: true })
    expect(s.people.map((p) => p.id)).toEqual([1])
    expect(s.speaker).toBeNull()
    expect(onEvent(s, { type: 'dashboard.UNREAD_MESSAGES', rooms: { a: 2, b: 3 } }).unread).toBe(5)
  })
})
