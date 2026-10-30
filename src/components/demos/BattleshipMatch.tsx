import { useRef, useState } from 'react'
import { N, botShot, placeFleet, validPlacement, type Placed } from '../../battleship'
import Placement from './Placement'
import { Log, type LogLine } from '../sim/Log'
import { useSequence } from '../sim/useSequence'

const name = (i: number) => `${'ABCDEFGH'[i % N]}${Math.floor(i / N) + 1}`
type Ships = ReturnType<typeof placeFleet>
const ROOM = 'K7QX2'
const OPENING: LogLine[] = [{ src: 'server', text: `both_connected { room: "${ROOM}", boardDim: 8 }` }]
const locked = (ships: Placed[]): LogLine[] => {
  const err = validPlacement(ships)
  return [
    { src: 'you', text: `emit place_ships { ships: [${ships.map((s) => s.cells.length).join(', ')}] }` },
    err
      ? { src: 'server', text: `rejected, ${err}`, tone: 'err' }
      : { src: 'server', text: 'isValidPlacement: count, bounds, overlap ok → placement_confirmed', tone: 'ok' },
    { src: 'bot', text: 'emit place_ships, placement_confirmed' },
    { src: 'server', text: 'game_start { turn: "you" }, coin flip went your way', tone: 'ok' },
  ]
}

function result(ships: Ships, shots: number[], cell: number) {
  const ship = ships.find((s) => s.cells.includes(cell))
  const sunk = ship && ship.cells.every((c) => shots.includes(c)) ? ship.name : null
  const over = ships.every((s) => s.cells.every((c) => shots.includes(c)))
  return { hit: Boolean(ship), sunk, over }
}

