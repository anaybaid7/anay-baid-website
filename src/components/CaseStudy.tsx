import { useEffect, useMemo, useRef, useState } from 'react'
import { DETAILS } from '../details'
import { NOTES } from '../decisions'
import { entryById } from '../entries'
import { H, ICONS, W, layout, route } from './archLayout'
import { TryIt } from './DetailDrawer'

type At = { f: number; s: number }

// The architecture, with the step being read lit up
function StoryDiagram({ id, at }: { id: string; at: At }) {
  const { arch, flows = [] } = DETAILS[id]
  const { boxes, width, height } = useMemo(() => layout(arch), [arch])
  const flow = flows[at.f]
  const live = flow?.steps[at.s]
  const inFlow = new Set(flow?.steps.flatMap((s) => [s.from, s.to]))
  return (
    <svg className="cs-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={live ? `${live.title}` : 'Architecture'}>
      {arch.groups?.map((g) => {
        const m = g.nodes.map((n) => boxes.get(n)!)
        const x = Math.min(...m.map((b) => b.x)) - 12
        const y = Math.min(...m.map((b) => b.y)) - 26
        return (
          <g key={g.label} className="arch-group">
            <rect x={x} y={y} width={Math.max(...m.map((b) => b.x + W)) + 12 - x} height={Math.max(...m.map((b) => b.y + H)) + 12 - y} />
            <text x={x + 10} y={y + 17}>{g.label}</text>
          </g>
        )
      })}
      {arch.edges.map((e) => (
        <path key={`${e.from}-${e.to}`} className="arch-wire" d={route(boxes.get(e.from)!, boxes.get(e.to)!)} />
      ))}
      {flow?.steps.map((s, i) =>
        i < at.s ? <path key={i} className="arch-wire done" d={route(boxes.get(s.from)!, boxes.get(s.to)!)} /> : null,
      )}
      {live && <path key={`${at.f}-${at.s}`} className="cs-live" d={route(boxes.get(live.from)!, boxes.get(live.to)!)} />}
      {[...boxes.values()].map(({ node, x, y }) => (
        <g
          key={node.id}
          transform={`translate(${x},${y})`}
          className={['arch-node', live?.to === node.id ? 'on' : '', live?.from === node.id ? 'from' : '', inFlow.has(node.id) ? '' : 'faded'].join(' ')}
        >
          <rect width={W} height={H} />
          {node.kind && <path d={ICONS[node.kind]} transform="translate(12,12)" className="arch-icon" />}
          <text x={node.kind ? 36 : 14} y={25} className="arch-label">{node.label}</text>
          {node.sub && <text x={14} y={47} className="arch-sub">{node.sub}</text>}
        </g>
      ))}
    </svg>
  )
}

// A long-form read of one piece of work: the problem, the system step by
// step with the diagram following along, the decisions, and the demo.
export default function CaseStudy({ id, onClose }: { id: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const entry = entryById(id)!
  const detail = DETAILS[id]
  const notes = NOTES[id]
  const flows = detail.flows ?? []
  const [at, setAt] = useState<At>({ f: 0, s: 0 })

  useEffect(() => {
    const d = dialog.current
    if (d && !d.open) d.showModal?.()
  }, [])

  // the step nearest the middle of the screen drives the diagram
  useEffect(() => {
    const root = dialog.current
    if (!root || typeof IntersectionObserver !== 'function') return
    const io = new IntersectionObserver(
      (hits) => {
        for (const h of hits) {
          if (!h.isIntersecting) continue
          const el = h.target as HTMLElement
          setAt({ f: Number(el.dataset.f), s: Number(el.dataset.s) })
        }
      },
      { root, rootMargin: '-45% 0px -50% 0px' },
    )
    root.querySelectorAll('.cs-step').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [id])

  return (
    <dialog ref={dialog} className="case" aria-labelledby="case-title" onClose={onClose}>
      <header className="cs-head">
        <p className="cs-kicker">Case study</p>
        <h2 id="case-title">{entry.title}</h2>
        <p className="cs-sub">{entry.kind === 'job' ? `${entry.sub}, ${entry.when}` : entry.when}</p>
        {entry.highlight && (
          <p className="entry-result">
            <b>{entry.highlight.value}</b> {entry.highlight.label}
          </p>
        )}
        <button type="button" className="cs-close" onClick={() => dialog.current?.close()} autoFocus>
          Close
        </button>
      </header>

      <section className="cs-part">
        <h3>The problem</h3>
        <p className="cs-lead">{entry.why}</p>
        {entry.description && <p>{entry.description}</p>}
      </section>

      <section className="cs-part cs-story">
        <h3>How it works</h3>
        <div className="cs-grid">
          <div className="cs-steps">
            {flows.map((fl, f) => (
              <div key={fl.name} className="cs-flow">
                <h4>{fl.name}</h4>
                {fl.summary && <p className="cs-summary">{fl.summary}</p>}
                {fl.steps.map((st, s) => (
                  <article key={s} className={`cs-step ${at.f === f && at.s === s ? 'on' : ''}`} data-f={f} data-s={s}>
                    <p className="cs-n">{s + 1}</p>
                    <h5>{st.title}</h5>
                    <p>{st.detail}</p>
                    {st.payload && (
                      <div className="flow-payload">
                        <p>{st.payload.label}</p>
                        <pre>{st.payload.code}</pre>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ))}
          </div>
          <div className="cs-pin">
            <StoryDiagram id={id} at={at} />
            <p className="cs-where">
              {flows[at.f]?.name}, step {at.s + 1} of {flows[at.f]?.steps.length}
            </p>
          </div>
        </div>
      </section>

      <section className="cs-part">
        <h3>Decisions</h3>
        <ol className="cs-decisions">
          {notes.decisions.map((d) => (
            <li key={d.chose}>
              <p className="cs-chose">{d.chose}</p>
              <p className="cs-over">instead of {d.over}</p>
              <p>{d.because}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="cs-part cs-two">
        <div>
          <h3>What it handles</h3>
          <ul className="dashes">
            {notes.handles.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </div>
        {notes.next && (
          <div>
            <h3>What I’d change next</h3>
            <ul className="dashes">
              {notes.next.map((n) => <li key={n}>{n}</li>)}
            </ul>
          </div>
        )}
      </section>

      {detail.demos && (
        <section className="cs-part">
          <h3>Try it</h3>
          <TryIt demos={detail.demos} />
        </section>
      )}
    </dialog>
  )
}
