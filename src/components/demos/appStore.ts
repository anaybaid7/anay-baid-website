// The routing project in miniature: a route table matched against the URL,
// and a Redux-style reducer that the router, the socket and the form all
// dispatch into.

export interface Event_ {
  id: number
  title: string
  seats: number
}

export interface AppState {
  events: Event_[]
  lastAction: string
}

export type Action =
  | { type: 'events/updated'; payload: { id: number; seats: number } }
  | { type: 'events/added'; payload: Event_ }

export const initial: AppState = {
  events: [
    { id: 41, title: 'Systems design night', seats: 18 },
    { id: 42, title: 'Hack day', seats: 40 },
  ],
  lastAction: '@@init',
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'events/updated':
      return {
        lastAction: action.type,
        events: state.events.map((e) => (e.id === action.payload.id ? { ...e, seats: action.payload.seats } : e)),
      }
    case 'events/added':
      return { lastAction: action.type, events: [...state.events, action.payload] }
  }
}

export const ROUTES = ['/', '/events', '/events/:id', '/events/new'] as const

// routes without params are tried first, so /events/new is never read as an id
export function matchRoute(path: string): { route: string; params: Record<string, string> } | null {
  const ordered = [...ROUTES].sort((a, b) => Number(a.includes(':')) - Number(b.includes(':')))
  for (const route of ordered) {
    const want = route.split('/')
    const got = path.split('/')
    if (want.length !== got.length) continue
    const params: Record<string, string> = {}
    if (want.every((w, i) => (w.startsWith(':') ? ((params[w.slice(1)] = got[i]), true) : w === got[i]))) return { route, params }
  }
  return null
}

export function validateEvent(f: { title: string; email: string; seats: string }) {
  const errors: Record<string, string> = {}
  if (!f.title.trim()) errors.title = 'Title is required'
  if (!/^\S+@\S+\.\S+$/.test(f.email)) errors.email = 'Enter a valid email'
  if (!(Number(f.seats) > 0)) errors.seats = 'Seats must be more than 0'
  return errors
}
