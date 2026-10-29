import { useState } from 'react'
import '@fontsource/balsamiq-sans/latin-400.css'
import '@fontsource/balsamiq-sans/latin-700.css'
import { slides } from '../event/content'
import type { ArchNode, ScreenKind } from '../details'
import { NoteCtx } from './wire/notes'
import { WIREFRAMES, type Screen } from './wire/screens'

interface Props {
  kind: ScreenKind
  nodes: ArchNode[]
  onNode: (id: string) => void
}

// a link from a note to the box in the diagram it talks to
function NodeLink({ id, nodes, onNode }: { id?: string; nodes: ArchNode[]; onNode: (id: string) => void }) {
  const node = nodes.find((n) => n.id === id)
  if (!node) return null
  return (
    <button type="button" className="to-node" onClick={() => onNode(node.id)}>
      Handled by <b>{node.label}</b>, show it in the diagram <span aria-hidden="true">→</span>
    </button>
  )
}

// screen tabs shared by the screenshots and the wireframes
function ScreenTabs({ names, at, onPick }: { names: string[]; at: number; onPick: (i: number) => void }) {
  if (names.length < 2) return null
  return (
    <div className="sub-tabs" role="tablist" aria-label="Screens">
      {names.map((n, i) => (
        <button key={n} type="button" role="tab" aria-selected={i === at} onClick={() => onPick(i)}>
          {n}
        </button>
      ))}
    </div>
  )
}

// Wireframes drawn from the real layouts. Numbered notes explain each part,
// and each note links to the part of the architecture behind it.
function Wireframes({ screens, nodes, onNode }: { screens: Screen[]; nodes: ArchNode[]; onNode: (id: string) => void }) {
  const [at, setAt] = useState(0)
  const [on, setOn] = useState(1)
  const screen = screens[at]
  const note = screen.notes.find((x) => x.n === on) ?? screen.notes[0]
  return (
    <div className="wires">
      <ScreenTabs names={screens.map((s) => s.name)} at={at} onPick={(i) => (setAt(i), setOn(1))} />
      <div className="wires-grid">
        <NoteCtx.Provider value={{ on: note.n, pick: setOn }}>
          <div className="wire-canvas">{screen.draw()}</div>
        </NoteCtx.Provider>
        <ol className="wire-notes">
          {screen.notes.map((x) => (
            <li key={x.n} className={x.n === note.n ? 'on' : ''}>
              <button type="button" onClick={() => setOn(x.n)} aria-pressed={x.n === note.n}>
                <span className="wn-num">{x.n}</span>
                <b>{x.title}</b>
              </button>
              {x.n === note.n && (
                <div className="wire-note-body">
                  <p>{x.text}</p>
                  <NodeLink id={x.node} nodes={nodes} onNode={onNode} />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
      <p className="metrics-note">Wireframes of the real screens, with made-up data. Pick a number to read about that part.</p>
    </div>
  )
}

// The forecast tool screens from the event page, mock data, with numbered
// call-outs over the real screenshots.
function ForecastTool({ nodes, onNode }: { nodes: ArchNode[]; onNode: (id: string) => void }) {
  const shots = slides.filter((s) => s.image && s.spots?.length)
  const [at, setAt] = useState(0)
  const [spot, setSpot] = useState(0)
  const shot = shots[at]
  const active = shot.spots![spot]
  return (
    <div className="shots">
      <ScreenTabs names={shots.map((s) => s.title)} at={at} onPick={(i) => (setAt(i), setSpot(0))} />
      <div className="shot">
        <img src={shot.image} alt={`${shot.title}, a screen with mock data`} loading="lazy" />
        {shot.spots!.map((s, i) => (
          <button
            key={s.title}
            type="button"
            className={i === spot ? 'spot on' : 'spot'}
            style={{ left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${s.w * 100}%`, height: `${s.h * 100}%` }}
            aria-label={`${i + 1}, ${s.title}`}
            aria-pressed={i === spot}
            onClick={() => setSpot(i)}
          >
            <span>{i + 1}</span>
          </button>
        ))}
      </div>
      <div className="shot-note" aria-live="polite">
        <p><b>{active.title}</b> {active.text}</p>
        {!shot.image!.includes('powerbi') && <NodeLink id="api" nodes={nodes} onNode={onNode} />}
      </div>
      <p className="metrics-note">Mock data. These are the screens from my intern event talk.</p>
    </div>
  )
}

export default function Screens({ kind, nodes, onNode }: Props) {
  if (kind === 'forecast-tool') return <ForecastTool nodes={nodes} onNode={onNode} />
  return <Wireframes key={kind} screens={WIREFRAMES[kind]} nodes={nodes} onNode={onNode} />
}
