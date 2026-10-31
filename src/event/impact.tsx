import { useState } from 'react'
import { impact } from './content'

// The why it matters slide: drag the forecast up or down for one terminal's
// day and see what happens to its routes. Mock numbers from content.ts.

const fmt = (n: number) => Math.round(n).toLocaleString('en-CA')

export default function Impact() {
  const { pieces, perRoute, range } = impact
  const [off, setOff] = useState(-8)

  const forecast = pieces * (1 + off / 100)
  const planned = Math.round(forecast / perRoute)
  const needed = Math.ceil(pieces / perRoute)
  const short = Math.max(0, pieces - planned * perRoute)
  const spare = Math.max(0, planned - needed)

  const tiles = Array.from({ length: Math.max(planned, needed) }, (_, i) =>
    i >= planned ? 'missing' : i >= needed ? 'spare' : 'used',
  )

  const verdict =
    short > 0
      ? { tone: 'low', head: `${fmt(short)} parcels wait until tomorrow`, sub: `${needed - planned} routes short` }
      : spare > 0
        ? { tone: 'high', head: `${spare} vans go out with room to spare`, sub: 'paying for routes the day did not need' }
        : { tone: 'ok', head: 'Every parcel goes out on time', sub: 'no routes short and none to spare' }

  return (
    <div className="impact" onClick={(e) => e.stopPropagation()}>
      <div className="impact-read">
        <p>
          <span>Forecast</span>
          <b>{fmt(forecast)}</b>
        </p>
        <p>
          <span>Came in</span>
          <b>{fmt(pieces)}</b>
        </p>
        <p>
          <span>Routes planned</span>
          <b>{planned}</b>
        </p>
      </div>

      <div className="impact-tiles" aria-hidden="true">
        {tiles.map((t, i) => <i key={i} className={t} />)}
      </div>

      <p className={`impact-verdict ${verdict.tone}`} aria-live="polite">
        <b>{verdict.head}</b>
        <span>{verdict.sub}</span>
      </p>

      <label className="impact-slider">
        <span className="impact-off">{off === 0 ? 'Spot on' : `${Math.abs(off)}% too ${off < 0 ? 'low' : 'high'}`}</span>
        <input
          type="range"
          min={-range}
          max={range}
          step={1}
          value={off}
          onChange={(e) => setOff(Number(e.target.value))}
          aria-label="How far off the forecast is"
        />
        <span className="impact-ends">
          <span>Too low</span>
          <button type="button" onClick={() => setOff(0)}>Spot on</button>
          <span>Too high</span>
        </span>
      </label>
      <p className="impact-note">One terminal on one day, about {perRoute} parcels a route, mock numbers</p>
    </div>
  )
}
