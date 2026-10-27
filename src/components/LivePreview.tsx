import { useEffect, useRef } from 'react'

// The live game in a frame, only loaded once someone asks for it so the page
// itself never waits on Render waking up.
export default function LivePreview({ url, title, open, onOpenChange }: {
  url: string
  title: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
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
    <dialog ref={dialog} className="sheet preview" aria-labelledby="preview-title" onClose={() => onOpenChange(false)}>
      <div className="sheet-head">
        <h2 id="preview-title">{title}</h2>
        <span className="preview-actions">
          <a href={url} target="_blank" rel="noreferrer">Open in a new tab</a>
          <button type="button" onClick={() => onOpenChange(false)}>Close</button>
        </span>
      </div>
      <p className="sheet-note">
        The free server sleeps when nobody is playing, so the first load can take up to a minute. If it doesn't show up
        here, open it in a new tab.
      </p>
      {open && <iframe src={url} title={title} loading="lazy" allow="clipboard-write" referrerPolicy="no-referrer" />}
    </dialog>
  )
}
