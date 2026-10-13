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
        <div role="alert" className="fallback">
          <h1 style={{ fontFamily: 'var(--font)', fontSize: 28, margin: 0 }}>Something broke on this page</h1>
          <p>That's a bug on my end, not something you did. Trying again usually sorts it out.</p>
          <p style={{ display: 'flex', gap: 20, fontFamily: 'var(--font)' }}>
            <button type="button" onClick={this.reset}>Try again</button>
            <button type="button" onClick={() => window.location.reload()}>Reload the page</button>
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
