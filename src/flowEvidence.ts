import { DETAILS } from './details'
import { entryById } from './entries'

export interface StepHit {
  id: string
  entry: string
  flowName: string
  stepTitle: string
  flow: number
  step: number
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// Steps in the architecture flows where a skill actually appears: in the
// boxes a step connects, its explanation, or the code it shows. Very short
// names like R or C are skipped, since they match too much.
export function stepsUsing(skill: string, limit = 3): StepHit[] {
  const name = skill.replace(/\.js$/i, '').trim()
  if (name.length < 3) return []
  const re = new RegExp(`(^|[^a-z0-9])${escape(name.toLowerCase())}([^a-z0-9]|$)`)
  const hits: StepHit[] = []
  for (const [id, d] of Object.entries(DETAILS)) {
    const node = (n: string) => d.arch.nodes.find((x) => x.id === n)
    for (const [fi, f] of (d.flows ?? []).entries()) {
      for (const [si, s] of f.steps.entries()) {
        const text = [node(s.from)?.label, node(s.from)?.sub, node(s.to)?.label, node(s.to)?.sub, s.title, s.detail, s.payload?.label, s.payload?.code]
          .join(' ')
          .toLowerCase()
        if (re.test(text)) {
          hits.push({ id, entry: entryById(id)?.title.replace(/ \(.*\)$/, '') ?? id, flowName: f.name, stepTitle: s.title, flow: fi + 1, step: si + 1 })
          break // one step per flow is enough to show it
        }
      }
    }
  }
  return hits.slice(0, limit)
}
