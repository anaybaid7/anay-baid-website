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

export default function CodeView({ file, source }: { file: string; source: string }) {
  const [copied, setCopied] = useState(false)
  const lines = useMemo(() => source.trimEnd().split('\n').map(highlight), [source])
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
        <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
      </figcaption>
      <pre tabIndex={0} aria-label={`Source of ${file}`}>
        {lines.map((parts, i) => (
          <span className="ln" key={i}>
            {parts.map((p, j) => (typeof p === 'string' ? p : <span key={j} className={`t-${p.cls}`}>{p.text}</span>))}
            {'\n'}
          </span>
        ))}
      </pre>
    </figure>
  )
}
