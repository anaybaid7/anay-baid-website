import { useEffect, useRef } from 'react'

export interface LogLine {
  src: string
  text: string
  tone?: 'ok' | 'warn' | 'err' | 'info'
}

// A console panel. Each line has a source tag (the service or process that
// wrote it) so it's easy to follow which part of the system is talking.
export function Log({ lines, title = 'Log', empty = 'Nothing yet' }: { lines: LogLine[]; title?: string; empty?: string }) {
  const box = useRef<HTMLOListElement>(null)
  useEffect(() => {
    box.current?.scrollTo?.(0, box.current.scrollHeight)
  }, [lines])
  return (
    <div className="log">
      <p className="log-title">{title}</p>
      <ol ref={box} aria-live="polite">
        {lines.length === 0 && <li className="log-empty">{empty}</li>}
        {lines.map((l, i) => (
          <li key={i} className={l.tone ? `t-${l.tone}` : ''}>
            <span className="log-src">{l.src}</span>
            <span>{l.text}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
