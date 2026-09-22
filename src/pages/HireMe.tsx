import { useState } from 'react'
import { profile } from '../data'
import { downloadResume } from '../downloadResume'

function CopyField({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard API can be unavailable (insecure context, denied
      // permission, unsupported browser). The value is still plain text on
      // the page, so this degrades to "select it yourself", not broken.
    }
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 text-left hover:text-[var(--ink-bright)] transition-colors"
      aria-label={`Copy ${value} to clipboard`}
    >
      <span>{value}</span>
      <span className="text-[10px] font-semibold" style={{ color: copied ? 'var(--c-hire)' : 'var(--ink-dim)' }}>
        {copied ? 'COPIED' : 'COPY'}
      </span>
    </button>
  )
}

export default function HireMe() {
  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h2 className="text-2xl md:text-3xl font-bold leading-tight" style={{ color: 'var(--ink-bright)' }}>
        LOOKING TO HIRE AN ANAY?
      </h2>
      <p className="text-sm md:text-base leading-relaxed">
        I'm looking for New Grad Software Engineering roles starting in 2027. If you're looking for
        a full-stack or backend engineer who's comfortable picking up whatever the team actually
        needs, let's talk.
      </p>

      <div className="flex flex-wrap gap-3">
        <a
          href={`mailto:${profile.email}`}
          className="px-5 py-2.5 rounded-md text-sm md:text-base font-bold"
          style={{ background: 'var(--c-hire)', color: '#1a2e1f' }}
        >
          EMAIL ME
        </a>
        <a
          href={profile.links.linkedin}
          target="_blank"
          rel="noreferrer"
          className="px-5 py-2.5 rounded-md text-sm md:text-base font-bold"
          style={{ background: 'var(--c-home)', color: '#0f2a30' }}
        >
          LINKEDIN
        </a>
        <button
          onClick={downloadResume}
          className="px-5 py-2.5 rounded-md text-sm md:text-base font-bold border-2"
          style={{ borderColor: 'var(--c-resume)', color: 'var(--c-resume)' }}
        >
          CV (PDF)
        </button>
      </div>

      <div className="pt-4 flex flex-col gap-1 text-sm" style={{ color: 'var(--ink-dim)' }}>
        <CopyField value={profile.email} />
        <CopyField value={profile.phone} />
      </div>
    </div>
  )
}
