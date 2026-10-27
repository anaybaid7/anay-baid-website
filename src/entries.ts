import { experience, projects } from './data'
import { slug } from './evidence'

export const shortOrg = (org: string) => org.replace(/ (Inc|LP|Global Holdings Inc)$/, '')

// every job and project as one list, in page order, for the detail drawer
export interface Entry {
  id: string
  kind: 'job' | 'project'
  title: string
  sub: string
  when: string
  description?: string
  bullets: string[]
  tech: string[]
  highlight?: { value: string; label: string }
  links: { label: string; href: string }[]
}

export const ENTRIES: Entry[] = [
  ...experience.map<Entry>((e) => ({
    id: `job-${slug(shortOrg(e.org))}`,
    kind: 'job',
    title: shortOrg(e.org),
    sub: e.role,
    when: e.period,
    bullets: e.bullets,
    tech: e.tech,
    highlight: e.highlight,
    links: [{ label: e.org, href: e.orgUrl }],
  })),
  ...projects.map<Entry>((p) => ({
    id: `project-${slug(p.title)}`,
    kind: 'project',
    title: p.title,
    sub: p.award ?? p.period,
    when: p.period,
    description: p.description,
    bullets: p.bullets,
    tech: p.tech,
    highlight: p.highlight,
    links: [
      ...(p.link ? [{ label: p.status === 'Live' ? 'Play the real game' : p.link.includes('devpost') ? 'Devpost' : 'Code', href: p.link }] : []),
      ...(p.code ? [{ label: 'Code', href: p.code }] : []),
    ],
  })),
]

export const entryById = (id: string) => ENTRIES.find((e) => e.id === id)
