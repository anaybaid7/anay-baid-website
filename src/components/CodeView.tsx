import { useMemo, useState } from 'react'

const KEYWORDS = new Set(
  'const let function return if else for of in export import from type interface new as typeof while break continue true false null undefined'.split(' '),
)

// one pass over the source, tagging comments, strings, numbers, keywords
// and function calls. Small on purpose, it only needs to read well.
const TOKEN = /(\/\/.*$)|('(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|`(?:[^`\\]|\\.)*`)|(\b\d[\d_.]*\b)|([A-Za-z_$][\w$]*)(?=\s*\()|([A-Za-z_$][\w$]*)/gm

function highlight(line: string) {
  const out: (string | { cls: string; text: string })[] = []
  let last = 0
  for (const m of line.matchAll(TOKEN)) {
    if (m.index! > last) out.push(line.slice(last, m.index))
    const [text, comment, str, num, call, word] = m
    const cls = comment ? 'c' : str ? 's' : num ? 'n' : call ? (KEYWORDS.has(call) ? 'k' : 'f') : word && KEYWORDS.has(word) ? 'k' : ''
    out.push(cls ? { cls, text } : text)
    last = m.index! + text.length
  }
  if (last < line.length) out.push(line.slice(last))
  return out
}

// Splits the file into blocks the way literate-programming tools do: each
// run of whole-line comments becomes the note, the code under it until the
// next note is what it explains.
interface Block {
  note: string[]
  code: { n: number; parts: ReturnType<typeof highlight> }[]
}

function blocks(source: string): Block[] {
  const out: Block[] = []
  let cur: Block = { note: [], code: [] }
  source.trimEnd().split('\n').forEach((line, i) => {
    const c = line.match(/^\s*\/\/ ?(.*)$/)
    if (c) {
      if (cur.code.some((l) => l.parts.length)) {
        out.push(cur)
        cur = { note: [], code: [] }
      }
      cur.note.push(c[1])
    } else cur.code.push({ n: i + 1, parts: highlight(line) })
  })
  out.push(cur)
  // drop blank lines at the edges of each block
  for (const b of out) {
    while (b.code.length && !b.code[0].parts.length) b.code.shift()
    while (b.code.length && !b.code[b.code.length - 1].parts.length) b.code.pop()
  }
  return out.filter((b) => b.code.length || b.note.length)
}

// a note's lines joined into sentences, blank comment lines starting a new paragraph
const paragraphs = (note: string[]) =>
  note
    .join('\n')
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n\s*/g, ' ').trim())
    .filter(Boolean)

const Line = ({ parts }: { parts: ReturnType<typeof highlight> }) => (
  <>
    {parts.map((p, j) => (typeof p === 'string' ? p : <span key={j} className={`t-${p.cls}`}>{p.text}</span>))}
    {'\n'}
  </>
)

export default function CodeView({ file, source }: { file: string; source: string }) {
  const [copied, setCopied] = useState(false)
  const [notes, setNotes] = useState(true)
  const lines = useMemo(() => source.trimEnd().split('\n').map(highlight), [source])
  const parts = useMemo(() => blocks(source), [source])
  const copy = () =>
    navigator.clipboard?.writeText(source).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      },
      () => {},
    )

  return (
    <figure className="code">
      <figcaption>
        <code>{file}</code>
        <span>{lines.length} lines</span>
        <button type="button" aria-pressed={notes} onClick={() => setNotes(!notes)}>{notes ? 'Plain code' : 'Notes beside code'}</button>
        <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </figcaption>
      {notes ? (
        <div className="literate">
          {parts.map((b, i) => (
            <section key={i} className="lit-block">
              <div className="lit-note">
                {paragraphs(b.note).map((p, j) => <p key={j}>{p}</p>)}
              </div>
              {b.code.length > 0 && (
                <pre tabIndex={0} aria-label={`${file}, lines ${b.code[0].n} to ${b.code[b.code.length - 1].n}`}>
                  {b.code.map((l) => (
                    <span className="ln" key={l.n} data-n={l.n}>
                      <Line parts={l.parts} />
                    </span>
                  ))}
                </pre>
              )}
            </section>
          ))}
        </div>
      ) : (
        <pre tabIndex={0} aria-label={`Source of ${file}`}>
          {lines.map((parts, i) => (
            <span className="ln" key={i}>
              <Line parts={parts} />
            </span>
          ))}
        </pre>
      )}
    </figure>
  )
}
