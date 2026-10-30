import { useSyncExternalStore } from 'react'

// True when the page arrived prerendered and React is about to hydrate it.
// Read once at startup, before React touches the root.
export const prerendered = typeof document !== 'undefined' && !!document.getElementById('root')?.hasChildNodes()

const noop = () => () => {}

// false while hydrating (and on the server), true once running in the
// browser. Anything that depends on the clock, the URL or the visitor's
// device waits for this, so the first client render matches the HTML.
export const useHydrated = () =>
  useSyncExternalStore(
    noop,
    () => true,
    () => false,
  )
