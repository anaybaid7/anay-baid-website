import { education, profile, skillLabels, skills } from './data'
import { ENTRIES, type Entry } from './entries'
import { whereUsed } from './evidence'
import { DETAILS } from './details'

// The command language behind the terminal. Pure functions over the same
// data the page renders, so the UI only has to print lines and run actions.

export type Action =
  | { kind: 'open'; id: string; tab?: string; at?: { flow: number; step: number } }
  | { kind: 'filter'; skills: string[] }
  | { kind: 'theme'; value: 'light' | 'dark' | 'system' }
  | { kind: 'view'; value: 'full' | 'skim' }
  | { kind: 'resume' }
  | { kind: 'clear' }
  | { kind: 'exit' }

export interface Output {
  lines: string[]
  action?: Action
}

const nameOf = (e: Entry) => e.id.replace(/^(job|project)-/, '')
export const NAMES = ENTRIES.map(nameOf)
const allSkills = Object.values(skills).flat()

function find(arg: string) {
  const q = arg.toLowerCase()
  return ENTRIES.find((e) => nameOf(e) === q) ?? ENTRIES.find((e) => nameOf(e).startsWith(q))
}

const pad = (s: string, n: number) => s + ' '.repeat(Math.max(1, n - s.length))

const HELP = [
  'whoami              who this is',
  'ls [jobs|projects]  list work',
  'cat <name>          details for one job or project',
  'open <name> [tab]   open it in the drawer (how, screens, try, code)',
  'why <name>          what was manual and what I built',
  'flows <name>        the flows through a system, step by step',
  'trace <name> [f] [s] open the diagram on flow f, step s',
  'grep <text>         search bullets, stacks, flows and their payloads',
  'skills              skills by group',
  'filter <skill>      show only work that used it, "filter clear" to reset',
  'theme <light|dark|system>',
  'view <full|skim>',
  'contact             email and links',
  'resume              open the resume',
  'clear, exit',
]

