// The network the SSH tunnel goes through, as data. A request walks hop by
// hop and each boundary checks its rules, the way a VPC route table and
// security groups would.

export type Src = 'office' | 'cafe'
export type Try = 'direct' | 'tunnel'

export interface Rule {
  id: string
  on: 'bastion' | 'db'
  port: number
  from: string
}

export const RULES: Rule[] = [
  { id: 'r1', on: 'bastion', port: 22, from: 'office 203.0.113.0/24' },
  { id: 'r2', on: 'db', port: 5432, from: 'sg-bastion' },
]

export interface Hop {
  at: 'laptop' | 'igw' | 'bastion' | 'db'
  ok: boolean
  text: string
  rule?: string
}

export function walk(t: Try, src: Src): Hop[] {
  const start: Hop = { at: 'laptop', ok: true, text: src === 'office' ? 'From the office, 203.0.113.24' : 'From a cafe, 198.51.100.7' }
  if (t === 'direct') {
    return [
      start,
      { at: 'igw', ok: true, text: 'Internet gateway, routes only to the public subnet' },
      { at: 'db', ok: false, text: 'db.internal has no public address, no route' },
    ]
  }
  if (src === 'cafe') {
    return [
      start,
      { at: 'igw', ok: true, text: 'Internet gateway' },
      { at: 'bastion', ok: false, text: 'Port 22 is open to the office range only', rule: 'r1' },
    ]
  }
  return [
    start,
    { at: 'igw', ok: true, text: 'Internet gateway' },
    { at: 'bastion', ok: true, text: 'SSH on 22, key accepted', rule: 'r1' },
    { at: 'db', ok: true, text: 'Forwarded to 5432 from the bastion', rule: 'r2' },
  ]
}
