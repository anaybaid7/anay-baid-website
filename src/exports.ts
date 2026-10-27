// The build writes these next to the page (see publishResume in vite.config.ts),
// so they work as plain links too, and from curl.
export const FILES = {
  text: 'resume.txt',
  json: 'resume.json',
  vcard: 'anay-baid.vcf',
} as const

export function download(path: string) {
  const a = Object.assign(document.createElement('a'), { href: path, download: path })
  document.body.append(a)
  a.click()
  a.remove()
}

export const downloadVcard = () => download(FILES.vcard)
export const downloadJsonResume = () => download(FILES.json)
