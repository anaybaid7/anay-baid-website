import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { complete, run, type Action } from '../terminal'

interface Line {
  text: string
  input?: boolean
}

const GREETING: Line[] = [{ text: 'anay@a2baid ~ type help for commands, tab completes, esc closes' }]

// A small shell over the page's data. Opened with the backtick key or from
// search. History with up and down, tab completion, and commands that drive
// the page (open, filter, theme, view).
export default function Terminal({ open, onOpenChange, onAction }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (a: Action) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const input = useRef<HTMLInputElement>(null)
  const screen = useRef<HTMLDivElement>(null)
  const [lines, setLines] = useState<Line[]>(GREETING)
  const [value, setValue] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [back, setBack] = useState(-1)

  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      if (d.showModal) d.showModal()
      else d.setAttribute('open', '')
      requestAnimationFrame(() => input.current?.focus())
    } else if (!open && d.open) {
      if (d.close) d.close()
      else d.removeAttribute('open')
    }
  }, [open])

  useEffect(() => {
    screen.current?.scrollTo?.(0, screen.current.scrollHeight)
  }, [lines])

  const submit = () => {
    const out = run(value)
    if (value.trim()) setHistory((h) => [...h, value])
    setBack(-1)
    setValue('')
    if (out.action?.kind === 'clear') return setLines([])
    setLines((l) => [...l, { text: value, input: true }, ...out.lines.map((text) => ({ text }))])
    if (out.action?.kind === 'exit') return onOpenChange(false)
    if (out.action) {
      // open and resume put something else on screen, so the terminal steps aside
      if (out.action.kind === 'open' || out.action.kind === 'resume') onOpenChange(false)
      onAction(out.action)
    }
  }

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') return submit()
    if (e.key === 'Tab') {
      e.preventDefault()
      return setValue(complete(value))
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault()
      if (!history.length) return
      const next = e.key === 'ArrowUp' ? (back < 0 ? history.length - 1 : Math.max(0, back - 1)) : back < 0 ? -1 : back + 1
      if (next < 0 || next >= history.length) {
        setBack(-1)
        return setValue('')
      }
      setBack(next)
      setValue(history[next])
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault()
      setLines([])
    }
  }

  return (
    <dialog ref={dialog} className="sheet terminal" aria-label="Terminal" onClose={() => onOpenChange(false)}>
      <div className="term-screen" ref={screen} onClick={() => input.current?.focus()}>
        {lines.map((l, i) => (
          <div key={i} className={l.input ? 'term-in' : 'term-out'}>
            {l.input && <span className="term-prompt">$ </span>}
            {l.text || ' '}
          </div>
        ))}
        <label className="term-line">
          <span className="term-prompt">$ </span>
          <input
            ref={input}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKey}
            aria-label="Command"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
          />
        </label>
      </div>
    </dialog>
  )
}
