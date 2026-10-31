// One push, two workflows. The action in this repo validates its inputs and
// sends a repository_dispatch; the target repo's workflow then builds, tests
// and deploys to the one environment named in the payload.
import type { State } from '../sim/Status'

export const ENVS = ['dev', 'staging', 'production'] as const
export type Env = (typeof ENVS)[number]

export interface Step {
  name: string
  log: string
}

export interface Job {
  id: string
  repo: 'action' | 'target'
  name: string
  needs: string[]
  steps: Step[]
}

const who = 'anaybaid7/app/main'

export function jobs(env: Env, token: boolean): Job[] {
  return [
    {
      id: 'trigger',
      repo: 'action',
      name: 'trigger_build',
      needs: [],
      steps: [
        { name: 'Validate inputs', log: 'GITHUB_REPO_NAME, GITHUB_USERNAME, GITHUB_BRANCH_NAME, ENVIRONMENT_NAME set' },
        { name: 'Set up logger', log: '/github/home/logs/github_dispatch_8f2c41d0.log' },
        { name: 'POST /dispatches', log: token ? 'HTTP 204 No Content' : 'HTTP 401 Bad credentials, return value ignored' },
        { name: 'Send email', log: `Build triggered for ${who}/${env}` },
      ],
    },
    { id: 'build', repo: 'target', name: 'build', needs: ['trigger'], steps: [{ name: 'Checkout main', log: 'ref from client_payload' }, { name: 'Build', log: 'npm ci && npm run build' }] },
    { id: 'test', repo: 'target', name: 'test', needs: ['build'], steps: [{ name: 'Test', log: 'all tests passed' }] },
    ...ENVS.map((e) => ({
      id: e,
      repo: 'target' as const,
      name: `deploy-${e}`,
      needs: ['test'],
      steps: [{ name: `if: environment == '${e}'`, log: e === env ? 'condition true, deploying' : 'condition false, skipped' }],
    })),
  ]
}

// final state of every job; without a valid token the target never hears
// about the push, but the action itself still exits green
export function outcome(env: Env, token: boolean): Record<string, State> {
  const out: Record<string, State> = { trigger: 'success' }
  for (const id of ['build', 'test', ...ENVS]) out[id] = token ? 'success' : 'idle'
  if (token) for (const e of ENVS) if (e !== env) out[e] = 'skipped'
  return out
}

// the order jobs finish in, for playing the run
export const order = ['trigger', 'build', 'test', ...ENVS]
