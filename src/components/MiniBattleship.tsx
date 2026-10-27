import { useState } from 'react'
import { N, placeFleet } from '../battleship'

// A one-player taste of the real game: the same five vehicles hidden on a
// smaller board. Click a square to fire.
const col = (i: number) => 'ABCDEFGH'[i % N]
const row = (i: number) => Math.floor(i / N) + 1

export default function MiniBattleship() {
  const [ships, setShips] = useState(() => placeFleet())
  const [shots, setShots] = useState<number[]>([])
  const [msg, setMsg] = useState('Pick a square to fire.')

  const hit = (i: number) => ships.some((s) => s.cells.includes(i))
  const sunk = ships.filter((s) => s.cells.every((c) => shots.includes(c)))
  const won = sunk.length === ships.length

  const fire = (i: number) => {
    if (shots.includes(i) || won) return
    const next = [...shots, i]
    setShots(next)
    const ship = ships.find((s) => s.cells.includes(i))
    if (!ship) return setMsg(`${col(i)}${row(i)}, miss.`)
    const down = ship.cells.every((c) => next.includes(c))
    const all = ships.every((s) => s.cells.every((c) => next.includes(c)))
    if (all) return setMsg(`Fleet cleared in ${next.length} shots.`)
    setMsg(down ? `${col(i)}${row(i)}, sank the ${ship.name}.` : `${col(i)}${row(i)}, hit.`)
  }

  const reset = () => {
    setShips(placeFleet())
    setShots([])
    setMsg('New fleet hidden. Pick a square to fire.')
  }

  const hits = shots.filter(hit).length
  return (
    <div className="mini-bs">
      <div className="bs-board" role="grid" aria-label="Board, 8 by 8">
        {Array.from({ length: N * N }, (_, i) => {
          const fired = shots.includes(i)
          const isHit = fired && hit(i)
          const isSunk = isHit && sunk.some((s) => s.cells.includes(i))
          return (
            <button
              key={i}
              type="button"
              className={['bs-cell', fired ? (isHit ? 'hit' : 'miss') : '', isSunk ? 'sunk' : ''].join(' ')}
              aria-label={`${col(i)}${row(i)}${fired ? (isHit ? ', hit' : ', miss') : ''}`}
              disabled={fired || won}
              onClick={() => fire(i)}
            />
          )
        })}
      </div>
      <div className="bs-side">
        <p className="bs-msg" aria-live="polite">{msg}</p>
        <p className="bs-count">{shots.length} {shots.length === 1 ? 'shot' : 'shots'}, {hits} {hits === 1 ? 'hit' : 'hits'}</p>
        <ul className="bs-fleet">
          {ships.map((s) => (
            <li key={s.name} className={sunk.includes(s) ? 'down' : ''}>
              {s.name} <span>{s.cells.length}</span>
            </li>
          ))}
        </ul>
        <button type="button" className="bs-new" onClick={reset}>New fleet</button>
        <p className="metrics-note">
          The real game is two players over Socket.IO, with board sizes from 6x6 to 15x15.
        </p>
      </div>
    </div>
  )
}
