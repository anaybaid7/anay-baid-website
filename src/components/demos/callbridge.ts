// The integration a host app does with Iotum's callbridge-js SDK, as a small
// state machine: create the widget, wait for it to load, react to room and
// participant events, and unload it when the page goes away. Event names and
// payload fields are the SDK's own.

export type WidgetEvent =
  | { type: 'widget.LOAD' }
  | { type: 'widget.ERROR'; message: string }
  | { type: 'widget.STORAGE_ACCESS_REQUIRED'; step: 'request' | 'interaction' | 'retry' }
  | { type: 'widget.STORAGE_ACCESS_GRANTED' }
  | { type: 'room.READY' }
  | { type: 'participant.CHANGE'; id: number; name: string; isCurrent: boolean; isMuted: boolean; isLeft: boolean }
  | { type: 'conference.SPEAKER'; speakerId: number }
  | { type: 'conference.CONFERENCE_CALL_EXIT' }
  | { type: 'dashboard.UNREAD_MESSAGES'; rooms: Record<string, number> }

export interface Person {
  id: number
  name: string
  isCurrent: boolean
  isMuted: boolean
}

export interface HostState {
  status: 'idle' | 'loading' | 'needs-access' | 'ready' | 'error' | 'left'
  people: Person[]
  speaker: number | null
  unread: number
  error?: string
}

export const initialHost: HostState = { status: 'idle', people: [], speaker: null, unread: 0 }

// what the host page does with each event the widget sends it
export function onEvent(s: HostState, e: WidgetEvent): HostState {
  switch (e.type) {
    case 'widget.LOAD':
      return { ...s, status: 'loading' }
    case 'widget.ERROR':
      return { ...s, status: 'error', error: e.message }
    case 'widget.STORAGE_ACCESS_REQUIRED':
      // the widget has to be visible and clickable for the user to allow it
      return { ...s, status: 'needs-access' }
    case 'widget.STORAGE_ACCESS_GRANTED':
      return { ...s, status: 'loading' }
    case 'room.READY':
      return { ...s, status: 'ready' }
    case 'participant.CHANGE': {
      const others = s.people.filter((p) => p.id !== e.id)
      if (e.isLeft) return { ...s, people: others, speaker: s.speaker === e.id ? null : s.speaker }
      return { ...s, people: [...others, { id: e.id, name: e.name, isCurrent: e.isCurrent, isMuted: e.isMuted }].sort((a, b) => a.id - b.id) }
    }
    case 'conference.SPEAKER':
      return { ...s, speaker: e.speakerId }
    case 'conference.CONFERENCE_CALL_EXIT':
      return { ...initialHost, status: 'left', unread: s.unread }
    case 'dashboard.UNREAD_MESSAGES':
      return { ...s, unread: Object.values(e.rooms).reduce((a, b) => a + b, 0) }
  }
}
