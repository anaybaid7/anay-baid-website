import { useEffect, useRef } from 'react'
import { downloadResume } from '../downloadResume'

import { RESUME_PDF as PDF } from '../resume'

export default function ResumeViewer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const d = dialog.current
    if (!d) return
    if (open && !d.open) d.showModal?.()
    if (!open && d.open) d.close?.()
  }, [open])

  return (
    <dialog ref={dialog} className="resume" aria-label="Resume" onClose={onClose} onClick={(e) => e.target === dialog.current && onClose()}>
      <div className="resume-box">
        <div className="resume-bar">
          <span>Anay Baid, resume</span>
          <span className="resume-actions">
            <button type="button" className="resume-dl" onClick={downloadResume}>Download PDF</button>
            <button type="button" onClick={onClose}>Close</button>
          </span>
        </div>
        {open && (
          <object data={`${PDF}#view=FitH`} type="application/pdf" aria-label="Anay Baid's resume">
            <div className="resume-fallback">
              <p>This browser can't show the PDF inside the page.</p>
              <p>
                <a href={PDF} target="_blank" rel="noreferrer">Open it in a new tab</a> or{' '}
                <button type="button" onClick={downloadResume}>download it</button>.
              </p>
            </div>
          </object>
        )}
      </div>
    </dialog>
  )
}
