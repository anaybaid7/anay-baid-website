import type { ReactNode } from 'react'

// A plain window frame for the simulations: a title bar, an optional address
// bar for browser windows, and the content.
export function Frame({ title, url, children, className = '' }: {
  title: string
  url?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`frame ${className}`}>
      <div className="frame-bar">
        <span className="frame-dots" aria-hidden="true"><i /><i /><i /></span>
        {url ? <span className="frame-url">{url}</span> : <span className="frame-title">{title}</span>}
      </div>
      <div className="frame-body">{children}</div>
    </div>
  )
}
