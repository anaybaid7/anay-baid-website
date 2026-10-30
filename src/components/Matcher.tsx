import { useEffect, useMemo, useRef, useState } from 'react'
import { leaning, matchPosting } from '../match'
import { ENTRIES } from '../entries'
import { AREAS, type Area } from '../data'
import { stepsUsing } from '../flowEvidence'

const list = (items: string[]) => new Intl.ListFormat('en-CA', { type: 'conjunction' }).format(items)

// Paste a job posting, see which parts of my stack it asks for and where I've
// used each one. Plain matching against the tech on this page, all in the
// browser, nothing is sent anywhere.
export default function Matcher({ open, onOpenChange, onFilter, onStep, onLens }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFilter: (skills: string[]) => void
  onStep: (id: string, flow: number, step: number) => void
  onLens: (a: Area) => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const [text, setText] = useState('')
  const matches = useMemo(() => matchPosting(text), [text])
  const used = matches.filter((m) => m.where.length > 0)
  const listed = matches.filter((m) => m.where.length === 0)
  const lean = useMemo(() => leaning(used, ENTRIES) as Area | null, [used])
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
                {used.map((m) => {
                  const steps = stepsUsing(m.skill, 2)
                  return (
                    <li key={m.skill}>
                      <b>{m.skill}</b> <span>{list(m.where.map((w) => w.label))}</span>
                      {steps.length > 0 && (
                        <span className="match-steps">
                          <span className="match-see">See it in</span>
                          {steps.map((h) => (
                            <button
                              key={`${h.id}${h.flow}`}
                              type="button"
                              onClick={() => {
                                onOpenChange(false)
                                onStep(h.id, h.flow, h.step)
                              }}
                            >
                              {h.entry}: {h.stepTitle}
                            </button>
                          ))}
                        </span>
                      )}
                    </li>
                  )
                })}
                {listed.map((m) => (
                  <li key={m.skill}>
                    <b>{m.skill}</b> <span>on my resume</span>
                  </li>
                ))}
              </ul>
              {lean && (
                <p className="match-lean">
                  This posting leans toward <b>{AREAS[lean].toLowerCase()}</b>.{' '}
                  <button
                    type="button"
                    onClick={() => {
                      onLens(lean)
                      onOpenChange(false)
                    }}
                  >
                    View the page for that
                  </button>
                </p>
              )}
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
