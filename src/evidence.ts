import { experience, projects } from './data'

export const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

const norm = (t: string) =>
  t
    .toLowerCase()
    .replace(/\.js$/, '')
    .replace(/(html|css)\d$/, '$1')
    .trim()

// does a tech tag on a job or project count as using this skill?
// "AWS" counts for "AWS S3", "React.js" counts for "React"
export function uses(skill: string, tech: string) {
  const s = norm(skill).replace(/ apis$/, '')
  const t = norm(tech)
  if (t === s || t.startsWith(s + ' ') || t.startsWith(s + '/') || t.endsWith(' ' + s)) return true
  // "ECS/EKS" counts for "ECS/Fargate": share a part that's more than a couple of letters
  const parts = (x: string) => x.split(/[/ ]/).filter((p) => p.length > 2)
  return parts(s).some((p) => parts(t).includes(p)) && s.includes('/')
}

export type Evidence =
  | { kind: 'job'; index: number; label: string }
  | { kind: 'project'; slug: string; label: string }

// every place on the page a skill actually shows up
export function whereUsed(skill: string): Evidence[] {
  const out: Evidence[] = []
  experience.forEach((e, index) => {
    if (e.tech.some((t) => uses(skill, t))) out.push({ kind: 'job', index, label: e.org.replace(/ (Inc|LP|Global Holdings Inc)$/, '') })
  })
  projects.forEach((p) => {
    if (p.tech.some((t) => uses(skill, t))) out.push({ kind: 'project', slug: slug(p.title), label: p.title })
  })
  return out
}
