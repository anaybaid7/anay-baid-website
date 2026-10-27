import { useEffect, useRef } from 'react'

const SHORTCUTS: [string, string][] = [
  ['J / K', 'Next or previous job or project'],
  ['S', 'Switch between full detail and skim'],
  ['T', 'Switch light and dark'],
  ['M', 'Check against a job posting'],
  ['`', 'Terminal'],
  [',', 'Settings'],
  ['/ or Ctrl K', 'Search'],
  ['Esc', 'Clear a filter or close what is open'],
  ['?', 'This list'],
]

export default function Shortcuts({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) {
      if (d.showModal) d.showModal()
      else d.setAttribute('open', '')
    } else if (!open && d.open) {
      if (d.close) d.close()
      else d.removeAttribute('open')
    }
  }, [open])
  return (
    <dialog ref={dialog} className="sheet keys" aria-labelledby="keys-title" onClose={() => onOpenChange(false)}>
      <div className="sheet-head">
        <h2 id="keys-title">Keyboard shortcuts</h2>
        <button type="button" onClick={() => onOpenChange(false)}>Close</button>
      </div>
      <dl>
        {SHORTCUTS.map(([k, what]) => (
          <div key={k}>
            <dt><kbd>{k}</kbd></dt>
            <dd>{what}</dd>
          </div>
        ))}
      </dl>
    </dialog>
  )
}
