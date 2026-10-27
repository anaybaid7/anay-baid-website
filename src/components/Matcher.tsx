import { useEffect, useMemo, useRef, useState } from 'react'
import { matchPosting } from '../match'

const list = (items: string[]) => new Intl.ListFormat('en-CA', { type: 'conjunction' }).format(items)

// Paste a job posting, see which parts of my stack it asks for and where I've
// used each one. Plain matching against the tech on this page, all in the
// browser, nothing is sent anywhere.
export default function Matcher({ open, onOpenChange, onFilter }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilter: (skills: string[]) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [text, setText] = useState('')
  const matches = useMemo(() => matchPosting(text), [text])
  const used = matches.filter((m) => m.where.length > 0)
  const listed = matches.filter((m) => m.where.length === 0)
  const places = Array.from(new Set(used.flatMap((m) => m.where.map((w) => w.label))))

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
    <dialog ref={dialog} className="sheet matcher" aria-labelledby="matcher-title" onClose={() => onOpenChange(false)}>
      <div className="sheet-head">
        <h2 id="matcher-title">Check against a job posting</h2>
        <button type="button" onClick={() => onOpenChange(false)}>Close</button>
      </div>
      <p className="sheet-note">
        Paste the posting below. Anything it mentions from my stack is listed with where I've used it. This runs in your
        browser and nothing you paste leaves the page.
      </p>
      <label className="sr-only" htmlFor="posting">Job posting</label>
      <textarea
        id="posting"
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={8}
        placeholder="Paste the requirements or the whole posting"
      />
      {text.trim() !== '' && (
        <div className="match-out" aria-live="polite">
          {matches.length === 0 ? (
            <p>Nothing from my stack came up in that text.</p>
          ) : (
            <>
              <p className="match-sum">
                <b>{matches.length}</b> {matches.length === 1 ? 'thing' : 'things'} from my stack
                {used.length > 0 && <>, {used.length} with work on this page to back {used.length === 1 ? 'it' : 'them'} up</>}.
              </p>
              <ul className="match-list">
                {used.map((m) => (
                  <li key={m.skill}>
                    <b>{m.skill}</b> <span>{list(m.where.map((w) => w.label))}</span>
                  </li>
                ))}
                {listed.map((m) => (
                  <li key={m.skill}>
                    <b>{m.skill}</b> <span>on my resume</span>
                  </li>
                ))}
              </ul>
              {used.length > 0 && (
                <p className="sheet-actions">
                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      onFilter(used.map((m) => m.skill))
                      onOpenChange(false)
                    }}
                  >
                    Show only {places.length === 1 ? 'that' : `those ${places.length}`} on the page
                  </button>
                </p>
              )}
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
