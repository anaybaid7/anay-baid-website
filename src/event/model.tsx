import type { Stage } from './content'

// How the model learns: one terminal's weekly pieces, cleaned, then split into
// the parts the model learns (yearly shape, trend, holidays and the big
// client) and put back together to forecast. Every number here is mock data,
// made up below so the parts add up the same way they do in the real model.

const HIST = 52 * 3 + 43 // 2023 week 1 to 2026 week 43
const ALL = HIST + 9 + 52 // forecast runs to the end of next year
const LEVEL = 52_000

const weekOf = (t: number) => (t % 52) + 1
const yearOf = (t: number) => 2023 + Math.floor(t / 52)
const bump = (w: number, at: number, width: number) => Math.exp(-(((w - at) / width) ** 2))

// the yearly shape: quiet January, a summer dip, the climb into peak
const season = (w: number) => 1 - 0.07 * bump(w, 2, 2.5) - 0.09 * bump(w, 31, 4) + 0.16 * bump(w, 46, 3) + 0.42 * bump(w, 49, 2)
const trend = (t: number) => 1 + (0.035 * t) / 52
// weeks with a stat holiday lose about a day, Christmas week loses more
const HOLIDAYS = [1, 8, 14, 21, 27, 32, 36, 41]
const holiday = (w: number) => (w === 52 ? 0.64 : HOLIDAYS.includes(w) ? 0.86 : 1)
// the big client runs a sale every summer, the week moves a little each year
const SALE: Record<number, number> = { 2023: 28, 2024: 29, 2025: 28, 2026: 28, 2027: 27 }
const client = (t: number) => 1 + 0.22 * bump(weekOf(t), SALE[yearOf(t)], 0.8)
const noise = (t: number) => 1 + 0.022 * Math.sin(t * 12.9898 + Math.sin(t * 78.233) * 4)

// one-off weeks the cleaning step takes out: three events and an outage
const ODD: Record<number, number> = { 18: 1.3, 91: 1.22, 118: 1.26, 128: 0.62 }

const fits = [
  (t: number) => LEVEL * 1.05 * season(weekOf(t)),
  (t: number) => LEVEL * trend(t) * season(weekOf(t)),
  (t: number) => LEVEL * trend(t) * season(weekOf(t)) * holiday(weekOf(t)) * client(t),
]
const clean = Array.from({ length: HIST }, (_, t) => fits[2](t) * noise(t))
const raw = clean.map((v, t) => v * (ODD[t] ?? 1))
const off = (fit: (t: number) => number) => (100 * clean.reduce((n, v, t) => n + Math.abs(fit(t) - v) / v, 0)) / HIST

const W = 1000, L = 58, R = 12, T = 34, B = 300
const lo = 30_000, hi = 92_000
const X = (t: number) => L + ((W - L - R) * t) / (ALL - 1)
const Y = (v: number) => B - ((B - T) * (v - lo)) / (hi - lo)
const path = (n: number, f: (t: number) => number, from = 0) =>
  Array.from({ length: n - from }, (_, i) => `${i ? 'L' : 'M'}${X(from + i).toFixed(1)},${Y(f(from + i)).toFixed(1)}`).join('')

// small panels for the three parts, one year wide
const PW = 290, PH = 74, PY = 352
const panel = (i: number) => L + i * (PW + 22)
const mini = (x0: number, f: (w: number) => number, a: number, b: number) =>
  Array.from({ length: 52 }, (_, i) => `${i ? 'L' : 'M'}${(x0 + (PW * i) / 51).toFixed(1)},${(PY + PH - (PH * (f(i + 1) - a)) / (b - a)).toFixed(1)}`).join('')

const TERMINALS = 135, NUMBERS = 8

