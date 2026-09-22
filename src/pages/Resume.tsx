import { useMemo, useState } from 'react'
import { experience, education, allTech, profile, skills } from '../data'
import { downloadResume } from '../downloadResume'

export default function Resume() {
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
    if (active.size === 0) return experience
    return experience.filter((e) => e.tech.some((t) => active.has(t)))
  }, [active])

  return (
    <div className="flex flex-col gap-7 max-w-2xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--ink-bright)' }}>RESUME</h2>
        <button
          onClick={downloadResume}
          className="text-xs md:text-sm px-3 py-1.5 rounded-md border-2 font-semibold"
          style={{ borderColor: 'var(--c-resume)', color: 'var(--c-resume)' }}
        >
          ↓ DOWNLOAD PDF
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <p className="text-xs md:text-sm font-semibold" style={{ color: 'var(--ink-dim)' }}>
            FILTER BY TECH (PICK AS MANY AS YOU LIKE):
          </p>
          {active.size > 0 && (
            <button
              onClick={() => setActive(new Set())}
              className="text-xs md:text-sm font-semibold shrink-0 hover:text-[var(--ink-bright)] transition-colors"
              style={{ color: 'var(--c-resume)' }}
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
                    ? { background: 'var(--c-resume)', borderColor: 'var(--c-resume)', color: '#3a2410' }
                    : { borderColor: 'var(--line)', color: 'var(--ink-dim)' }
                }
              >
                {tech}
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {visible.map((entry) => (
          <div key={entry.org} className="rounded-lg p-4" style={{ background: 'var(--screen-bg-2)', border: '1px solid var(--line)' }}>
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex items-start gap-3">
                <img
                  src={entry.logo}
                  alt={`${entry.org} logo`}
                  className="w-10 h-10 rounded-md object-contain shrink-0 p-1"
                  style={{ background: '#fff' }}
                  loading="lazy"
                />
                <div>
                  <a
                    href={entry.orgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-base md:text-lg hover:underline"
                    style={{ color: 'var(--ink-bright)' }}
                  >
                    {entry.org}
                  </a>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--ink-dim)' }}>{entry.role}</p>
                </div>
              </div>
              <span className="text-xs md:text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--c-resume)' }}>{entry.period}</span>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed">
              {entry.bullets.map((b, i) => (
                <li key={i} className="flex gap-2">
                  <span style={{ color: 'var(--ink-dim)' }}>▸</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs md:text-sm">
              <span className="font-bold" style={{ color: 'var(--c-resume)' }}>TECH </span>
              <span style={{ color: 'var(--ink-dim)' }}>{entry.tech.join(', ')}</span>
            </p>
          </div>
        ))}
        {visible.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--ink-dim)' }}>No roles match that combination, clear a filter.</p>
        )}
      </div>

      <div className="rounded-lg p-4" style={{ background: 'var(--screen-bg-2)', border: '1px solid var(--line)' }}>
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div className="flex items-start gap-3">
            <img
              src={education.logo}
              alt={`${education.school} logo`}
              className="w-10 h-10 rounded-md object-contain shrink-0 p-1"
              style={{ background: '#fff' }}
              loading="lazy"
            />
            <div>
              <h3 className="font-bold text-base md:text-lg" style={{ color: 'var(--ink-bright)' }}>{education.school}</h3>
              <p className="text-sm mt-0.5" style={{ color: 'var(--ink-dim)' }}>
                {education.degree}, {education.specializations}
              </p>
            </div>
          </div>
          <span className="text-xs md:text-sm font-semibold" style={{ color: 'var(--c-resume)' }}>{education.gradDate}</span>
        </div>
        <ul className="mt-3 flex flex-col gap-1.5 text-sm leading-relaxed">
          {education.highlights.map((h, i) => (
            <li key={i} className="flex gap-2">
              <span style={{ color: 'var(--ink-dim)' }}>▸</span>
              <span>{h}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-lg p-4" style={{ background: 'var(--screen-bg-2)', border: '1px solid var(--line)' }}>
        <h3 className="font-bold text-base md:text-lg" style={{ color: 'var(--ink-bright)' }}>TECHNICAL SKILLS</h3>
        <div className="mt-3 flex flex-col gap-2 text-sm">
          {(
            [
              ['Languages', skills.languages],
              ['Frameworks and Libraries', skills.frameworks],
              ['DevOps and Tools', skills.devops],
            ] as const
          ).map(([label, list]) => (
            <p key={label}>
              <span className="font-bold" style={{ color: 'var(--c-resume)' }}>{label} </span>
              <span style={{ color: 'var(--ink-dim)' }}>{list.join(', ')}</span>
            </p>
          ))}
        </div>
      </div>

      <p className="text-xs md:text-sm" style={{ color: 'var(--ink-dim)' }}>
        {profile.phone} · {profile.email}
      </p>
    </div>
  )
}
