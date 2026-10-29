// The build trigger action, ported from gitpython.py. Inputs come from
// environment variables, missing ones stop the run, and a single
// repository_dispatch event carries the branch and environment to build.

export interface Inputs {
  GITHUB_REPO_NAME: string
  GITHUB_USERNAME: string
  GITHUB_BRANCH_NAME: string
  ENVIRONMENT_NAME: string
  SEND_EMAIL_NOTIFICATION: boolean
  INPUT_CUSTOM_DATA: string
}

const REQUIRED = ['GITHUB_REPO_NAME', 'GITHUB_USERNAME', 'GITHUB_BRANCH_NAME', 'ENVIRONMENT_NAME'] as const

export function validate(env: Inputs): string | null {
  const missing = REQUIRED.find((k) => !env[k].trim())
  return missing ? `Error: Required environment variable ${missing} is missing.` : null
}

export function payload(env: Inputs) {
  const custom = env.INPUT_CUSTOM_DATA.trim() ? JSON.parse(env.INPUT_CUSTOM_DATA) : {}
  return {
    url: `https://api.github.com/repos/${env.GITHUB_USERNAME}/${env.GITHUB_REPO_NAME}/dispatches`,
    body: {
      event_type: 'build',
      client_payload: { ref: env.GITHUB_BRANCH_NAME, environment: env.ENVIRONMENT_NAME, ...custom },
    },
  }
}

export const target = (env: Inputs) => `${env.GITHUB_USERNAME}/${env.GITHUB_REPO_NAME}/${env.GITHUB_BRANCH_NAME}/${env.ENVIRONMENT_NAME}`

// the receiving workflow runs only the job whose environment matches
export const jobsFor = (environment: string, jobs: string[]) =>
  jobs.map((job) => ({ job, runs: job === environment }))
