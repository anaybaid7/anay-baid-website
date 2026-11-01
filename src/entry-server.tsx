import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { CASE_IDS, casePath, caseSlug } from './cases.ts'
import { entryById } from './entries.ts'
import { DETAILS } from './details.ts'
import { FEATURED } from './showcase.ts'

// Rendered once at build time so the page paints before any JavaScript runs.
export function render() {
  return renderToString(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}

// what each case study page says about itself in link previews
export function cases() {
  return CASE_IDS.map((id) => {
    const e = entryById(id)!
    const name = e.title.replace(/ \(.*\)$/, '')
    const result = e.highlight ? `${e.highlight.value} ${e.highlight.label}. ` : ''
    return {
      path: casePath(id),
      slug: caseSlug(id),
      title: `${name} case study, Anay Baid`,
      description: `${result}${e.why} How it works step by step, the decisions behind it, and a live demo.`,
      // for the preview image
      name,
      sub: e.kind === 'job' ? e.sub : e.when,
      value: e.highlight?.value ?? '',
      label: e.highlight?.label ?? '',
      why: e.why,
      kind: FEATURED.find((f) => f.id === id)?.kind ?? DETAILS[id].demos?.[0]?.kind,
    }
  })
}
