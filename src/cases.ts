import { DETAILS } from './details'
import { NOTES } from './decisions'

// entries with enough written down for a full case study: decision notes
// and at least one flow through the system
export const hasCase = (id: string) => Boolean(NOTES[id] && DETAILS[id]?.flows?.length)

export const caseFromUrl = () => {
  const id = new URLSearchParams(location.search).get('case')
  return id && hasCase(id) ? id : null
}
