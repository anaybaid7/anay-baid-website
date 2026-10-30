import { NOTES } from '../decisions'

// Design notes for one entry: each decision as what I chose, over what, and
// why, then the failure cases it handles and what I'd change next.
export default function Decisions({ id }: { id: string }) {
  const n = NOTES[id]
  if (!n) return null
  return (
    <div className="decisions">
      <ol className="dec-list">
        {n.decisions.map((d, i) => (
          <li key={i}>
            <p className="dec-chose">
              <span className="dec-n">{i + 1}</span>
              {d.chose}
            </p>
            <p className="dec-over">
              <span>instead of</span> {d.over}
            </p>
            <p className="dec-why">{d.because}</p>
          </li>
        ))}
      </ol>
      <div className="dec-cols">
        <section>
          <h3>What it handles</h3>
          <ul className="dashes">
            {n.handles.map((h) => <li key={h}>{h}</li>)}
          </ul>
        </section>
        {n.next && (
          <section>
            <h3>What I’d change next</h3>
            <ul className="dashes">
              {n.next.map((h) => <li key={h}>{h}</li>)}
            </ul>
          </section>
        )}
      </div>
    </div>
  )
}
