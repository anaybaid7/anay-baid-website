import { useEffect, useRef, useState } from 'react'

const TASKS = {
  pickup: {
    name: 'Package pickup',
    page: { Resident: 'Sam Lee', Room: 'V1 South 305', 'Student #': '20871234', Packages: '2 waiting' },
    fields: ['Resident', 'Room', 'Student #', 'Packages'],
  },
  lockout: {
    name: 'Key lockout',
    page: { Resident: 'Priya Shah', Room: 'MKV 4-112', 'Student #': '20895511', 'Key type': 'Room key' },
    fields: ['Resident', 'Room', 'Student #', 'Key type'],
  },
} as const
type Task = keyof typeof TASKS

// Same log entry two ways: typed in by hand from what's on the page, or
// filled from the page in one click and checked.
export default function StarrezFill() {
  const [task, setTask] = useState<Task>('pickup')
  const [values, setValues] = useState<Record<string, string>>({})
  const [by, setBy] = useState<'' | 'hand' | 'ext'>('')
  const timer = useRef<number | undefined>(undefined)
  const t = TASKS[task]
  const page = t.page as Record<string, string>

  useEffect(() => () => window.clearInterval(timer.current), [])

  const clear = (next: Task = task) => {
    window.clearInterval(timer.current)
    setTask(next)
    setValues({})
    setBy('')
  }
  const fill = () => {
    window.clearInterval(timer.current)
    setValues({ ...page })
    setBy('ext')
  }
  const type = () => {
    window.clearInterval(timer.current)
    setBy('hand')
    const text = t.fields.map((f) => [f, page[f]] as const)
    let fi = 0
    let ci = 0
    const acc: Record<string, string> = {}
    timer.current = window.setInterval(() => {
      if (fi >= text.length) return window.clearInterval(timer.current)
      const [f, v] = text[fi]
      ci++
      acc[f] = v.slice(0, ci)
      setValues({ ...acc })
      if (ci >= v.length) {
        fi++
        ci = 0
      }
    }, 70)
  }

  return (
    <div className="demo starrez">
      <p className="demo-lede">One log entry, by hand and with the extension.</p>
      <p className="demo-tabs">
        {(Object.keys(TASKS) as Task[]).map((k) => (
          <button key={k} type="button" aria-pressed={task === k} onClick={() => clear(k)}>
            {TASKS[k].name}
          </button>
        ))}
      </p>
      <div className="sr-pair">
        <div className="sr-page">
          <p className="sr-title">StarRez record</p>
          <dl>
            {Object.entries(page).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="sr-log">
          <p className="sr-title">{t.name} log</p>
          {t.fields.map((f) => (
            <label key={f} className="sr-field">
              <span>{f}</span>
              <input readOnly value={values[f] ?? ''} />
            </label>
          ))}
        </div>
      </div>
      <p className="demo-actions">
        <button type="button" onClick={type}>Type it by hand</button>
        <button type="button" className="demo-primary" onClick={fill}>Fill from the page</button>
        <button type="button" onClick={() => clear()}>Clear</button>
      </p>
      <p className="demo-out" aria-live="polite">
        {by === 'ext' && `Filled ${t.fields.length} fields in one click, ready to check and save.`}
        {by === 'hand' && `Typing ${t.fields.length} fields from the page, one at a time.`}
      </p>
      <p className="demo-note">Made-up residents and rooms, just to show the idea.</p>
    </div>
  )
}
