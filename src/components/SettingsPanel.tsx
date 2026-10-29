import { useState } from 'react'
import {
  DEFAULTS,
  HIDEABLE,
  linkWithSettings,
  OPTIONS,
  PRESETS,
  resetSettings,
  sameSettings,
  setSettings,
  useSettings,
  type Hideable,
  type Settings,
} from '../settings'

type Choice = keyof typeof OPTIONS

const LABELS: { [K in Choice]: [string, Record<(typeof OPTIONS)[K][number], string>] } = {
  theme: ['Theme', { system: 'Match device', light: 'Light', dark: 'Dark' }],
  accent: ['Accent', { blue: 'Blue', green: 'Green', red: 'Red', ink: 'Ink' }],
  size: ['Text size', { s: 'Smaller', m: 'Default', l: 'Larger' }],
  width: ['Type width', { narrow: 'Narrow', normal: 'Default', wide: 'Wide' }],
  contrast: ['Contrast', { standard: 'Standard', high: 'High' }],
  motion: ['Motion', { full: 'On', reduced: 'Reduced' }],
  view: ['Detail', { full: 'Everything', skim: 'Results only' }],
  lead: ['Lead with', { experience: 'Experience', projects: 'Projects' }],
}

const GROUPS: [string, Choice[]][] = [
  ['Look', ['theme', 'accent', 'size', 'width', 'contrast', 'motion']],
  ['Layout', ['view', 'lead']],
]

const SECTION_NAMES: Record<Hideable, string> = {
  thread: 'What I work on',
  glance: 'At a glance',
  education: 'Education',
  skills: 'Skills',
  github: 'Code',
  colophon: 'About this site',
}

function Choices<K extends Choice>({ k, value }: { k: K; value: Settings[K] }) {
  const [legend, names] = LABELS[k]
  return (
    <fieldset className="choice" data-key={k}>
      <legend>{legend}</legend>
      <div>
        {(OPTIONS[k] as readonly string[]).map((v) => (
          <label key={v} className={value === v ? 'on' : ''}>
            <input
              type="radio"
              name={`setting-${k}`}
              value={v}
              checked={value === v}
              onChange={() => setSettings({ [k]: v } as Partial<Settings>)}
            />
            {k === 'accent' && <i className={`swatch swatch-${v}`} aria-hidden="true" />}
            {k === 'width' && <i className={`width-sample width-${v}`} aria-hidden="true">Aa</i>}
            {(names as Record<string, string>)[v]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// A native popover, so the browser handles opening, closing on Esc or an
// outside click, and putting it on the top layer. Toggled by the header button
// or the "," key.
export default function SettingsPanel() {
  const settings = useSettings()
  const [copied, setCopied] = useState(false)
  const changed = !sameSettings(settings, DEFAULTS)

  const copyLink = () => {
    navigator.clipboard?.writeText(linkWithSettings()).then(
      () => {
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      },
      () => {},
    )
  }
  const toggle = (h: Hideable) =>
    setSettings({ hide: settings.hide.includes(h) ? settings.hide.filter((x) => x !== h) : [...settings.hide, h] })

  return (
    <div id="settings" className="settings" popover="auto" aria-label="Page settings">
      <p className="settings-title">Settings</p>

      <div className="presets">
        {PRESETS.map((p) => (
          <button key={p.name} type="button" onClick={() => setSettings(p.settings)}>
            {p.name}
          </button>
        ))}
      </div>

      {GROUPS.map(([group, keys]) => (
        <section key={group} className="settings-group" aria-label={group}>
          <h3>{group}</h3>
          {keys.map((k) => (
            <Choices key={k} k={k} value={settings[k]} />
          ))}
        </section>
      ))}

      <section className="settings-group" aria-label="Sections">
        <h3>Sections</h3>
        <fieldset className="choice">
          <legend>Show</legend>
          <div>
            {HIDEABLE.map((h) => {
              const shown = !settings.hide.includes(h)
              return (
                <label key={h} className={shown ? 'on' : ''}>
                  <input type="checkbox" checked={shown} onChange={() => toggle(h)} />
                  {SECTION_NAMES[h]}
                </label>
              )
            })}
          </div>
        </fieldset>
      </section>

      <p className="settings-actions">
        <button type="button" onClick={copyLink}>{copied ? 'Link copied' : 'Copy a link to this view'}</button>
        <button type="button" onClick={() => window.print()}>Print this view</button>
        {changed && <button type="button" onClick={resetSettings}>Reset</button>}
      </p>
      <p className="settings-note">Saved in this browser. Press , to open and close.</p>
    </div>
  )
}