export default function Model({ stages, at, setAt }: { stages: Stage[]; at: number; setAt: (i: number) => void }) {
  const fit = at >= 2 ? fits[Math.min(at - 2, 2)] : null
  const forecast = at >= 5
  const grid = at >= 6
  const today = X(HIST - 1)

  return (
    <div className="model" onClick={(e) => e.stopPropagation()}>
      <ol className="model-stages">
        {stages.map((s, i) => (
          <li key={s.title} className={i === at ? 'on' : i < at ? 'done' : ''}>
            <button type="button" aria-pressed={i === at} onClick={() => setAt(i)}>
              <span>{i + 1}</span>
              {s.title}
            </button>
            {i === at && <p key={i}>{s.text}</p>}
          </li>
        ))}
      </ol>

      <div className="model-figure">
        <svg className={`model-svg at-${at}`} viewBox={`0 0 ${W} 446`} role="img" aria-label="One terminal's weekly pieces and the model learning its parts">
          {[40_000, 60_000, 80_000].map((v) => (
            <g key={v}>
              <line className="vz-grid" x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} />
              <text className="vz-axis" x={L - 8} y={Y(v) + 4} textAnchor="end">{v / 1000}K</text>
            </g>
          ))}
          {[2023, 2024, 2025, 2026, 2027].map((y) => (
            <text key={y} className="vz-axis" x={X((y - 2023) * 52 + 26)} y={B + 22} textAnchor="middle">{y}</text>
          ))}

          {forecast && (
            <g className="model-ahead">
              <rect x={today} y={T - 10} width={W - R - today} height={B - T + 10} />
              <line x1={today} x2={today} y1={T - 10} y2={B} />
              <text x={today + 8} y={T + 4}>Forecast</text>
            </g>
          )}

          <path className={`model-raw${at >= 1 ? ' ghost' : ''}`} d={path(HIST, (t) => raw[t])} />
          {at >= 1 && <path className="model-clean" d={path(HIST, (t) => clean[t])} />}
          {at === 1 && Object.keys(ODD).map((k) => (
            <circle key={k} className="model-odd" cx={X(+k)} cy={Y(raw[+k])} r="9" />
          ))}
          {fit && <path key={at} pathLength={1} className="model-fit" d={forecast ? path(ALL, fit, HIST - 1) : path(HIST, fit)} />}
          {at === 4 && Array.from({ length: HIST }, (_, t) => t).filter((t) => holiday(weekOf(t)) < 1).map((t) => (
            <line key={t} className="model-tick" x1={X(t)} x2={X(t)} y1={B - 6} y2={B} />
          ))}

          {fit && !forecast && (
            <text className="model-off" x={W - R} y={T - 14} textAnchor="end">Off by {off(fit).toFixed(1)}% on past weeks</text>
          )}

          {grid ? (
            <g className="model-grid">
              {Array.from({ length: TERMINALS * NUMBERS }, (_, i) => (
                <rect
                  key={i}
                  x={L + (i % TERMINALS) * ((W - L - R) / TERMINALS)}
                  y={PY - 4 + Math.floor(i / TERMINALS) * 11}
                  width={(W - L - R) / TERMINALS - 1.6}
                  height="8"
                  style={{ animationDelay: `${(i % TERMINALS) * 6 + Math.floor(i / TERMINALS) * 30}ms` }}
                />
              ))}
              <text x={L} y={PY + 100}>{TERMINALS} terminals across, {NUMBERS} numbers down, about a thousand models</text>
            </g>
          ) : (
            [
              { name: 'Yearly shape', f: season, a: 0.85, b: 1.45, on: 2 },
              { name: 'Trend', f: (w: number) => trend(w * 3), a: 0.98, b: 1.12, on: 3 },
              { name: 'Holidays and the big client', f: (w: number) => holiday(w) * client(104 + w - 1), a: 0.6, b: 1.25, on: 4 },
            ].map((p, i) => (
              <g key={p.name} className={`model-part${at === p.on ? ' on' : at > p.on ? ' done' : ''}`}>
                <text x={panel(i)} y={PY - 10}>{p.name}</text>
                <line x1={panel(i)} x2={panel(i) + PW} y1={PY + PH} y2={PY + PH} />
                <path d={mini(panel(i), p.f, p.a, p.b)} />
              </g>
            ))
          )}
        </svg>
        <p className="model-under">R forecast package, STL with ARIMA and regressors</p>
      </div>
    </div>
  )
}
