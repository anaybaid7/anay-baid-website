// The extension's workflow engine. Each front desk task is a module that
// lists the fields it needs and how to check them. The engine runs the same
// stages for every task, so adding a task never touches the engine.

export type Record_ = Record<string, string>

export interface TaskModule {
  id: string
  name: string
  fields: string[]
  validate: (r: Record_) => true | string
  format: (r: Record_) => Record_
}

export const MODULES: TaskModule[] = [
  {
    id: 'package-pickup',
    name: 'Package pickup',
    fields: ['Resident', 'Room', 'Student #', 'Packages'],
    validate: (r) => Number.parseInt(r.Packages) > 0 || 'No packages waiting for this resident',
    format: (r) => ({ ...r, Packages: `${Number.parseInt(r.Packages)} picked up` }),
  },
  {
    id: 'package-label',
    name: 'Package label',
    fields: ['Resident', 'Room', 'Carrier'],
    validate: (r) => Boolean(r.Carrier) || 'Pick a carrier',
    format: (r) => ({ ...r, Room: r.Room.toUpperCase() }),
  },
  {
    id: 'key-lockout',
    name: 'Key lockout',
    fields: ['Resident', 'Room', 'Student #', 'Key type'],
    validate: (r) => Boolean(r['Key type']) || 'Pick a key type',
    format: (r) => r,
  },
]

export const STAGES = ['Match the page', 'Read fields', 'Validate', 'Format', 'Fill the log'] as const

export interface StageResult {
  stage: (typeof STAGES)[number]
  ok: boolean
  note: string
}

export function runTask(m: TaskModule, page: Record_) {
  const out: StageResult[] = [{ stage: 'Match the page', ok: true, note: `resident record, task ${m.id}` }]
  const read: Record_ = {}
  for (const f of m.fields) read[f] = page[f] ?? ''
  const missing = m.fields.filter((f) => !read[f])
  out.push({ stage: 'Read fields', ok: true, note: `${m.fields.length - missing.length} of ${m.fields.length} found on the page` })
  const valid = m.validate(read)
  if (valid !== true) {
    out.push({ stage: 'Validate', ok: false, note: valid })
    return { stages: out, entry: null }
  }
  out.push({ stage: 'Validate', ok: true, note: 'all checks passed' })
  const entry = m.format(read)
  out.push({ stage: 'Format', ok: true, note: 'shaped to the log’s fields' })
  out.push({ stage: 'Fill the log', ok: true, note: 'ready for staff to check and save' })
  return { stages: out, entry }
}