// A full round against a bot, with the Socket.IO traffic the real game sends
// for every move. The server owns the turn, so firing out of turn is refused.
export default function BattleshipMatch() {
  const [mine, setMine] = useState(() => placeFleet())
  const [theirs, setTheirs] = useState(() => placeFleet())
  const [myShots, setMyShots] = useState<number[]>([])
  const [botShots, setBotShots] = useState<number[]>([])
  const [turn, setTurn] = useState<'you' | 'bot' | 'over'>('you')
  const [online, setOnline] = useState(true)
  const [log, setLog] = useState<LogLine[]>(OPENING)
  const [phase, setPhase] = useState<'place' | 'battle'>('place')
  const [msg, setMsg] = useState('Your turn. Fire at the right board.')
  const bot = useRef<number[]>([])
  const seq = useSequence()
  const say = (...l: LogLine[]) => setLog((x) => [...x, ...l].slice(-40))

  const botTurn = (shots: number[]) => {
    const unsunkHits = shots.filter((c) => {
      const s = mine.find((x) => x.cells.includes(c))
      return s && !s.cells.every((k) => shots.includes(k))
    })
    const cell = botShot(shots, unsunkHits)
    const next = [...shots, cell]
    bot.current = next
    const r = result(mine, next, cell)
    seq.run(
      [
        () => say({ src: 'bot', text: `emit fire { index: ${cell} }  (${name(cell)})` }),
        () => {
          setBotShots(next)
          say({
            src: 'server',
            text: `shot_result { index: ${cell}, result: "${r.hit ? 'hit' : 'miss'}"${r.sunk ? `, sunk: "${r.sunk}"` : ''}, nextTurn: "you" }`,
            tone: r.hit ? 'warn' : undefined,
          })
          if (r.over) {
            setTurn('over')
            setMsg('The bot cleared your fleet. New game?')
            say({ src: 'server', text: 'game_over { winner: "bot" }', tone: 'err' })
          } else {
            setTurn('you')
            setMsg(r.sunk ? `The bot sank your ${r.sunk}. Your turn.` : 'Your turn.')
          }
        },
      ],
      550,
    )
  }

  const fire = (cell: number) => {
    if (!online || turn === 'over' || myShots.includes(cell)) return
    if (turn !== 'you') {
      say(
        { src: 'you', text: `emit fire { index: ${cell} }  (${name(cell)})` },
        { src: 'server', text: 'dropped, room.turn is not your socket', tone: 'err' },
      )
      return
    }
    const next = [...myShots, cell]
    const r = result(theirs, next, cell)
    setMyShots(next)
    say(
      { src: 'you', text: `emit fire { index: ${cell} }  (${name(cell)})` },
      {
        src: 'server',
        text: `shot_result { index: ${cell}, result: "${r.hit ? 'hit' : 'miss'}"${r.sunk ? `, sunk: "${r.sunk}"` : ''}, nextTurn: "bot" }`,
        tone: r.hit ? 'ok' : undefined,
      },
    )
    if (r.over) {
      setTurn('over')
      setMsg(`You cleared the fleet in ${next.length} shots.`)
      say({ src: 'server', text: 'game_over { winner: "you" }', tone: 'ok' })
      return
    }
    setMsg(r.sunk ? `${name(cell)}, you sank the ${r.sunk}.` : `${name(cell)}, ${r.hit ? 'hit' : 'miss'}. Bot’s turn.`)
    setTurn('bot')
    botTurn(botShots)
  }

  const drop = () => {
    setOnline(false)
    say({ src: 'server', text: 'disconnect, opponent_left sent to the bot, room held for 8 s', tone: 'warn' })
    seq.run(
      [
        () => {},
        () => {
          setOnline(true)
          say(
            { src: 'you', text: 'reconnected inside the grace window' },
            { src: 'server', text: `room ${ROOM} kept, the game carries on`, tone: 'ok' },
          )
        },
      ],
      1100,
    )
  }

  const reset = () => {
    seq.stop()
    setMine(placeFleet())
    setTheirs(placeFleet())
    setMyShots([])
    setBotShots([])
    bot.current = []
    setTurn('you')
    setOnline(true)
    setLog(OPENING)
    setPhase('place')
    setMsg('Your turn. Fire at the right board.')
  }

  const board = (ships: Ships, shots: number[], own: boolean) => (
    <div className={`bs-board ${own ? 'own' : ''}`} role="group" aria-label={own ? 'Your fleet' : 'Bot’s waters'}>
      {Array.from({ length: N * N }, (_, i) => {
        const fired = shots.includes(i)
        const ship = ships.find((s) => s.cells.includes(i))
        const sunk = ship && ship.cells.every((c) => shots.includes(c))
        const cls = [
          'bs-cell',
          fired ? (ship ? 'hit' : 'miss') : '',
          sunk ? 'sunk' : '',
          own && ship && !fired ? 'ship' : '',
        ].join(' ')
        return own ? (
          <span
            key={i}
            className={cls}
            role="img"
            aria-label={`${name(i)}${ship ? ', your ship' : ''}${fired ? (ship ? ', hit' : ', miss') : ''}`}
          />
        ) : (
          <button
            key={i}
            type="button"
            className={cls}
            aria-label={`${name(i)}${fired ? (ship ? ', hit' : ', miss') : ''}`}
            disabled={fired || turn === 'over' || !online}
            onClick={() => fire(i)}
          />
        )
      })}
    </div>
  )

  const left = theirs.filter((s) => !s.cells.every((c) => myShots.includes(c))).length

  return (
    <div className="demo match">
      <ol className="phases" aria-label="Stage">
        <li className={phase === 'place' ? 'on' : 'done'}>Fleet setup</li>
        <li className={phase === 'battle' ? 'on' : ''}>Battle</li>
      </ol>
      {phase === 'place' ? (
        <>
          <p className="demo-hint">Pick a vehicle, click to place, click again to rotate.</p>
          <Placement
            onLock={(ships) => {
              setMine(ships)
              setLog((l) => [...l, ...locked(ships)])
              setPhase('battle')
            }}
          />
          <Log title="Socket.IO events" lines={log} />
        </>
      ) : (
        <>
          <p className="demo-hint">Fire at the right board.</p>
          <div className="match-boards">
            <figure>
              <figcaption>Your fleet</figcaption>
              {board(mine, botShots, true)}
            </figure>
            <figure>
              <figcaption>Bot’s waters, {left} of 5 left</figcaption>
              {board(theirs, myShots, false)}
            </figure>
          </div>
          <p className="bs-msg" aria-live="polite">
            {!online ? 'Reconnecting…' : msg}
          </p>
          <div className="demo-actions">
            <button type="button" onClick={drop} disabled={!online || turn !== 'you'}>
              Drop my connection
            </button>
            <button type="button" onClick={reset}>
              New game
            </button>
          </div>
          <Log title="Socket.IO events" lines={log} />
        </>
      )}
    </div>
  )
}
