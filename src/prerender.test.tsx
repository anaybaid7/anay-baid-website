import { describe, it, expect, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import { act } from 'react'
import { hydrateRoot } from 'react-dom/client'
import App from './App'

// The production build ships the page rendered to HTML, so the server render
// has to work and hydrate without React throwing the markup away.
describe('prerendering', () => {
  it('renders the whole page to HTML and hydrates it without a mismatch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    history.replaceState(null, '', '/')
    const html = renderToString(<App />)
    expect(html).toContain('Featured')
    expect(html).toContain('Software &amp; Network Optimization Engineer')
    const root = document.createElement('div')
    root.innerHTML = html
    document.body.appendChild(root)
    const errors: unknown[] = []
    await act(async () => {
      hydrateRoot(root, <App />, { onRecoverableError: (e) => errors.push(e) })
    })
    expect(errors).toEqual([])
    root.remove()
  })
})
