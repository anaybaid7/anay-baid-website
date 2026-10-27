import { allTech, skills } from './data'
import { uses, whereUsed, type Evidence } from './evidence'

// Everything I could claim to know: the resume's skills plus every tech tag on
// a job or project, without near-duplicates ("React" and "React.js").
const known = Array.from(new Set([...skills.languages, ...skills.frameworks, ...skills.devops, ...allTech]))
export const stack = known.filter((k, i) => !known.slice(0, i).some((earlier) => uses(earlier, k) && uses(k, earlier)))

// other ways a posting might write the same thing
const ALIASES: Record<string, string[]> = {
  'React.js': ['react', 'reactjs'],
  'Node.js': ['node', 'nodejs'],
  JavaScript: ['js', 'ecmascript'],
  TypeScript: ['ts'],
  PostgreSQL: ['postgres', 'psql'],
  Kubernetes: ['k8s', 'eks', 'gke', 'aks'],
  AWS: ['amazon web services'],
  Azure: ['microsoft azure'],
  'REST APIs': ['rest', 'restful', 'rest api'],
  'Spring Boot': ['spring'],
  'ECS/EKS': ['ecs', 'fargate'],
  'CI/CD': ['ci', 'cd', 'continuous integration', 'continuous delivery', 'continuous deployment', 'github actions', 'jenkins'],
  Airflow: ['apache airflow'],
  Kafka: ['apache kafka'],
  Terraform: ['infrastructure as code', 'iac'],
  Docker: ['containers', 'containerization', 'containerized'],
  Linux: ['unix'],
  SQL: ['mysql', 'sql server', 't-sql', 'relational database', 'relational databases'],
  Python: ['pandas', 'numpy'],
  'C++': ['cpp'],
  'C#': ['csharp', '.net', 'dotnet'],
}

// one-letter names collide with too much ordinary text, so they only count
// when the posting says them in a way that can't mean anything else
const STRICT: Record<string, RegExp> = {
  C: /\b(?:in|using|with)\s+c(?![\w+#])|\bc\s*(?:\/|and|,)\s*c\+\+|\bc programming\b/i,
  R: /\b(?:in|using|with)\s+r(?![\w])\b|\br programming\b|\br language\b|\brstudio\b/i,
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function mentions(text: string, term: string) {
  // treat the edges by hand since \b doesn't work next to + # . /
  return new RegExp(`(?<![\\w+#.-])${escape(term.toLowerCase())}(?![\\w+#-])`).test(text)
}

export interface Match {
  skill: string
  where: Evidence[]
}

export function matchPosting(posting: string): Match[] {
  const text = posting.toLowerCase()
  if (text.trim().length === 0) return []
  return stack
    .filter((skill) => {
      if (STRICT[skill]) return STRICT[skill].test(posting)
      return [skill, ...(ALIASES[skill] ?? [])].some((term) => mentions(text, term))
    })
    .map((skill) => ({ skill, where: whereUsed(skill) }))
}
