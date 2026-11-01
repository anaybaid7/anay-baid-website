// Reads a DB2 for i CREATE TABLE and its indexes into the same model the
// COBOL reader produces, so one generator can write routes for both.

import { camel, parse, type Layout } from './copybook'

export type ModelType = 'string' | 'number' | 'integer' | 'date' | 'datetime'

export interface ModelField {
  name: string
  source: string
  type: ModelType
  maxLength?: number
  digits?: number
  required: boolean
  sensitive: boolean
}

export interface Model {
  entity: string
  system: string
  program: string
  key: ModelField
  fields: ModelField[]
  // columns with an index, which make cheap search filters
  search: ModelField[]
}

// columns no API should hand out by default
const SENSITIVE = /^(SSN|SIN|DATE_OF_BIRTH|DOB|CREDIT_SCORE)$/

function typeOf(sql: string, scale: number): ModelType {
  if (/^(VAR)?CHAR/.test(sql)) return 'string'
  if (sql === 'DATE') return 'date'
  if (sql === 'TIMESTAMP') return 'datetime'
  return scale > 0 ? 'number' : 'integer'
}

export function parseDdl(source: string): Model {
  const table = source.match(/CREATE TABLE\s+(?:\w+\.)?(\w+)/i)?.[1] ?? 'TABLE'
  const lib = source.match(/CREATE TABLE\s+(\w+)\./i)?.[1] ?? ''
  const body = source.slice(source.indexOf('(') + 1, source.indexOf(');'))
  const pk = body.match(/PRIMARY KEY\s*\(([^)]+)\)/i)?.[1].trim().toUpperCase()
  const fields: ModelField[] = []
  for (const line of body.split('\n')) {
    const m = line.trim().match(/^([A-Z_][A-Z0-9_]*)\s+([A-Z]+)(?:\((\d+)(?:,(\d+))?\))?(.*)$/i)
    if (!m || /^PRIMARY$/i.test(m[1])) continue
    const col = m[1].toUpperCase()
    const sql = m[2].toUpperCase()
    const size = m[3] ? Number(m[3]) : undefined
    const scale = m[4] ? Number(m[4]) : 0
    const type = typeOf(sql, scale)
    fields.push({
      name: camel(col.replace(/_/g, '-')),
      source: col,
      type,
      ...(type === 'string' ? { maxLength: size } : size ? { digits: size } : {}),
      required: /NOT NULL/i.test(m[5]) || col === pk,
      sensitive: SENSITIVE.test(col),
    })
  }
  const indexed = [...source.matchAll(/CREATE INDEX\s+\w+\s+ON\s+[\w.]+\s*\(([^)]+)\)/gi)].flatMap((m) => m[1].split(',').map((c) => c.trim().toUpperCase()))
  const key = fields.find((f) => f.source === pk) ?? fields[0]
  return {
    entity: camel(table),
    system: 'AS/400 DB2',
    program: `${lib ? lib + '.' : ''}${table}`,
    key,
    fields,
    search: fields.filter((f) => indexed.includes(f.source)),
  }
}

// the COBOL record layout as the same model
export function fromCopybook(source: string, program = 'GETACCT'): Model {
  const l: Layout = parse(source)
  const fields: ModelField[] = l.fields.map((f) => ({
    name: f.name,
    source: f.cobol,
    type: f.type === 'date' ? 'date' : f.type,
    ...(f.type === 'string' ? { maxLength: f.bytes } : { digits: f.bytes }),
    // the file stores a missing date as zeros, so dates are optional
    required: f.type !== 'date',
    sensitive: false,
  }))
  return {
    entity: l.entity,
    system: 'COBOL/CICS',
    program,
    key: fields.find((f) => f.source === l.key) ?? fields[0],
    fields,
    search: [],
  }
}
