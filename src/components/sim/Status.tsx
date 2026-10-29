export type State = 'idle' | 'queued' | 'running' | 'success' | 'warn' | 'failed' | 'skipped'

const LABEL: Record<State, string> = {
  idle: 'Not run',
  queued: 'Queued',
  running: 'Running',
  success: 'Success',
  warn: 'Passed with warnings',
  failed: 'Failed',
  skipped: 'Skipped',
}

// A small square state marker, the same colours everywhere in the demos
export function Status({ state, label }: { state: State; label?: boolean }) {
  return (
    <span className={`status s-${state}`} title={LABEL[state]}>
      <i aria-hidden="true" />
      {label ? LABEL[state] : <span className="sr-only">{LABEL[state]}</span>}
    </span>
  )
}
