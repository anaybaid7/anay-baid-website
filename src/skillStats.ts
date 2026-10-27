import { experience, projects, skills, skillLabels } from './data'
import { uses } from './evidence'
import { monthIndex, parsePeriod } from './timeline'

// Skills measured from the work on the page instead of rated by hand. For each
// skill on the resume: months of co-op in roles that used it, how many
// projects used it, and the last month it was in use.

export interface SkillStat {
  skill: string
  group: string
  months: number
  jobs: string[]
  projects: string[]
  lastUsed: number | null
  current: boolean
}

const shortOrg = (org: string) => org.replace(/ (Inc|LP|Global Holdings Inc)$/, '')

export function skillStats(now = new Date()): SkillStat[] {
  const thisMonth = monthIndex(now.getFullYear(), now.getMonth())
  const groups = (Object.keys(skills) as (keyof typeof skills)[]).flatMap((g) =>
    skills[g].map((skill) => ({ skill, group: skillLabels[g] })),
  )
  return groups.map(({ skill, group }) => {
    let months = 0
    let lastUsed: number | null = null
    let current = false
    const jobs: string[] = []
    const used: string[] = []
    for (const e of experience) {
      if (!e.tech.some((t) => uses(skill, t))) continue
      jobs.push(shortOrg(e.org))
      const span = parsePeriod(e.period)
      if (!span) continue
      const end = Math.min(span.end, thisMonth)
      months += Math.max(0, end - span.start + 1)
      if (span.start <= thisMonth && span.end >= thisMonth) current = true
      lastUsed = Math.max(lastUsed ?? end, end)
    }
    for (const p of projects) {
      if (!p.tech.some((t) => uses(skill, t))) continue
      used.push(p.title.replace(/ \(.*\)$/, ''))
      const span = parsePeriod(p.period)
      if (span) lastUsed = Math.max(lastUsed ?? span.end, Math.min(span.end, thisMonth))
    }
    return { skill, group, months, jobs, projects: used, lastUsed, current }
  })
}

export type SortKey = 'skill' | 'months' | 'projects' | 'lastUsed'

export function sortStats(rows: SkillStat[], key: SortKey, dir: 1 | -1) {
  const value = (r: SkillStat) =>
    key === 'skill' ? r.skill.toLowerCase() : key === 'projects' ? r.projects.length : key === 'months' ? r.months : r.lastUsed ?? -1
  return [...rows].sort((a, b) => {
    const x = value(a)
    const y = value(b)
    if (x === y) return b.months - a.months || b.projects.length - a.projects.length || a.skill.localeCompare(b.skill)
    return (x < y ? -1 : 1) * dir
  })
}
