import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource-variable/archivo/wdth.css'
import '@fontsource/caveat/latin-600.css'
import '../index.css'
import './event.css'
import EventPage from './EventPage.tsx'
import { ErrorBoundary } from '../components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <EventPage />
    </ErrorBoundary>
  </StrictMode>,
)