export function run(input: string): Output {
  const [cmd = '', ...rest] = input.trim().split(/\s+/)
  const arg = rest.join(' ')
  switch (cmd.toLowerCase()) {
    case '':
      return { lines: [] }
    case 'help':
    case '?':
      return { lines: HELP }
    case 'whoami':
      return {
        lines: [
          profile.name,
          `${education.degree}, ${education.school}, ${education.gradDate.replace('Expected ', 'graduating ')}`,
          profile.status,
        ],
      }
    case 'ls': {
      const kind = arg.startsWith('p') ? 'project' : arg.startsWith('j') ? 'job' : null
      const list = ENTRIES.filter((e) => !kind || e.kind === kind)
      return { lines: list.map((e) => `${pad(nameOf(e), 40)}${e.kind === 'job' ? e.sub : e.when}`) }
    }
    case 'cat': {
      const e = find(arg)
      if (!e) return { lines: [`cat: ${arg || '(nothing)'}: no such job or project, try ls`] }
      return {
        lines: [
          e.sub === e.when ? e.title : `${e.title}, ${e.sub}`,
          e.when,
          ...(e.highlight ? [`${e.highlight.value} ${e.highlight.label}`] : []),
          '',
          ...e.bullets.map((b) => `- ${b}`),
          '',
          `stack: ${e.tech.join(', ')}`,
        ],
      }
    }
    case 'open': {
      const [name, tab] = rest
      const e = name ? find(name) : undefined
      if (!e) return { lines: [`open: ${name || '(nothing)'}: no such job or project, try ls`] }
      return { lines: [`opening ${e.title}`], action: { kind: 'open', id: e.id, tab } }
    }
    case 'grep': {
      if (!arg) return { lines: ['grep: give it something to look for'] }
      const q = arg.toLowerCase()
      const hits = ENTRIES.flatMap((e) => [
        ...[...e.bullets, e.tech.join(', ')].filter((t) => t.toLowerCase().includes(q)).map((t) => `${pad(nameOf(e), 26)}${t}`),
        ...(DETAILS[e.id]?.flows ?? []).flatMap((f, fi) =>
          f.steps
            .map((st, si) => ({ st, si }))
            .filter(({ st }) => `${st.title} ${st.detail} ${st.payload?.code ?? ''}`.toLowerCase().includes(q))
            .map(({ st, si }) => `${pad(nameOf(e), 26)}flow ${fi + 1} step ${si + 1}  ${st.title}`),
        ),
      ])
      return { lines: hits.length ? [...hits, '', 'trace <name> <flow> <step> opens one of these'] : [`no matches for "${arg}"`] }
    }
    case 'why': {
      const e = find(arg)
      if (!e) return { lines: [`why: ${arg || '(nothing)'}: no such job or project, try ls`] }
      return { lines: [e.title, '', `before  ${e.why}`, `built   ${e.built}`, ...(e.highlight ? [`result  ${e.highlight.value} ${e.highlight.label}`] : [])] }
    }
    case 'flows': {
      const e = find(arg)
      const flows = e && DETAILS[e.id]?.flows
      if (!e || !flows) return { lines: [`flows: ${arg || '(nothing)'}: no such job or project, try ls`] }
      return {
        lines: flows.flatMap((f, fi) => [
          `${fi + 1}  ${f.name}`,
          ...f.steps.map((st, si) => `   ${si + 1}. ${st.title}`),
          '',
        ]),
      }
    }
    case 'trace': {
      const [name, fl = '1', st = '1'] = rest
      const e = name ? find(name) : undefined
      const flows = e && DETAILS[e.id]?.flows
      if (!e || !flows) return { lines: [`trace: ${name || '(nothing)'}: no such job or project, try ls`] }
      const f = flows[Number(fl) - 1]
      const step = f?.steps[Number(st) - 1]
      if (!step) return { lines: [`trace: no flow ${fl} step ${st} for ${nameOf(e)}, try flows ${nameOf(e)}`] }
      return {
        lines: [`${f.name}, step ${st}: ${step.title}`, ...(step.payload ? ['', ...step.payload.code.split('\n')] : [])],
        action: { kind: 'open', id: e.id, tab: 'how', at: { flow: Number(fl), step: Number(st) } },
      }
    }
    case 'skills':
      return {
        lines: (Object.keys(skills) as (keyof typeof skills)[]).map((k) => `${pad(skillLabels[k], 24)}${skills[k].join(', ')}`),
      }
    case 'filter': {
      if (!arg || arg === 'clear') return { lines: ['filter cleared'], action: { kind: 'filter', skills: [] } }
      const skill = allSkills.find((s) => s.toLowerCase() === arg.toLowerCase())
      if (!skill) return { lines: [`filter: ${arg}: not one of my skills, try skills`] }
      const where = whereUsed(skill).map((w) => w.label)
      return {
        lines: where.length ? [`showing work with ${skill}: ${where.join(', ')}`] : [`${skill} is on my resume but not tagged on any work here`],
        action: where.length ? { kind: 'filter', skills: [skill] } : undefined,
      }
    }
    case 'theme':
      if (arg !== 'light' && arg !== 'dark' && arg !== 'system') return { lines: ['usage: theme light|dark|system'] }
      return { lines: [`theme set to ${arg}`], action: { kind: 'theme', value: arg } }
    case 'view':
      if (arg !== 'full' && arg !== 'skim') return { lines: ['usage: view full|skim'] }
      return { lines: [`view set to ${arg}`], action: { kind: 'view', value: arg } }
    case 'contact':
      return {
        lines: [
          `email     ${profile.email}`,
          `github    ${profile.links.github}`,
          `linkedin  ${profile.links.linkedin}`,
          `devpost   ${profile.links.devpost}`,
        ],
      }
    case 'resume':
      return { lines: ['opening the resume'], action: { kind: 'resume' } }
    case 'clear':
      return { lines: [], action: { kind: 'clear' } }
    case 'exit':
    case 'quit':
      return { lines: [], action: { kind: 'exit' } }
    default:
      return { lines: [`${cmd}: command not found, try help`] }
  }
}

const COMMANDS = ['help', 'whoami', 'ls', 'cat', 'open', 'why', 'flows', 'trace', 'grep', 'skills', 'filter', 'theme', 'view', 'contact', 'resume', 'clear', 'exit']

// tab completion for the command, then for names, skills and options
export function complete(input: string): string {
  const parts = input.split(/\s+/)
  const last = parts[parts.length - 1].toLowerCase()
  const pool =
    parts.length === 1
      ? COMMANDS
      : ['cat', 'open', 'why', 'flows', 'trace'].includes(parts[0])
        ? parts.length === 2 ? NAMES : parts[0] === 'open' ? ['how', 'screens', 'try', 'code'] : []
        : parts[0] === 'filter'
          ? ['clear', ...allSkills]
          : parts[0] === 'theme'
            ? ['light', 'dark', 'system']
            : parts[0] === 'view'
              ? ['full', 'skim']
              : parts[0] === 'ls'
                ? ['jobs', 'projects']
                : []
  const matches = pool.filter((p) => p.toLowerCase().startsWith(last))
  if (matches.length !== 1) return input
  parts[parts.length - 1] = matches[0]
  return parts.join(' ') + ' '
}
