import { useEffect, useState } from 'react'

interface Mark {
  id: string
  label: string
  major: boolean
}

// every visible section and every job or project, in page order
function collect(): Mark[] {
  const marks: Mark[] = []
  document.querySelectorAll<HTMLElement>('main [data-part]').forEach((part) => {
    if (part.dataset.part === 'hero' || part.dataset.part === 'filter' || part.offsetParent === null) return
    const h2 = part.querySelector('h2')
    if (h2?.id) marks.push({ id: h2.id, label: h2.textContent ?? '', major: true })
    part.querySelectorAll<HTMLElement>('.entries > .entry[id]').forEach((row) => {
      const name = row.querySelector('.entry-title a, .entry-title')?.textContent?.replace(/Link$|Copied$/, '').trim()
      marks.push({ id: row.id, label: name ?? row.id, major: false })
    })
  })
  // layout can be reordered from settings, so follow what's on screen
  return marks.sort(
    (a, b) => document.getElementById(a.id)!.getBoundingClientRect().top - document.getElementById(b.id)!.getBoundingClientRect().top,
  )
}

// A column of short lines down the right edge, one per section and per job or
// project. The one you're reading is marked, hovering names it, and clicking
// jumps there. Wide screens only.
export default function Minimap({ version }: { version: string }) {
  const [marks, setMarks] = useState<Mark[]>([])
  const [current, setCurrent] = useState('')

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMarks(collect()))
    return () => cancelAnimationFrame(frame)
  }, [version])

  useEffect(() => {
    let frame = 0
    const update = () => {
      frame = 0
      const line = window.innerHeight * 0.35
      let at = ''
      for (const m of marks) {
        const el = document.getElementById(m.id)
        if (el && el.getBoundingClientRect().top < line) at = m.id
      }
      setCurrent(at)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(frame)
    }
  }, [marks])

  if (marks.length === 0) return null
  return (
    <nav className="minimap" aria-label="Page map">
      <ol>
        {marks.map((m) => (
          <li key={m.id} className={m.major ? 'major' : undefined}>
            <a href={`#${m.id}`} aria-current={current === m.id ? 'location' : undefined}>
              <span>{m.label}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}
