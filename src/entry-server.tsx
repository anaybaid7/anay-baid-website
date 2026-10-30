import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Rendered once at build time so the page paints before any JavaScript runs.
export function render() {
  return renderToString(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}
