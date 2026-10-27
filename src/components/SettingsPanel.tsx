import { useState } from 'react'
import { DEFAULTS, linkWithSettings, OPTIONS, resetSettings, setSettings, useSettings, type Settings } from '../settings'

const LABELS: { [K in keyof Settings]: [string, Record<Settings[K], string>] } = {
  theme: ['Theme', { system: 'Match device', light: 'Light', dark: 'Dark' }],
  view: ['Layout', { full: 'Full detail', skim: 'Skim, results only' }],
  size: ['Text size', { s: 'Smaller', m: 'Default', l: 'Larger' }],
  accent: ['Accent', { blue: 'Blue', green: 'Green', red: 'Red', ink: 'Ink' }],
  motion: ['Motion', { full: 'On', reduced: 'Reduced' }],
}

// A native popover, so the browser handles opening, closing on Esc or an
// outside click, and putting it on the top layer. Toggled by the header button
// or the "," key.
export default function SettingsPanel() {
  const settings = useSettings()
  const [copied, setCopied] = useState(false)
  const changed = (Object.keys(DEFAULTS) as (keyof Settings)[]).some((k) => settings[k] !== DEFAULTS[k])

  const copyLink = () => {
    navigator.clipboard?.writeText(linkWithSettings()).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      },
      () => {},
    )
  }

  return (
    <div id="settings" className="settings" popover="auto" aria-label="Page settings">
      <p className="settings-title">Settings</p>
      {(Object.keys(OPTIONS) as (keyof Settings)[]).map((key) => {
        const [legend, names] = LABELS[key]
        return (
          <fieldset key={key} className="choice" data-key={key}>
            <legend>{legend}</legend>
            <div>
              {(OPTIONS[key] as readonly string[]).map((value) => (
                <label key={value} className={settings[key] === value ? 'on' : ''}>
                  <input
                    type="radio"
                    name={`setting-${key}`}
                    value={value}
                    checked={settings[key] === value}
                    onChange={() => setSettings({ [key]: value } as Partial<Settings>)}
                  />
                  {key === 'accent' && <i className={`swatch swatch-${value}`} aria-hidden="true" />}
                  {(names as Record<string, string>)[value]}
                </label>
              ))}
            </div>
          </fieldset>
        )
      })}
      <p className="settings-actions">
        <button type="button" onClick={copyLink}>{copied ? 'Link copied' : 'Copy a link with these settings'}</button>
        {changed && <button type="button" onClick={resetSettings}>Reset</button>}
      </p>
      <p className="settings-note">Saved in this browser. Press , to open and close.</p>
    </div>
  )
}
