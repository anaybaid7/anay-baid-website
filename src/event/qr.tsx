import qrcode from 'qrcode-generator'
import { profile } from '../data'
import { deck } from './content'

// The closing slide: a code that opens these slides on a phone, plus how to
// reach me.

function code(text: string) {
  const qr = qrcode(0, 'M')
  qr.addData(text)
  qr.make()
  const n = qr.getModuleCount()
  let d = ''
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c},${r}h1v1h-1z`
  return { n, d }
}

export default function Qr() {
  const { n, d } = code(deck.url)
  return (
    <div className="qr" onClick={(e) => e.stopPropagation()}>
      <svg className="qr-code" viewBox={`-2 -2 ${n + 4} ${n + 4}`} role="img" aria-label={`QR code for ${deck.url}`}>
        <rect x="-2" y="-2" width={n + 4} height={n + 4} rx="1.5" className="qr-bg" />
        <path d={d} className="qr-dots" />
      </svg>
      <div className="qr-reach">
        <a href={deck.url}>{deck.url.replace('https://', '')}</a>
        <a href={`mailto:${profile.email}`}>{profile.email}</a>
        <a href={profile.links.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
      </div>
    </div>
  )
}
