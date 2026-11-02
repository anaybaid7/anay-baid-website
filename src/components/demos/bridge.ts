// The GET /api/v1/accounts/:accountNumber route LegacyBridge generated, run
// in the browser. Same order as the generated Express handler: validate the
// number, check Redis, call GETACCT through the connector, map the record to
// JSON, then cache it for five minutes.

import { decode, type Layout } from './copybook'
import { rng } from './sales'

export const TTL = 300 // seconds, setex(cacheKey, 300, ...)
export const RETRIES = 2 // CobolConnector({ timeout: 5000, retries: 2 })

export interface Cached {
  value: Record<string, unknown>
  expires: number
}

export interface World {
  now: number // seconds
  cache: Record<string, Cached | { value: null; expires: number }>
  // the indexed ACCTMAST file, keyed by ACCT-NUMBER
  file: Record<string, string>
  mainframeUp: boolean
  // consecutive failed calls, and when an open breaker lets traffic through again
  failures?: number
  openUntil?: number
}

// The generated route only has the cache. The other two are what I'd add:
// remembering a 404 for a minute, and a breaker that stops calling a
// mainframe that has timed out three times in a row.
export interface Opts {
  ttl: number
  notFoundTtl: number
  breaker: boolean
  // how long past expiry a cached copy can still answer when CICS can't
  staleFor: number
}
export const GENERATED: Opts = { ttl: TTL, notFoundTtl: 0, breaker: false, staleFor: 0 }
export const BREAK_AFTER = 3
export const BREAK_FOR = 60 // seconds

export type Step = { at: 'api' | 'zod' | 'redis' | 'cics' | 'map' | 'breaker'; text: string; tone?: 'ok' | 'warn' | 'err' }

export interface Result {
  status: 200 | 400 | 404 | 500 | 503
  body: Record<string, unknown>
  steps: Step[]
  world: World
  mainframeCalls: number
  timedOut: boolean
  stale: boolean
}

export const cacheKey = (n: string) => `account:${n}`

