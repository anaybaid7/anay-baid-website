import { useState } from 'react'
import { cellsAt, FLEET, N, placeFleet, validPlacement, type Placed } from '../../battleship'

const name = (i: number) => `${'ABCDEFGH'[i % N]}${Math.floor(i / N) + 1}`

// Fleet setup: pick a vehicle, hover to preview, click to place, click a
// placed vehicle to rotate it. Lock in sends the fleet to the server check.
export default function Placement({ onLock }: { onLock: (ships: Placed[]) => void }) {
  const [ships, setShips] = useState<Placed[]>([])
  const [pick, setPick] = useState(0)
  const [across, setAcross] = useState(true)
  const [hover, setHover] = useState<number | null>(null)
  const taken = new Set(ships.flatMap((s) => s.cells))
  const next = FLEET.findIndex((f) => !ships.some((s) => s.name === f.name))
  const current = FLEET[ships.some((s) => s.name === FLEET[pick].name) ? Math.max(next, 0) : pick]
  const preview = hover !== null && next >= 0 ? cellsAt(hover, current.size, across) : null
  const fits = !!preview && preview.every((c) => !taken.has(c))

  const place = (cell: number) => {
    const own = ships.find((s) => s.cells.includes(cell))
    if (own) {
      // rotate around its first cell, if the turned vehicle fits
      const others = new Set(ships.filter((s) => s !== own).flatMap((s) => s.cells))
      const wasAcross = own.cells[1] - own.cells[0] === 1
      const turned = cellsAt(own.cells[0], own.cells.length, !wasAcross)
      if (turned && turned.every((c) => !others.has(c))) setShips(ships.map((s) => (s === own ? { ...s, cells: turned } : s)))
      return
    }
    if (!preview || !fits) return
    const placed = [...ships, { name: current.name, cells: preview }]
    setShips(placed)
    const after = FLEET.findIndex((f) => !placed.some((s) => s.name === f.name))
    if (after >= 0) setPick(after)
  }

  const error = ships.length === FLEET.length ? validPlacement(ships) : null

  return (
    <div className="place">
      <div className="place-grid">
        <div
          className="bs-board placing"
          role="group"
          aria-label="Your territory"
          onMouseLeave={() => setHover(null)}
          onKeyDown={(e) => (e.key === 'r' || e.key === 'R') && setAcross(!across)}
        >
          {Array.from({ length: N * N }, (_, i) => {
            const ship = ships.find((s) => s.cells.includes(i))
            const pv = preview?.includes(i)
            return (
              <button
                key={i}
                type="button"
                className={['bs-cell', ship ? 'ship' : '', pv ? (fits ? 'pv' : 'pv bad') : ''].join(' ')}
                aria-label={`${name(i)}${ship ? `, ${ship.name}, click to rotate` : ''}`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onClick={() => place(i)}
              />
            )
          })}
        </div>
        <div>
          <p className="demo-h">Manifest, {ships.length} of {FLEET.length}</p>
          <ul className="manifest">
            {FLEET.map((f, i) => {
              const done = ships.some((s) => s.name === f.name)
              return (
                <li key={f.name}>
                  <button type="button" aria-pressed={!done && current.name === f.name} disabled={done} onClick={() => setPick(i)}>
                    <span className="mf-cells">{Array.from({ length: f.size }, (_, j) => <i key={j} />)}</span>
                    {f.name}
                  </button>
                  {done && (
                    <button type="button" className="mf-x" aria-label={`Remove ${f.name}`} onClick={() => setShips(ships.filter((s) => s.name !== f.name))}>
                      ×
                    </button>
                  )}
                </li>
              )
            })}
          </ul>
          <div className="demo-actions">
            <button type="button" onClick={() => setAcross(!across)}>{across ? 'Across' : 'Down'} (R)</button>
            <button type="button" onClick={() => setShips(placeFleet())}>Random</button>
            <button type="button" onClick={() => setShips([])} disabled={!ships.length}>Clear</button>
            <button type="button" className="demo-primary" disabled={ships.length !== FLEET.length || !!error} onClick={() => onLock(ships)}>
              Lock in routes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
