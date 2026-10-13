import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react'

export interface Command {
  group: string
  label: string
  keywords?: string
  run: () => void
}

// Cmd/Ctrl+K or "/" opens it. Type to filter, arrows to move, Enter to run.
export default function CommandMenu({ commands, open, onOpenChange }: {
  commands: Command[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable]')
      if ((e.key === 'k' && (e.metaKey || e.ctrlKey)) || (e.key === '/' && !typing && !open)) {
        e.preventDefault()
        onOpenChange(!open)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      d.showModal?.()
      if (!d.showModal) d.setAttribute('open', '')
      setQuery('')
      setIndex(0)
      requestAnimationFrame(() => input.current?.focus())
    } else if (!open && d.open) {
      d.close?.()
      if (!d.close) d.removeAttribute('open')
    }
  }, [open])

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    return commands.filter((c) => {
      const hay = `${c.group} ${c.label} ${c.keywords ?? ''}`.toLowerCase()
      return words.every((w) => hay.includes(w))
    })
  }, [commands, query])

  const run = (c: Command) => {
    onOpenChange(false)
    // let the dialog close before scrolling or opening anything
    setTimeout(c.run, 0)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[index]) {
      e.preventDefault()
      run(results[index])
    }
  }

  useEffect(() => {
    document.getElementById(`cmd-${index}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [index])

  return (
    <dialog
      ref={dialog}
      className="cmd"
      aria-label="Search the site"
      onClose={() => onOpenChange(false)}
      onClick={(e) => e.target === dialog.current && onOpenChange(false)}
    >
      <div className="cmd-box">
        <input
          ref={input}
          className="cmd-input"
          placeholder="Search jobs, projects, or do something"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIndex(0)
          }}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded="true"
          aria-controls="cmd-list"
          aria-activedescendant={results[index] ? `cmd-${index}` : undefined}
        />
        <ul className="cmd-list" id="cmd-list" role="listbox" aria-label="Results">
          {results.length === 0 && <li className="cmd-empty">Nothing matches "{query}". Try a company, a project or "resume".</li>}
          {results.map((c, i) => {
            const head = i === 0 || results[i - 1].group !== c.group ? c.group : null
            return (
              <li key={`${c.group}-${c.label}`} role="presentation">
                {head && <p className="cmd-group">{head}</p>}
                <div
                  id={`cmd-${i}`}
                  role="option"
                  aria-selected={i === index}
                  className={i === index ? 'cmd-item on' : 'cmd-item'}
                  onMouseMove={() => setIndex(i)}
                  onClick={() => run(c)}
                >
                  {c.label}
                </div>
              </li>
            )
          })}
        </ul>
        <p className="cmd-foot">Arrows to move, Enter to open, Esc to close</p>
      </div>
    </dialog>
  )
}
