// The actual resume Anay submits through WaterlooWorks lives as a static
// file in public/, so what a visitor downloads here is byte-for-byte the
// same PDF he hands to recruiters, not a re-creation of it. An earlier
// version of this function generated a PDF client-side from data.ts with
// jsPDF; that was a fun technical exercise, but it necessarily drifted from
// the true source document (missing the actual layout, hyperlinked contact
// icons, and full Technical Skills section), so it's gone in favor of this.
const RESUME_URL = '/Anay_Baid_Resume.pdf'

export function downloadResume() {
  const a = document.createElement('a')
  a.href = RESUME_URL
  a.download = 'Anay_Baid_Resume.pdf'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
