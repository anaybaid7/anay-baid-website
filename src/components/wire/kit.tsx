import { useContext, type ReactNode } from 'react'
import { NoteCtx } from './notes'

// Low-fidelity wireframe parts. Everything is drawn in HTML and CSS so a
// screen reads like a sketch, and any part can be wrapped in <N> to tie it
// to a numbered note.

export function N({ n, children, block }: { n: number; children: ReactNode; block?: boolean }) {
  const { on, pick } = useContext(NoteCtx)
  const Tag = block ? 'div' : 'span'
  return (
    <Tag className={`wn ${on === n ? 'on' : ''}`} onClick={(e) => (e.stopPropagation(), pick(n))}>
      <button type="button" className="wn-tag" aria-label={`Note ${n}`} aria-pressed={on === n} onClick={(e) => (e.stopPropagation(), pick(n))}>
        {n}
      </button>
      {children}
    </Tag>
  )
}

export function Win({ title, url, children }: { title: string; url?: string; children: ReactNode }) {
  return (
    <div className="ww">
      <div className="ww-bar">
        <span className="ww-dots"><i /><i /><i /></span>
        {url ? <span className="ww-url">{url}</span> : <b>{title}</b>}
      </div>
      <div className="ww-body">{children}</div>
    </div>
  )
}

// a placeholder line of text, or real text when there is some
export const T = ({ w, children, b }: { w?: number; children?: ReactNode; b?: boolean }) =>
  children ? <span className={b ? 'wt b' : 'wt'}>{children}</span> : <span className="wl" style={{ width: `${w ?? 60}%` }} />

export const Btn = ({ children, primary, added }: { children: ReactNode; primary?: boolean; added?: boolean }) => (
  <span className={['wb', primary ? 'p' : '', added ? 'added' : ''].join(' ')}>{children}</span>
)

export const In = ({ ph, mono }: { ph: string; mono?: boolean }) => <span className={mono ? 'wi mono' : 'wi'}>{ph}</span>

export const Row = ({ children, between }: { children: ReactNode; between?: boolean }) => (
  <div className={between ? 'wr between' : 'wr'}>{children}</div>
)

export const Box = ({ children, title, grow }: { children?: ReactNode; title?: string; grow?: boolean }) => (
  <div className={grow ? 'wx grow' : 'wx'}>
    {title && <p className="wx-h">{title}</p>}
    {children}
  </div>
)

export const Tabs = ({ items, on = 0 }: { items: string[]; on?: number }) => (
  <div className="wtabs">
    {items.map((t, i) => <span key={t} className={i === on ? 'on' : ''}>{t}</span>)}
  </div>
)

export function Tbl({ cols, rows, hot }: { cols: string[]; rows: ReactNode[][]; hot?: number }) {
  return (
    <table className="wtbl">
      <thead><tr>{cols.map((c) => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className={i === hot ? 'hot' : ''}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
        ))}
      </tbody>
    </table>
  )
}

// a grid of cells, square unless rows is given, with some cells marked
export function Board({ n, rows = n, ships = [], hits = [], misses = [] }: { n: number; rows?: number; ships?: number[]; hits?: number[]; misses?: number[] }) {
  return (
    <div className="wboard" style={{ gridTemplateColumns: `repeat(${n}, 1fr)`, ...(rows !== n && { aspectRatio: `${n} / ${rows}`, maxWidth: 'none' }) }}>
      {Array.from({ length: n * rows }, (_, i) => (
        <i key={i} className={hits.includes(i) ? 'h' : misses.includes(i) ? 'm' : ships.includes(i) ? 's' : ''} />
      ))}
    </div>
  )
}

export const Bars = ({ values }: { values: number[] }) => (
  <div className="wbars">{values.map((v, i) => <i key={i} style={{ height: `${v}%` }} />)}</div>
)

export const Meter = ({ v, label }: { v: number; label: string }) => (
  <span className="wmeter"><em>{label}</em><i><b style={{ width: `${v}%` }} /></i></span>
)

export const Img = ({ h = 80, label }: { h?: number; label?: string }) => (
  <span className="wimg" style={{ height: h }}>{label}</span>
)
