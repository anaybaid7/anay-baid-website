// The extension's parsing and formatting, ported from content.js. Everything
// is read from text already on screen, validated, then formatted the way the
// desk log expects. A task that can't validate makes no entry at all.

export const STUDENT_NUMBER = /^\d{8}$/
export const ROOM = /[A-Z0-9]+[NS]?-(?:[A-Z0-9]+-)?\d+[a-z]/i

export interface Student {
  fullName: string
  studentNumber: string
  roomSpace: string
}

// "Lee, Sam" becomes S.L, and so does "Sam Lee"
export function initials(fullName: string | null) {
  if (!fullName) return 'X.X'
  const first = (name: string) => name.split(/\s+/).filter(Boolean).map((n) => n[0].toUpperCase()).join('')
  if (fullName.includes(',')) {
    const [last, given = ''] = fullName.split(',').map((p) => p.trim())
    return `${first(given)}.${first(last)}`
  }
  const parts = fullName.split(/\s+/).filter(Boolean)
  if (parts.length < 2) return parts.map((p) => p[0]).join('').toUpperCase() + '.X'
  return `${first(parts.slice(0, -1).join(' '))}.${parts.at(-1)![0].toUpperCase()}`
}

// the room shows up in different places depending on the profile, so try each
// in order and keep the first that matches
const ROOM_TRIES = [
  (t: string) => t.match(/Room\s+([A-Z0-9]+[NS]?-(?:[A-Z0-9]+-)?\d+[a-z])\/([A-Z0-9]+[NS]?-(?:[A-Z0-9]+-)?\d+[a-z])/i)?.[2],
  (t: string) => t.match(/Rez 360[\s\S]*?(?=Activity|Related|$)/)?.[0].match(ROOM)?.[0],
  (t: string) => t.match(/Room Space[\s\S]*?([A-Z0-9]+[NS]?-(?:[A-Z0-9]+-)?\d+[a-z])/i)?.[1],
]

export function findRoom(text: string): { room: string; method: number } | null {
  for (const [i, t] of ROOM_TRIES.entries()) {
    const room = t(text)
    if (room) return { room, method: i + 1 }
  }
  return null
}

export function readStudent(breadcrumb: string | null, text: string): Student | null {
  const studentNumber = text.match(/Student Number\s+(\d{8})/)?.[1]
  const roomSpace = findRoom(text)?.room
  if (!breadcrumb || !studentNumber || !roomSpace) return null
  if (!STUDENT_NUMBER.test(studentNumber) || !ROOM.test(roomSpace)) return null
  return { fullName: breadcrumb, studentNumber, roomSpace }
}

// loaner keys first, otherwise every key code on the card
export function keyCodes(keysCard: string, studentNumber: string): string[] | null {
  const loaner = new Set<string>()
  const all = new Set<string>()
  for (const m of keysCard.matchAll(/(?:Bedroom|Floor|Suite|Mail|Unit|LOANER)[^:\r\n]*:\s*([A-Z0-9]+)/gi)) {
    const code = m[1].trim()
    if (code.length > 2 && !/[a-z]/.test(code) && code !== studentNumber) {
      all.add(code)
      if (/LOANER/i.test(m[0])) loaner.add(code)
    }
  }
  const out = loaner.size ? [...loaner] : [...all]
  return out.length ? out : null
}

export const time = (d: Date) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${d.getHours() >= 12 ? 'pm' : 'am'}`

export const packageEntry = (s: Student, count: number, staff: string, at: Date) =>
  `${initials(s.fullName)} (${s.studentNumber}) ${s.roomSpace} ${count} pkg${count > 1 ? 's' : ''} @ ${time(at)} - ${initials(staff)}`

export const lockoutEntry = (s: Student, codes: string[], reason: string, staff: string) =>
  `${initials(s.fullName)} (${s.studentNumber}) ${s.roomSpace} KC: ${codes.join(', ')}; ${reason} - ${initials(staff)}`

export function labelEntry(s: Student, staff: string, at: Date) {
  const [last, first] = s.fullName.split(',').map((p) => p.trim())
  const date = `${at.getMonth() + 1}/${at.getDate()}/${at.getFullYear()} ${time(at).replace(' am', 'a.m.').replace(' pm', 'p.m.')}`
  return `${date}\n${s.studentNumber}\n${first ? `${first} ${last}` : s.fullName}\n${s.roomSpace}\nFDA: ${initials(staff)}`
}