export function handle(world: World, layout: Layout, accountNumber: string, requestId: string, opts: Opts = GENERATED): Result {
  const { ttl } = opts
  const steps: Step[] = [{ at: 'api', text: `GET /api/v1/accounts/${accountNumber}` }]
  let timedOut = false
  const done = (status: Result['status'], body: Record<string, unknown>, w = world, calls = 0, stale = false): Result => ({ status, body, steps, world: w, mainframeCalls: calls, timedOut, stale })
  // an expired copy that is still young enough to fall back on
  const fallback = (w: World, calls: number) => {
    const old = w.cache[cacheKey(accountNumber)]
    if (!opts.staleFor || !old?.value || w.now - old.expires > opts.staleFor) return null
    const age = w.now - old.expires + ttl
    steps.push({ at: 'redis', text: `serving the copy from ${Math.round(age / 60)} min ago, marked stale`, tone: 'warn' })
    return done(200, { success: true, data: old.value, metadata: { source: 'COBOL-CICS', cached: true, stale: true, ageSeconds: age } }, w, calls, true)
  }

  if (!/^\d{10}$/.test(accountNumber)) {
    steps.push({ at: 'zod', text: 'Account number must be 10 digits', tone: 'err' })
    return done(400, { error: 'Validation Error', message: 'Invalid account number format' })
  }
  steps.push({ at: 'zod', text: 'accountNumberSchema passed', tone: 'ok' })

  const key = cacheKey(accountNumber)
  const hit = world.cache[key]
  if (hit && hit.expires > world.now && hit.value === null) {
    steps.push({ at: 'redis', text: `HIT ${key}, known missing`, tone: 'ok' })
    return done(404, { error: 'Not Found', message: `Account ${accountNumber} does not exist` })
  }
  if (hit && hit.expires > world.now) {
    steps.push({ at: 'redis', text: `HIT ${key}, ${hit.expires - world.now}s left`, tone: 'ok' })
    return done(200, { success: true, data: hit.value, metadata: { source: 'COBOL-CICS', cached: true } })
  }
  steps.push({ at: 'redis', text: hit ? `${key} expired` : `MISS ${key}`, tone: 'warn' })

  if (opts.breaker && (world.openUntil ?? 0) > world.now) {
    steps.push({ at: 'breaker', text: `open for ${world.openUntil! - world.now}s more, not calling GETACCT`, tone: 'warn' })
    const old = fallback(world, 0)
    if (old) return old
    return done(503, { error: 'Service Unavailable', message: 'Legacy system is down, try again shortly', requestId })
  }

  if (!world.mainframeUp) {
    for (let i = 0; i <= RETRIES; i++) steps.push({ at: 'cics', text: `GETACCT timed out after 5000ms${i < RETRIES ? ', retrying' : ''}`, tone: 'err' })
    const failures = (world.failures ?? 0) + 1
    const trip = opts.breaker && failures >= BREAK_AFTER
    if (trip) steps.push({ at: 'breaker', text: `${failures} failures in a row, open for ${BREAK_FOR}s`, tone: 'err' })
    // after a trip, one more failure is enough to open it again
    const w = { ...world, failures: trip ? BREAK_AFTER - 1 : failures, openUntil: trip ? world.now + BREAK_FOR : world.openUntil }
    timedOut = true
    const old = fallback(w, RETRIES + 1)
    if (old) return old
    return done(500, { error: 'Internal Server Error', message: 'Failed to retrieve account data from legacy system', requestId }, w, RETRIES + 1)
  }
  world = { ...world, failures: 0 }

  steps.push({ at: 'cics', text: `GETACCT, ACCT-NUMBER=${accountNumber.padStart(10, '0')}` })
  const record = world.file[accountNumber]
  if (!record) {
    steps.push({ at: 'cics', text: "INVALID KEY, 'ACCOUNT NOT FOUND'", tone: 'warn' })
    const w = opts.notFoundTtl > 0 ? { ...world, cache: { ...world.cache, [key]: { value: null, expires: world.now + opts.notFoundTtl } } } : world
    if (w !== world) steps.push({ at: 'redis', text: `SETEX ${key} ${opts.notFoundTtl} missing` })
    return done(404, { error: 'Not Found', message: `Account ${accountNumber} does not exist` }, w, 1)
  }

  const { json, errors } = decode(layout, record)
  steps.push({ at: 'map', text: errors.length ? `mapped with ${errors.length} bad field${errors.length > 1 ? 's' : ''}` : `mapped ${Object.keys(json).length} fields to JSON`, tone: errors.length ? 'warn' : 'ok' })
  if (ttl <= 0) return done(200, { success: true, data: json, metadata: { source: 'COBOL-CICS', cached: false } }, world, 1)
  const next = { ...world, cache: { ...world.cache, [key]: { value: json, expires: world.now + ttl } } }
  steps.push({ at: 'redis', text: `SETEX ${key} ${ttl}` })
  return done(200, { success: true, data: json, metadata: { source: 'COBOL-CICS', cached: false } }, next, 1)
}

export type Outcome = 'hit' | 'miss' | 'missing' | 'failed' | 'shed' | 'stale'
export const OUTAGE = [60, 84] // requests sent while the mainframe is down

// 120 reads, 15 seconds apart, mostly for a few busy accounts and some for
// numbers that aren't on file, with the mainframe down for a stretch in the
// middle. Counts how often CICS had to answer and how long callers sat on
// timeouts, using the connector's 5 second timeout and 2 retries.
export function replay(world: World, layout: Layout, opts: Opts, n = 120, gap = 15, seed = 7) {
  const rand = rng(seed)
  const busy = Object.keys(world.file)
  // a couple of bad numbers that a client keeps retrying
  const strays = ['1000000001', '1000007920']
  let w: World = { ...world, cache: {}, now: 0, failures: 0, openUntil: 0 }
  const out: Outcome[] = []
  let calls = 0
  let waited = 0
  let timeouts = 0
  for (let i = 0; i < n; i++) {
    const r = rand()
    const no = r < 0.5 ? busy[0] : r < 0.75 ? busy[1] : r < 0.83 ? busy[2] : strays[Math.floor(rand() * strays.length)]
    w = { ...w, mainframeUp: i < OUTAGE[0] || i >= OUTAGE[1] }
    const res = handle(w, layout, no, `replay-${i}`, opts)
    calls += res.mainframeCalls
    if (res.timedOut) {
      timeouts++
      waited += 5 * (RETRIES + 1)
    }
    out.push(res.stale ? 'stale' : res.status === 503 ? 'shed' : res.status === 500 ? 'failed' : !res.mainframeCalls ? 'hit' : res.status === 404 ? 'missing' : 'miss')
    w = { ...res.world, now: res.world.now + gap }
  }
  const count = (o: Outcome) => out.filter((x) => x === o).length
  return { out, calls, waited, timeouts, errors: count('failed') + count('shed') }
}
