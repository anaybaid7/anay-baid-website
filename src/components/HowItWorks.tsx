import { useId, useState } from 'react'
import type { HowItWorks as How } from '../data'

// A row of steps joined by arrows. Hover, focus or click a step to read what
// it does. Closed by default so the page stays short.
export default function HowItWorks({ how, name }: { how: How; name: string }) {
  const [at, setAt] = useState(0)
  const noteId = useId()
  return (
    <details className="how">
      <summary>How it's built</summary>
      <div className="how-body">
        <ol className="flow" aria-label={`How ${name} fits together`}>
          {how.steps.map((step, i) => (
            <li key={step.label}>
              <button
                type="button"
                className={i === at ? 'node on' : 'node'}
                aria-pressed={i === at}
                aria-describedby={i === at ? noteId : undefined}
                onClick={() => setAt(i)}
                onMouseEnter={() => setAt(i)}
                onFocus={() => setAt(i)}
              >
                {step.label}
              </button>
            </li>
          ))}
        </ol>
        {how.base && <p className="flow-base">{how.base}</p>}
        <p className="flow-note" id={noteId} aria-live="polite">
          <b>{how.steps[at].label}</b> {how.steps[at].note}
        </p>
      </div>
    </details>
  )
}
