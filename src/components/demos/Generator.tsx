import { useMemo, useState } from 'react'
import { fromCopybook, parseDdl } from './ddl'
import { exposed, generate, routes, type Lang } from './generate'
import { COPYBOOK, DDL } from './getacct'

const SOURCES = [
  { label: 'ACCTMAST, COBOL', model: () => fromCopybook(COPYBOOK) },
  { label: 'CUSTOMER, DB2', model: () => parseDdl(DDL) },
]
const TTLS = [0, 60, 300]

// The generator, run on the parsed source instead of a fixed template. Pick
// the system, the language and the cache, and the route file is written
// from the fields it found. Sensitive columns stay out unless you ask.
export default function Generator() {
  const [src, setSrc] = useState(0)
  const [lang, setLang] = useState<Lang>('typescript')
  const [ttl, setTtl] = useState(300)
  const [sensitive, setSensitive] = useState(false)
  const [copied, setCopied] = useState(false)
  const model = useMemo(() => SOURCES[src].model(), [src])
  const opts = { lang, ttl, sensitive }
  const code = generate(model, opts)
  const shown = new Set(exposed(model, opts).map((f) => f.source))
  const file = `${model.entity}-api.${lang === 'typescript' ? 'ts' : 'py'}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }
  const download = () => {
    const url = URL.createObjectURL(new Blob([code], { type: 'text/plain' }))
    const a = document.createElement('a')
    a.href = url
    a.download = file
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="demo gen">
      <p className="demo-hint">Switch the source or the language and watch the route rewrite itself.</p>
      <div className="gen-opts">
        <div className="demo-tabs" role="group" aria-label="Source">
          {SOURCES.map((s, i) => <button key={s.label} type="button" aria-pressed={src === i} onClick={() => setSrc(i)}>{s.label}</button>)}
        </div>
        <div className="demo-tabs" role="group" aria-label="Language">
          <button type="button" aria-pressed={lang === 'typescript'} onClick={() => setLang('typescript')}>Express + Zod</button>
          <button type="button" aria-pressed={lang === 'python'} onClick={() => setLang('python')}>FastAPI + Pydantic</button>
        </div>
        <label className="demo-inline">
          Cache
          <select value={ttl} onChange={(e) => setTtl(Number(e.target.value))}>
            {TTLS.map((t) => <option key={t} value={t}>{t ? `${t / 60} min` : 'off'}</option>)}
          </select>
        </label>
        <label className="demo-check tight">
          <input type="checkbox" checked={sensitive} onChange={(e) => setSensitive(e.target.checked)} />
          Expose sensitive columns
        </label>
      </div>

      <div className="gen-grid">
        <div>
          <p className="demo-h">{model.program}, {model.fields.length} fields</p>
          <ul className="gen-fields">
            {model.fields.map((f) => (
              <li key={f.source} className={shown.has(f.source) ? '' : 'off'}>
                <code>{f.source}</code>
                <span>{f.type}{f.maxLength ? `(${f.maxLength})` : ''}{f.required ? '' : '?'}</span>
                {f.sensitive && <em>sensitive</em>}
              </li>
            ))}
          </ul>
          <p className="demo-h">Routes</p>
          <ul className="cb-routes">
            {routes(model).map((r) => <li key={r.path}><b>GET</b> <code>{r.path}</code> <span>{r.why}</span></li>)}
          </ul>
        </div>
        <div className="gen-code">
          <div className="gen-bar">
            <code>{file}</code>
            <span>{code.split('\n').length} lines</span>
            <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy'}</button>
            <button type="button" onClick={download}>Download</button>
          </div>
          <pre>{code}</pre>
        </div>
      </div>
    </div>
  )
}
