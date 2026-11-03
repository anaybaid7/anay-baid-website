import type { Stage } from './content'

// How much gets forecast each run, built up one term per click. Each stage's
// title is the number and its text says what it counts.

export default function Scale({ stages, at, setAt }: { stages: Stage[]; at: number; setAt: (i: number) => void }) {
  const last = stages.length - 1
  return (
    <div className="scale" onClick={(e) => e.stopPropagation()}>
      <ol className="scale-sum">
        {stages.map((s, i) => (
          <li key={s.title} className={`${i <= at ? 'on' : ''}${i === last ? ' total' : ''}`}>
            {i > 0 && <span className="scale-op">{i === last ? '=' : '×'}</span>}
            <button type="button" aria-pressed={i === at} onClick={() => setAt(i)}>
              <b>{s.title}</b>
              <span>{s.text}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
