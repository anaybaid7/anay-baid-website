import { useMemo, useState } from 'react'
import { projects, allTech } from '../data'

const statusColor: Record<string, string> = {
  Live: 'var(--c-hire)',
  Shipped: 'var(--c-home)',
  Ended: 'var(--ink-dim)',
}

export default function Projects() {
  const [active, setActive] = useState<Set<string>>(new Set())

  const toggle = (tech: string) => {
    setActive((prev) => {
      const next = new Set(prev)
      if (next.has(tech)) {
        next.delete(tech)
      } else {
        next.add(tech)
      }
      return next
    })
  }

  const visible = useMemo(() => {
    if (active.size === 0) return projects
    return projects.filter((p) => p.tech.some((t) => active.has(t)))
  }, [active])

  return (
    <div className="flex flex-col gap-7 max-w-3xl">
      <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--ink-bright)' }}>PROJECTS</h2>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs md:text-sm font-semibold" style={{ color: 'var(--ink-dim)' }}>FILTER BY TECH:</p>
          {active.size > 0 && (
            <button
              onClick={() => setActive(new Set())}
              className="text-xs md:text-sm font-semibold shrink-0 hover:text-[var(--ink-bright)] transition-colors"
              style={{ color: 'var(--c-projects)' }}
            >
              CLEAR ({active.size})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {allTech.map((tech) => {
            const isActive = active.has(tech)
            return (
              <button
                key={tech}
                onClick={() => toggle(tech)}
                className="text-xs md:text-sm px-2.5 py-1.5 rounded-md border-2 font-semibold transition-colors"
                style={
                  isActive
                    ? { background: 'var(--c-projects)', borderColor: 'var(--c-projects)', color: '#3a2410' }
                    : { borderColor: 'var(--line)', color: 'var(--ink-dim)' }
                }
              >
                {tech}
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        {visible.map((p) => (
          <div
            key={p.title}
            className="rounded-lg p-4 flex flex-col gap-2.5 border-2"
            style={{ background: 'var(--screen-bg-2)', borderColor: 'var(--line)' }}
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-bold text-sm md:text-base" style={{ color: 'var(--ink-bright)' }}>{p.title}</h3>
              <span
                className="flex items-center gap-1.5 text-[10px] md:text-xs font-semibold whitespace-nowrap"
                style={{ color: statusColor[p.status] }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: statusColor[p.status] }} />
                {p.status.toUpperCase()}
              </span>
            </div>
            <p className="text-xs md:text-sm" style={{ color: 'var(--ink-dim)' }}>{p.period}</p>
            {p.award && (
              <p className="text-xs md:text-sm font-semibold" style={{ color: 'var(--c-resume)' }}>🏆 {p.award}</p>
            )}
            <p className="text-sm leading-relaxed">{p.description}</p>
            <ul className="flex flex-col gap-1 text-xs md:text-sm">
              {p.bullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: 'var(--ink-dim)' }}>▸</span>
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
            <p className="mt-auto pt-1 text-xs">
              <span className="font-bold" style={{ color: 'var(--c-projects)' }}>TECH </span>
              <span style={{ color: 'var(--ink-dim)' }}>{p.tech.join(', ')}</span>
            </p>
            {p.link && (
              <a
                href={p.link}
                target="_blank"
                rel="noreferrer"
                className="self-end text-xs md:text-sm font-bold hover:underline"
                style={{ color: 'var(--c-home)' }}
              >
                LOAD "{p.title.split(' ')[0].toUpperCase()}" &gt;
              </a>
            )}
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm md:col-span-2" style={{ color: 'var(--ink-dim)' }}>
            No projects match that combination, clear a filter.
          </p>
        )}
      </div>
    </div>
  )
}
