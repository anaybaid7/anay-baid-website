import { useEffect, useMemo, useRef, useState } from 'react'
import type { GeoJSONSource, Map as MapLibre, Marker, StyleSpecification } from 'maplibre-gl'
import { km, route, type Policy, type Terminal } from './allocate'
import { calm, resolvedTheme, useSettings } from '../../settings'

// Four terminals in real cities with made-up volumes and capacities.
const START: Terminal[] = [
  { name: 'Toronto', share: 35, capacity: 3600, at: [-79.38, 43.65] },
  { name: 'Montréal', share: 30, capacity: 3200, at: [-73.57, 45.5] },
  { name: 'Calgary', share: 20, capacity: 2600, at: [-114.07, 51.05] },
  { name: 'Vancouver', share: 15, capacity: 1200, at: [-123.12, 49.28] },
]
const POLICIES: { id: Policy; label: string }[] = [
  { id: 'share', label: 'Spill by share' },
  { id: 'nearest', label: 'Nearest with room' },
]
const fmt = (n: number) => n.toLocaleString('en-CA')
const STYLE = (dark: boolean) => `https://tiles.openfreemap.org/styles/${dark ? 'dark' : 'positron'}`

// a bent line between two cities, so moves both ways don't sit on top of each other
function arc(a: [number, number], b: [number, number], steps = 32): [number, number][] {
  const [mx, my] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]]
  const c: [number, number] = [mx - dy * 0.18, my + dx * 0.18]
  return Array.from({ length: steps + 1 }, (_, i) => {
    const t = i / steps
    return [(1 - t) ** 2 * a[0] + 2 * (1 - t) * t * c[0] + t ** 2 * b[0], (1 - t) ** 2 * a[1] + 2 * (1 - t) * t * c[1] + t ** 2 * b[1]]
  })
}

// When the tile server can't be reached the map still draws, on land shapes
// bundled with the site.
async function offlineStyle(dark: boolean): Promise<StyleSpecification> {
  const [{ feature }, world] = await Promise.all([import('topojson-client'), import('world-atlas/countries-110m.json')])
  const topo = (world as { default?: unknown }).default ?? world
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const land = feature(topo as any, (topo as any).objects.countries) as unknown as GeoJSON.FeatureCollection
  return {
    version: 8,
    sources: { land: { type: 'geojson', data: land } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': dark ? '#0d1626' : '#eef2f8' } },
      { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': dark ? '#1b2638' : '#ffffff', 'fill-outline-color': dark ? '#33435c' : '#c9d3e3' } },
    ],
  }
}

async function pickStyle(dark: boolean): Promise<string | StyleSpecification> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const r = await fetch(STYLE(dark), { signal: ctrl.signal })
    clearTimeout(t)
    if (r.ok) return STYLE(dark)
  } catch {
    // fall through to the bundled shapes
  }
  return offlineStyle(dark)
}

