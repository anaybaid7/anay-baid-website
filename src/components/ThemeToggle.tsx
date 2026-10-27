import { resolvedTheme, setSettings, useSettings } from '../settings'

export default function ThemeToggle() {
  const settings = useSettings()
  const theme = resolvedTheme(settings)
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button type="button" className="theme" onClick={() => setSettings({ theme: next })} title={`Switch to ${next} mode (T)`}>
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 2 a8 8 0 0 1 0 16 z" fill="currentColor" />
      </svg>
      <span className="theme-label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
