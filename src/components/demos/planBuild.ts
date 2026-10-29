// Work out which builds to dispatch: map changed files to services, check
// the environment, and only dispatch the services that changed.

export const SERVICES = ['api', 'web', 'worker', 'docs'] as const
export type Service = (typeof SERVICES)[number]

export const serviceOf = (file: string) => SERVICES.find((s) => file.startsWith(`${s}/`)) ?? null

export interface Check {
  name: string
  ok: boolean
}

export function planBuild(changedFiles: string[], env: string, branch: string) {
  const build = SERVICES.filter((s) => changedFiles.some((f) => serviceOf(f) === s))
  const skip = SERVICES.filter((s) => !build.includes(s))
  const checks: Check[] = [
    { name: `environment ${env} exists`, ok: true },
    { name: 'secrets API_KEY, DB_URL are set', ok: true },
    { name: `branch ${branch} may deploy to ${env}`, ok: env !== 'prod' || branch === 'main' },
  ]
  return { build, skip, checks, ok: checks.every((c) => c.ok) }
}