// The allocation from the planning tools, on a map. Each terminal takes its
// share up to capacity, and whatever doesn't fit moves to a terminal with
// room. Compare spilling by share with sending overflow to the nearest
// terminal, and see what each costs in parcel-kilometres.
export default function NetworkMap() {
  const settings = useSettings()
  const dark = resolvedTheme(settings) === 'dark'
  const still = calm(settings)
  const box = useRef<HTMLDivElement>(null)
  const map = useRef<MapLibre | null>(null)
  const markers = useRef<Marker[]>([])
  const [ready, setReady] = useState(false)
  const [offline, setOffline] = useState(false)
  const [volume, setVolume] = useState(10000)
  const [sites, setSites] = useState(START)
  const [policy, setPolicy] = useState<Policy>('share')
  const result = useMemo(() => route(volume, sites, policy), [volume, sites, policy])
  const other = useMemo(() => route(volume, sites, policy === 'share' ? 'nearest' : 'share'), [volume, sites, policy])

  // build the map once per theme
  useEffect(() => {
    const el = box.current
    if (!el) return
    let dead = false
    let frame = 0
    ;(async () => {
      const [maplibregl, worker, style] = await Promise.all([import('maplibre-gl'), import('maplibre-gl/dist/maplibre-gl-worker.mjs?url'), pickStyle(dark)])
      // the bundled library can't find its worker next to itself, so point it there
      maplibregl.setWorkerUrl(worker.default)
      await import('maplibre-gl/dist/maplibre-gl.css')
      if (dead) return
      setOffline(typeof style !== 'string')
      const m = new maplibregl.Map({
        container: el,
        style,
        bounds: [
          [-128, 41],
          [-66, 56],
        ],
        fitBoundsOptions: { padding: 24 },
        attributionControl: { compact: true },
        cooperativeGestures: true,
        dragRotate: false,
        pitchWithRotate: false,
      })
      m.touchZoomRotate.disableRotation()
      map.current = m
      m.on('load', () => {
        if (dead) return
        const ink = getComputedStyle(document.documentElement)
        const cobalt = ink.getPropertyValue('--cobalt').trim() || '#2255ff'
        const bad = ink.getPropertyValue('--bad').trim() || '#d33'
        m.addSource('moves', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        m.addSource('sites', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        m.addLayer({ id: 'moves-base', type: 'line', source: 'moves', layout: { 'line-cap': 'round' }, paint: { 'line-color': cobalt, 'line-opacity': 0.25, 'line-width': ['interpolate', ['linear'], ['get', 'amount'], 0, 2, 800, 9] } })
        m.addLayer({ id: 'moves', type: 'line', source: 'moves', paint: { 'line-color': cobalt, 'line-width': ['interpolate', ['linear'], ['get', 'amount'], 0, 2, 800, 9], 'line-dasharray': [0, 4, 3] } })
        m.addLayer({ id: 'cap', type: 'circle', source: 'sites', paint: { 'circle-radius': ['*', 0.42, ['sqrt', ['get', 'capacity']]], 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-width': 1.5, 'circle-stroke-color': ['case', ['get', 'capped'], bad, cobalt] } })
        m.addLayer({ id: 'placed', type: 'circle', source: 'sites', paint: { 'circle-radius': ['*', 0.42, ['sqrt', ['get', 'placed']]], 'circle-color': ['case', ['get', 'capped'], bad, cobalt], 'circle-opacity': 0.35 } })
        setReady(true)

        // the dashes walk from the full terminal to the one taking its parcels
        if (!still) {
          const steps = [[0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0], [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5]]
          let i = 0
          let last = 0
          const tick = (now: number) => {
            if (now - last > 70) {
              last = now
              i = (i + 1) % steps.length
              if (m.getLayer('moves')) m.setPaintProperty('moves', 'line-dasharray', steps[i])
            }
            frame = requestAnimationFrame(tick)
          }
          frame = requestAnimationFrame(tick)
        }
      })
    })()
    return () => {
      dead = true
      cancelAnimationFrame(frame)
      markers.current.forEach((x) => x.remove())
      markers.current = []
      map.current?.remove()
      map.current = null
      setReady(false)
    }
  }, [dark, still])

  // push the current result into the map
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    ;(m.getSource('sites') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: sites.map((s, i) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: s.at }, properties: { capacity: s.capacity, placed: result.placed[i], capped: result.capped[i] } })),
    })
    ;(m.getSource('moves') as GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: result.moves.map((mv) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: arc(sites[mv.from].at, sites[mv.to].at) }, properties: { amount: mv.amount } })),
    })
    // city labels as plain HTML, so they work without the tile server's fonts
    import('maplibre-gl').then((maplibregl) => {
      markers.current.forEach((x) => x.remove())
      markers.current = sites.map((s, i) => {
        const tag = document.createElement('div')
        tag.className = `nm-tag${result.capped[i] ? ' full' : ''}`
        tag.innerHTML = `<b>${s.name}</b><span>${fmt(result.placed[i])} / ${fmt(s.capacity)}</span>`
        return new maplibregl.Marker({ element: tag, anchor: 'left', offset: [14, 0] }).setLngLat(s.at).addTo(m)
      })
    })
  }, [ready, result, sites])

  const saved = other.parcelKm - result.parcelKm
  return (
    <div className="demo nmap">
      <p className="demo-hint">Shrink Vancouver or Toronto and watch where the overflow goes.</p>
      <div className="demo-tabs" role="group" aria-label="Overflow rule">
        {POLICIES.map((p) => (
          <button key={p.id} type="button" aria-pressed={policy === p.id} onClick={() => setPolicy(p.id)}>
            {p.label}
          </button>
        ))}
      </div>

      <div className="nm-map" ref={box}>
        {!ready && <p className="nm-wait">Loading the map</p>}
      </div>
      <p className="sr-only" aria-live="polite">
        {result.moves.map((mv) => `${fmt(mv.amount)} parcels move from ${sites[mv.from].name} to ${sites[mv.to].name}`).join('. ') || 'Nothing moves.'}
      </p>
      {offline && <p className="demo-note">The tile server didn’t answer, so this is drawn on the country shapes bundled with the site</p>}

      <div className="nm-grid">
        <div>
          <label className="demo-field">
            <span>
              Weekly volume <b>{fmt(volume)}</b>
            </span>
            <input type="range" min={4000} max={14000} step={250} value={volume} onChange={(e) => setVolume(+e.target.value)} />
          </label>
          {sites.map((s, i) => (
            <label key={s.name} className="demo-field small">
              <span>
                {s.name} capacity {fmt(s.capacity)}
              </span>
              <input
                type="range"
                min={500}
                max={5000}
                step={100}
                value={s.capacity}
                aria-label={`${s.name} capacity`}
                onChange={(e) => setSites(sites.map((x, j) => (j === i ? { ...x, capacity: +e.target.value } : x)))}
              />
            </label>
          ))}
        </div>
        <div>
          <dl className="br-stats">
            <div>
              <dt>Parcels moved</dt>
              <dd>{fmt(result.moves.reduce((s, m) => s + m.amount, 0))}</dd>
            </div>
            <div>
              <dt>Parcel‑km</dt>
              <dd>{fmt(Math.round(result.parcelKm / 1000))}k</dd>
            </div>
          </dl>
          <ul className="cb-routes">
            {result.moves.length === 0 && <li>Every terminal fits its own share</li>}
            {result.moves.map((mv) => (
              <li key={`${mv.from}-${mv.to}`}>
                <b>{fmt(mv.amount)}</b> <span>{sites[mv.from].name} to {sites[mv.to].name}, {fmt(Math.round(km(sites[mv.from].at, sites[mv.to].at)))} km</span>
              </li>
            ))}
          </ul>
          <p className={result.short ? 'demo-out warn' : 'demo-out'} aria-live="polite">
            {result.short
              ? `${fmt(result.short)} parcels don't fit anywhere, every terminal is full`
              : saved > 0
                ? `${fmt(Math.round(saved / 1000))}k fewer parcel‑km than the other rule`
                : saved < 0
                  ? `The other rule moves the same parcels ${fmt(Math.round(-saved / 1000))}k parcel‑km less`
                  : 'Both rules move the same parcels the same distance here'}
          </p>
        </div>
      </div>
    </div>
  )
}
