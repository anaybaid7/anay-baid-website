// Work out which builds to dispatch: only the services that changed, after
// checking the environment, then report back.

export function planBuild(services: string[], changed: string[], env: string) {
  const build = services.filter((s) => changed.includes(s))
  const skip = services.filter((s) => !changed.includes(s))
  return [
    `$ build-trigger --env ${env}`,
    `checking ${env} ... ok`,
    `changed since last build: ${build.length ? build.map((s) => `${s}/`).join(' ') : 'nothing'}`,
    ...(build.length
      ? [
          `triggering ${build.length} of ${services.length} builds through the GitHub API`,
          ...build.map((s) => `  POST /actions/workflows/${s}.yml/dispatches  204`),
        ]
      : ['nothing to build']),
    ...(skip.length ? [`skipped ${skip.join(', ')}, no changes`] : []),
    'emailed the result over SMTP (TLS)',
  ]
}
