// The deck and the presenter window talk over a BroadcastChannel, so either
// one can move the slides and both stay on the same one.

export type DeckMsg =
  | { type: 'state'; at: number; spot: number | null; notes: boolean }
  | { type: 'cmd'; cmd: 'next' | 'prev' | 'advance' }
  | { type: 'goto'; at: number }
  | { type: 'hello' }

export const openChannel = () => (typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('event-deck'))

export const openPresenter = () =>
  window.open(`${location.pathname}?presenter`, 'event-presenter', 'width=1180,height=760')
