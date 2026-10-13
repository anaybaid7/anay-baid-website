export const RESUME_PDF = '/Anay_Baid_Resume.pdf'

// Reads the resume right on the page. Phones mostly can't show a PDF inside
// a page, so there it just opens the file in a new tab instead.
export function openResume(show: () => void) {
  if (window.matchMedia('(max-width: 700px)').matches) window.open(RESUME_PDF, '_blank', 'noopener')
  else show()
}
