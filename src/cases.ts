import { DETAILS } from './details'
import { NOTES } from './decisions'

// entries with enough written down for a full case study: decision notes
// and at least one flow through the system
export const hasCase = (id: string) => Boolean(NOTES[id] && DETAILS[id]?.flows?.length)

export const CASE_IDS = Object.keys(NOTES).filter(hasCase)

// /work/purolator, /work/insightvault and so on
export const caseSlug = (id: string) => id.replace(/^(job|project)-/, '').replace(/-(entertainment|enterprise-automation-suite|for-purolator|build-automation-tool|ai)$/, '')
export const casePath = (id: string) => `/work/${caseSlug(id)}/`

// a case study opens from its own path, or from ?case= on any page
export const caseFromUrl = () => {
  const bySlug = location.pathname.match(/^\/work\/([a-z0-9-]+)\/?$/)?.[1]
  const id = bySlug ? CASE_IDS.find((c) => caseSlug(c) === bySlug) : new URLSearchParams(location.search).get('case')
  return id && hasCase(id) ? id : null
}
