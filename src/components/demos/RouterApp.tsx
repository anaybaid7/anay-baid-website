import { useEffect, useReducer, useState, type FormEvent } from 'react'
import { initial, matchRoute, reducer, validateEvent, type Action } from './appStore'
import { Frame } from '../sim/Frame'
import { Log, type LogLine } from '../sim/Log'
import { getSpeed } from '../sim/speed'
import { calm } from '../sim/useSequence'

const NAV = [
  ['/', 'Home'],
  ['/events', 'Events'],
  ['/events/new', 'New event'],
] as const

// The routing project in a small browser. Links change the URL without a
// page load, a live socket dispatches updates into the store, and the form
// validates as you type before anything is dispatched.
export default function RouterApp() {
  const [stack, setStack] = useState<string[]>(['/'])
  const [at, setAt] = useState(0)
  const [store, dispatchRaw] = useReducer(reducer, initial)
  const [actions, setActions] = useState<LogLine[]>([{ src: 'store', text: '@@init' }])
  const [live, setLive] = useState(false)
  const [form, setForm] = useState({ title: '', email: '', seats: '' })
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const path = stack[at]
  const match = matchRoute(path)

  const dispatch = (a: Action) => {
    dispatchRaw(a)
    setActions((x) => [...x, { src: 'action', text: `${a.type}  ${JSON.stringify(a.payload)}` }].slice(-30))
  }
  const go = (to: string) => {
    if (to === path) return
    setStack([...stack.slice(0, at + 1), to])
    setAt(at + 1)
    setActions((x) => [...x, { src: 'router', text: `pushState ${to}, matched ${matchRoute(to)?.route ?? 'no route'}`, tone: 'info' as const }].slice(-30))
  }

  useEffect(() => {
    if (!live) return
    const t = window.setInterval(() => {
      const e = store.events[Math.floor(Math.random() * store.events.length)]
      setActions((x) => [...x, { src: 'socket', text: `message  { id: ${e.id}, seats: ${Math.max(0, e.seats - 1)} }`, tone: 'ok' as const }].slice(-30))
      dispatch({ type: 'events/updated', payload: { id: e.id, seats: Math.max(0, e.seats - 1) } })
    }, calm() ? 2500 : 1600 / getSpeed())
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, store.events])

  const errors = validateEvent(form)
  const submit = (e: FormEvent) => {
    e.preventDefault()
    setTouched({ title: true, email: true, seats: true })
    if (Object.keys(errors).length) return
    const id = Math.max(...store.events.map((x) => x.id)) + 1
    dispatch({ type: 'events/added', payload: { id, title: form.title.trim(), seats: Number(form.seats) } })
    setForm({ title: '', email: '', seats: '' })
    setTouched({})
    go(`/events/${id}`)
  }

  const field = (k: keyof typeof form, label: string, type = 'text') => (
    <label className="rf-field">
      <span>{label}</span>
      <input
        type={type}
        value={form[k]}
        aria-invalid={Boolean(touched[k] && errors[k])}
        onChange={(e) => {
          setForm({ ...form, [k]: e.target.value })
          setTouched({ ...touched, [k]: true })
        }}
      />
      {touched[k] && errors[k] && <small>{errors[k]}</small>}
    </label>
  )

  const view = () => {
    if (!match) return <p>404, no route for {path}</p>
    if (match.route === '/') return <p>Pick a page above. The address bar changes, the page never reloads.</p>
    if (match.route === '/events')
      return (
        <ul className="rf-list">
          {store.events.map((e) => (
            <li key={e.id}>
              <button type="button" onClick={() => go(`/events/${e.id}`)}>{e.title}</button>
              <span>{e.seats} seats left</span>
            </li>
          ))}
        </ul>
      )
    if (match.route === '/events/new')
      return (
        <form className="rf-form" onSubmit={submit} noValidate>
          {field('title', 'Title')}
          {field('email', 'Organizer email', 'email')}
          {field('seats', 'Seats', 'number')}
          <button type="submit" className="demo-primary">Create event</button>
        </form>
      )
    const ev = store.events.find((x) => String(x.id) === match.params.id)
    return ev ? (
      <div className="rf-event">
        <h4>{ev.title}</h4>
        <p><b>{ev.seats}</b> seats left{live && ', updating live'}</p>
      </div>
    ) : (
      <p>No event {match.params.id}</p>
    )
  }

  return (
    <div className="demo router">
      <p className="demo-lede">
        A small single page app. Move between pages, turn on live updates, or create an event, and watch the router and the
        store on the right.
      </p>
      <div className="router-grid">
        <Frame title="App" url={`app.local${path}`} className="rf-app">
          <nav className="rf-nav">
            <button type="button" aria-label="Back" onClick={() => setAt(at - 1)} disabled={at === 0}>←</button>
            <button type="button" aria-label="Forward" onClick={() => setAt(at + 1)} disabled={at >= stack.length - 1}>→</button>
            {NAV.map(([to, label]) => (
              <button key={to} type="button" aria-current={path === to ? 'page' : undefined} onClick={() => go(to)}>{label}</button>
            ))}
          </nav>
          <div className="rf-view">{view()}</div>
          <p className="rf-foot">Page loads 1, route <code>{match?.route ?? 'none'}</code></p>
        </Frame>
        <div className="router-side">
          <label className="demo-check">
            <input type="checkbox" checked={live} onChange={(e) => setLive(e.target.checked)} /> Live updates over WebSocket
          </label>
          <figure className="store">
            <figcaption>Redux store</figcaption>
            <pre tabIndex={0} aria-label="Store state">{JSON.stringify({ events: store.events, lastAction: store.lastAction }, null, 2)}</pre>
          </figure>
          <Log title="Router, socket and actions" lines={actions} />
        </div>
      </div>
    </div>
  )
}
