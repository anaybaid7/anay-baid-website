import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
}

// React only recovers from a render error when something above the crash
// point catches it; without this, one bad render anywhere in the tree (a
// null-check that turns out not to hold, a bug in a new feature) takes down
// the entire page to a blank white screen with nothing in the DOM at all.
// This has to be a class component: catching render errors is one of the
// few things in React with no hook equivalent, `getDerivedStateFromError`
// and `componentDidCatch` only exist on the class API.
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // A real deployment would forward this to an error-tracking service.
    // Logging it is what keeps this an honest fallback instead of a silent
    // one: the failure is still visible to whoever's watching the console.
    console.error('Uncaught render error:', error, info.componentStack)
  }

  private reset = () => {
    this.setState({ error: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="font-main flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center"
          style={{ background: 'var(--desk)', color: 'var(--ink)' }}
        >
          <div
            className="max-w-md rounded border-2 p-6"
            style={{ borderColor: 'var(--c-resume)', background: 'var(--screen-bg)' }}
          >
            <p className="mb-2 text-lg font-bold" style={{ color: 'var(--c-resume)' }}>
              SIGNAL LOST
            </p>
            <p className="mb-4 text-sm" style={{ color: 'var(--ink-dim)' }}>
              Something broke rendering this part of the page. This is a bug worth reporting, not
              something you did.
            </p>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={this.reset}
                className="cursor-pointer rounded border px-4 py-2 text-sm font-bold"
                style={{ borderColor: 'var(--c-home)', color: 'var(--c-home)' }}
              >
                TRY AGAIN
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="cursor-pointer rounded border px-4 py-2 text-sm font-bold"
                style={{ borderColor: 'var(--ink-dim)', color: 'var(--ink-dim)' }}
              >
                RELOAD
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
