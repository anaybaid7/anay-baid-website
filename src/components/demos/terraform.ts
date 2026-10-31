// The InsightVault stack as Terraform sees it: resources and what each one
// references. Plan compares a change against state; apply walks the graph,
// running everything whose dependencies are done at the same time.
// Resource names here are illustrative.

export interface Res {
  id: string
  deps: string[]
  // rough minutes to create, for the apply timeline
  mins: number
}

export const STACK: Res[] = [
  { id: 'aws_vpc.main', deps: [], mins: 0.2 },
  { id: 'aws_subnet.public', deps: ['aws_vpc.main'], mins: 0.2 },
  { id: 'aws_subnet.private', deps: ['aws_vpc.main'], mins: 0.2 },
  { id: 'aws_security_group.api', deps: ['aws_vpc.main'], mins: 0.1 },
  { id: 'aws_security_group.db', deps: ['aws_security_group.api'], mins: 0.1 },
  { id: 'aws_db_instance.alerts', deps: ['aws_subnet.private', 'aws_security_group.db'], mins: 6 },
  { id: 'aws_ecs_cluster.main', deps: [], mins: 0.2 },
  { id: 'aws_lb.api', deps: ['aws_subnet.public', 'aws_security_group.api'], mins: 2.5 },
  { id: 'aws_ecs_task_definition.api', deps: ['aws_db_instance.alerts'], mins: 0.1 },
  { id: 'aws_ecs_service.api', deps: ['aws_ecs_cluster.main', 'aws_ecs_task_definition.api', 'aws_lb.api', 'aws_subnet.private'], mins: 1.5 },
  { id: 'aws_s3_bucket.dashboard', deps: [], mins: 0.1 },
  { id: 'aws_cloudfront_distribution.cdn', deps: ['aws_s3_bucket.dashboard', 'aws_lb.api'], mins: 4 },
]

export type Action = 'create' | 'update' | 'replace' | 'none'

export const CHANGES = {
  fresh: { label: 'Empty account', note: '' },
  image: { label: 'New API image tag', note: 'Task definitions are immutable, so a new revision replaces the old one and the service updates in place to point at it.' },
  size: { label: 'Bigger DB class', note: 'instance_class changes in place. The database keeps its data.' },
  rename: { label: 'Rename the DB identifier', note: 'identifier forces a new database. Terraform would destroy the old one, and its data, first.' },
} as const
export type Change = keyof typeof CHANGES

export function plan(change: Change): Record<string, Action> {
  const out: Record<string, Action> = Object.fromEntries(STACK.map((r) => [r.id, change === 'fresh' ? 'create' : 'none']))
  if (change === 'image') {
    out['aws_ecs_task_definition.api'] = 'replace'
    out['aws_ecs_service.api'] = 'update'
  }
  if (change === 'size') out['aws_db_instance.alerts'] = 'update'
  if (change === 'rename') {
    out['aws_db_instance.alerts'] = 'replace'
    // the new endpoint flows into the task definition, then the service
    out['aws_ecs_task_definition.api'] = 'replace'
    out['aws_ecs_service.api'] = 'update'
  }
  return out
}

export const summary = (p: Record<string, Action>) => {
  const n = (a: Action) => Object.values(p).filter((x) => x === a).length
  return `${n('create') + n('replace')} to add, ${n('update')} to change, ${n('replace')} to destroy`
}

// longest chain of dependencies to each resource, for layout
export function depth(id: string): number {
  const r = STACK.find((x) => x.id === id)!
  return r.deps.length ? 1 + Math.max(...r.deps.map(depth)) : 0
}

// apply: a resource starts once everything it depends on has finished;
// unchanged resources count as already done
export function schedule(p: Record<string, Action>) {
  const done: Record<string, number> = {}
  const start: Record<string, number> = {}
  const finish = (id: string): number => {
    if (id in done) return done[id]
    const r = STACK.find((x) => x.id === id)!
    const ready = Math.max(0, ...r.deps.map(finish))
    if (p[id] === 'none') return (done[id] = ready)
    start[id] = ready
    return (done[id] = ready + (p[id] === 'update' ? r.mins / 3 : r.mins))
  }
  STACK.forEach((r) => finish(r.id))
  return { start, done, total: Math.max(0, ...STACK.filter((r) => p[r.id] !== 'none').map((r) => done[r.id])) }
}
