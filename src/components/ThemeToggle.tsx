import { useState } from 'react'

type Theme = 'light' | 'dark'

const current = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light')

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(current)
  const flip = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark'
    document.documentElement.dataset.theme = next
    try {
      localStorage.setItem('theme', next)
    } catch {
      // private browsing, the choice just won't stick
    }
    setTheme(next)
  }
  return (
    <button type="button" className="theme" onClick={flip} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M10 2 a8 8 0 0 1 0 16 z" fill="currentColor" />
      </svg>
      {theme === 'dark' ? 'Light' : 'Dark'}
    </button>
  )
}
