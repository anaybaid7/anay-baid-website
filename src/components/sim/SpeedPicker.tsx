import { SPEEDS, setSpeed, useSpeed } from './speed'

export function SpeedPicker() {
  const speed = useSpeed()
  return (
    <div className="speed" role="radiogroup" aria-label="Playback speed">
      <span>Speed</span>
      {SPEEDS.map((s) => (
        <button key={s} type="button" role="radio" aria-checked={speed === s} onClick={() => setSpeed(s)}>
          {s}x
        </button>
      ))}
    </div>
  )
}
