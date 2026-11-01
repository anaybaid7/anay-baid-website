// Reads a CICS BMS map, the macro source behind a 3270 green screen, and
// turns it into the screen itself and a REST route. A field with a label and
// ATTRB=UNPROT is something the operator types, so it goes in the request.
// A labelled PROT field is something the program fills, so it goes in the
// response. Anything without a label is just text painted on the screen.

export interface BmsField {
  label: string | null
  row: number
  col: number
  length: number
  attrb: string[]
  initial: string
  color: string
  blink: boolean
  right: boolean
}

export interface BmsMap {
  transaction: string
  mapset: string
  rows: number
  cols: number
  fields: BmsField[]
}

// a macro can carry on over lines that end with a comma
function statements(source: string) {
  const out: string[] = []
  let cur = ''
  for (const raw of source.split('\n')) {
    if (raw.trim().startsWith('*') || !raw.trim()) continue
    cur += (cur ? ' ' : '') + raw.trim()
    if (!raw.trimEnd().endsWith(',')) {
      out.push(cur)
      cur = ''
    }
  }
  if (cur) out.push(cur)
  return out
}

const attr = (s: string, key: string) => s.match(new RegExp(`${key}=(\\([^)]*\\)|'[^']*'|[^,\\s]+)`))?.[1]

export function parseBms(source: string): BmsMap {
  const transaction = source.match(/TRANSACTION CODE:\s*(\w+)/i)?.[1] ?? 'TRAN'
  const mapset = source.match(/MAPSET=(\w+)/i)?.[1] ?? 'MAPSET'
  let rows = 24
  let cols = 80
  const fields: BmsField[] = []
  for (const s of statements(source)) {
    const size = attr(s, 'SIZE')?.match(/(\d+),(\d+)/)
    if (/DFHMDI/.test(s) && size) [rows, cols] = [Number(size[1]), Number(size[2])]
    if (!/DFHMDF/.test(s)) continue
    const pos = attr(s, 'POS')?.match(/(\d+),(\d+)/)
    if (!pos) continue
    const label = s.match(/^([A-Z][A-Z0-9]*)\s+DFHMDF/)?.[1] ?? null
    const a = (attr(s, 'ATTRB') ?? '').replace(/[()]/g, '')
    fields.push({
      label,
      row: Number(pos[1]),
      col: Number(pos[2]),
      length: Number(attr(s, 'LENGTH') ?? 1),
      attrb: a ? a.split(',') : [],
      initial: (attr(s, 'INITIAL') ?? '').replace(/^'|'$/g, ''),
      color: attr(s, 'COLOR') ?? 'GREEN',
      blink: attr(s, 'HILIGHT') === 'BLINK',
      right: attr(s, 'JUSTIFY') === 'RIGHT',
    })
  }
  return { transaction, mapset, rows, cols, fields }
}

export const isInput = (f: BmsField) => f.label !== null && f.attrb.includes('UNPROT')
export const isOutput = (f: BmsField) => f.label !== null && !f.attrb.includes('UNPROT')

// ACCTNO -> accountNumber, ACCTNAME -> accountName, BALANCE -> balance
const PARTS: [RegExp, string][] = [[/^ACCT/, 'account'], [/^CUST/, 'customer']]
const TAILS: Record<string, string> = { NO: 'Number', NAME: 'Name', ID: 'Id', TYPE: 'Type' }
export function fieldName(label: string) {
  for (const [re, word] of PARTS) {
    const rest = label.replace(re, '')
    if (rest !== label && rest) return word + (TAILS[rest] ?? rest[0] + rest.slice(1).toLowerCase())
  }
  return label.toLowerCase()
}

export interface ScreenRoute {
  method: 'POST'
  path: string
  request: Record<string, string>
  response: Record<string, string>
}

export function routeFor(map: BmsMap): ScreenRoute {
  const shape = (fs: BmsField[]) => Object.fromEntries(fs.map((f) => [fieldName(f.label!), `string, max ${f.length}`]))
  return {
    method: 'POST',
    path: `/api/v1/mainframe/${map.transaction.toLowerCase()}`,
    request: shape(map.fields.filter(isInput)),
    response: shape(map.fields.filter(isOutput)),
  }
}

// one row of the screen as runs of text, so it can be drawn with colours
export interface Run {
  col: number
  text: string
  field: BmsField
}

export function rowRuns(map: BmsMap, row: number, values: Record<string, string>): Run[] {
  return map.fields
    .filter((f) => f.row === row)
    .sort((a, b) => a.col - b.col)
    .map((f) => {
      const v = f.label ? values[f.label] ?? '' : f.initial
      return { col: f.col, text: (f.right ? v.padStart(f.length) : v.padEnd(f.length)).slice(0, f.length), field: f }
    })
}
