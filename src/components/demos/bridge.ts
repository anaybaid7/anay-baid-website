// The GET /api/v1/accounts/:accountNumber route LegacyBridge generated, run
// in the browser. Same order as the generated Express handler: validate the
// number, check Redis, call GETACCT through the connector, map the record to
// JSON, then cache it for five minutes.

import { decode, type Layout } from './copybook'

export const TTL = 300 // seconds, setex(cacheKey, 300, ...)
export const RETRIES = 2 // CobolConnector({ timeout: 5000, retries: 2 })

export interface Cached {
  value: Record<string, unknown>
  expires: number
}

export interface World {
  now: number // seconds
  cache: Record<string, Cached>
  // the indexed ACCTMAST file, keyed by ACCT-NUMBER
  file: Record<string, string>
  mainframeUp: boolean
}

export type Step = { at: 'api' | 'zod' | 'redis' | 'cics' | 'map'; text: string; tone?: 'ok' | 'warn' | 'err' }

export interface Result {
  status: 200 | 400 | 404 | 500
  body: Record<string, unknown>
  steps: Step[]
  world: World
  mainframeCalls: number
}

export const cacheKey = (n: string) => `account:${n}`

export function handle(world: World, layout: Layout, accountNumber: string, requestId: string): Result {
  const steps: Step[] = [{ at: 'api', text: `GET /api/v1/accounts/${accountNumber}` }]
  const done = (status: Result['status'], body: Record<string, unknown>, w = world, calls = 0): Result => ({ status, body, steps, world: w, mainframeCalls: calls })

  if (!/^\d{10}$/.test(accountNumber)) {
    steps.push({ at: 'zod', text: 'Account number must be 10 digits', tone: 'err' })
    return done(400, { error: 'Validation Error', message: 'Invalid account number format' })
  }
  steps.push({ at: 'zod', text: 'accountNumberSchema passed', tone: 'ok' })

  const key = cacheKey(accountNumber)
  const hit = world.cache[key]
  if (hit && hit.expires > world.now) {
    steps.push({ at: 'redis', text: `HIT ${key}, ${hit.expires - world.now}s left`, tone: 'ok' })
    return done(200, { success: true, data: hit.value, metadata: { source: 'COBOL-CICS', cached: true } })
  }
  steps.push({ at: 'redis', text: hit ? `${key} expired` : `MISS ${key}`, tone: 'warn' })

  if (!world.mainframeUp) {
    for (let i = 0; i <= RETRIES; i++) steps.push({ at: 'cics', text: `GETACCT timed out after 5000ms${i < RETRIES ? ', retrying' : ''}`, tone: 'err' })
    return done(500, { error: 'Internal Server Error', message: 'Failed to retrieve account data from legacy system', requestId }, world, RETRIES + 1)
  }

  steps.push({ at: 'cics', text: `GETACCT, ACCT-NUMBER=${accountNumber.padStart(10, '0')}` })
  const record = world.file[accountNumber]
  if (!record) {
    steps.push({ at: 'cics', text: "INVALID KEY, 'ACCOUNT NOT FOUND'", tone: 'warn' })
    return done(404, { error: 'Not Found', message: `Account ${accountNumber} does not exist` }, world, 1)
  }

  const { json, errors } = decode(layout, record)
  steps.push({ at: 'map', text: errors.length ? `mapped with ${errors.length} bad field${errors.length > 1 ? 's' : ''}` : `mapped ${Object.keys(json).length} fields to JSON`, tone: errors.length ? 'warn' : 'ok' })
  const next = { ...world, cache: { ...world.cache, [key]: { value: json, expires: world.now + TTL } } }
  steps.push({ at: 'redis', text: `SETEX ${key} ${TTL}` })
  return done(200, { success: true, data: json, metadata: { source: 'COBOL-CICS', cached: false } }, next, 1)
}
