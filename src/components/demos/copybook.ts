// Reads a COBOL record layout and maps it to JSON, following the rules the
// LegacyBridge analyzer showed for the GETACCT program. PIC X is text, PIC 9
// with a V has implied decimals, 8 digit fields named like dates are
// YYYYMMDD, and numeric ids stay strings so leading zeros survive.

export type JsonType = 'string' | 'number' | 'integer' | 'date'

export interface Field {
  level: string
  cobol: string
  pic: string
  name: string
  type: JsonType
  offset: number
  bytes: number
  decimals: number
}

export interface Layout {
  record: string
  entity: string
  key: string | null
  fields: Field[]
}

const WORDS: Record<string, string> = { ACCT: 'account', CUST: 'customer', TXN: 'transaction', NO: 'number', DT: 'date' }

// ACCT-NUMBER -> accountNumber
export function camel(cobol: string) {
  return cobol
    .split('-')
    .map((w, i) => {
      const word = WORDS[w] ?? w.toLowerCase()
      return i === 0 ? word : word[0].toUpperCase() + word.slice(1)
    })
    .join('')
}

// 9(10)V99 -> 10 digits before the point and 2 after
function size(pic: string) {
  const count = (part: string) => {
    let n = 0
    for (const m of part.matchAll(/([9XA])(?:\((\d+)\))?/g)) n += m[2] ? Number(m[2]) : 1
    return n
  }
  const [whole, frac = ''] = pic.toUpperCase().split('V')
  return { whole: count(whole), decimals: count(frac) }
}

function typeOf(cobol: string, pic: string, digits: number, decimals: number): JsonType {
  if (/[XA]/i.test(pic)) return 'string'
  if (decimals > 0) return 'number'
  if (digits === 8 && /DATE|-DT$|TRANSACTION/.test(cobol)) return 'date'
  if (/NUMBER|-ID$|-NO$/.test(cobol)) return 'string'
  return 'integer'
}

export function parse(source: string): Layout {
  const fields: Field[] = []
  let offset = 0
  let record = 'RECORD'
  for (const line of source.split('\n')) {
    const rec = line.match(/^\s*01\s+([A-Z0-9-]+)\s*\.\s*$/i)
    if (rec) record = rec[1].toUpperCase()
    const m = line.match(/^\s*(\d{2})\s+([A-Z0-9-]+)\s+PIC\s+([9XAV()0-9]+)\s*\./i)
    if (!m) continue
    const cobol = m[2].toUpperCase()
    const pic = m[3].toUpperCase()
    const { whole, decimals } = size(pic)
    const bytes = whole + decimals
    fields.push({ level: m[1], cobol, pic, name: camel(cobol), type: typeOf(cobol, pic, whole, decimals), offset, bytes, decimals })
    offset += bytes
  }
  const key = source.match(/RECORD\s+KEY\s+IS\s+([A-Z0-9-]+)/i)?.[1].toUpperCase() ?? null
  return { record, entity: camel(record.replace(/-RECORD$|-REC$/, '')), key, fields }
}

export const recordLength = (l: Layout) => l.fields.reduce((n, f) => n + f.bytes, 0)

export interface Decoded {
  json: Record<string, string | number | null>
  errors: { field: string; message: string }[]
}

// YYYYMMDD -> 2018-03-15, the same check the generated formatCobolDate does
function date(raw: string) {
  if (!/^\d{8}$/.test(raw)) return null
  const iso = `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
  return Number.isNaN(Date.parse(iso)) ? null : iso
}

export function decode(layout: Layout, line: string): Decoded {
  const json: Decoded['json'] = {}
  const errors: Decoded['errors'] = []
  const rec = line.padEnd(recordLength(layout), ' ')
  for (const f of layout.fields) {
    const raw = rec.slice(f.offset, f.offset + f.bytes)
    if (f.type === 'string' && /X|A/.test(f.pic)) {
      json[f.name] = raw.trim()
      continue
    }
    if (!/^\d+$/.test(raw)) {
      errors.push({ field: f.cobol, message: `expected ${f.bytes} digits, got "${raw}"` })
      json[f.name] = null
      continue
    }
    if (f.type === 'number') json[f.name] = Number(`${raw.slice(0, f.bytes - f.decimals)}.${raw.slice(f.bytes - f.decimals)}`)
    else if (f.type === 'date') {
      // all zeros is how the file says "never", which maps to null
      if (/^0+$/.test(raw)) {
        json[f.name] = null
        continue
      }
      const d = date(raw)
      if (!d) errors.push({ field: f.cobol, message: `"${raw}" is not a YYYYMMDD date` })
      json[f.name] = d
    } else if (f.type === 'integer') json[f.name] = Number(raw)
    else json[f.name] = raw
  }
  return { json, errors }
}

export interface Endpoint {
  method: 'GET'
  path: string
  why: string
}

// the routes a record layout suggests: one by its key, a paged list, and
// one per foreign id the record carries
export function endpoints(layout: Layout): Endpoint[] {
  const base = `/api/v1/${layout.entity}s`
  const out: Endpoint[] = []
  const key = layout.fields.find((f) => f.cobol === layout.key)
  if (key) out.push({ method: 'GET', path: `${base}/:${key.name}`, why: `RECORD KEY IS ${key.cobol}, so a random READ by key` })
  out.push({ method: 'GET', path: base, why: 'every record, paged' })
  for (const f of layout.fields) {
    if (f === key || !/-ID$/.test(f.cobol)) continue
    const parent = camel(f.cobol.replace(/-ID$/, ''))
    out.push({ method: 'GET', path: `/api/v1/${parent}s/:${f.name}/${layout.entity}s`, why: `${f.cobol} points at another record` })
  }
  return out
}
