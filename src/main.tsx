import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

const app = (
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
)

// the production build ships the page prerendered, so hydrate it; in dev
// the root is empty and React renders from scratch
const root = document.getElementById('root')!
if (root.hasChildNodes()) hydrateRoot(root, app, { onRecoverableError: (e) => console.warn('hydration', e) })
else createRoot(root).render(app)
