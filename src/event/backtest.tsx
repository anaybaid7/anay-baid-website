import type { Stage } from './content'
import { StageList } from './model'
import { CUT, HIST, bias, clean, mape, models } from './series'

// Backtesting: hide the last 26 weeks, let each model forecast them from the
// weeks before, then score each one against what came in. Mock series and
// mock model errors, see series.ts.

const FROM = HIST - 52 // the last year, so the held out half reads clearly
const W = 1000, L = 58, R = 12, T = 30, B = 290
const lo = 36_000, hi = 92_000
const X = (t: number) => L + ((W - L - R) * (t - FROM)) / (HIST - 1 - FROM)
const Y = (v: number) => B - ((B - T) * (v - lo)) / (hi - lo)
const line = (f: (t: number) => number, a: number, b: number) =>
  Array.from({ length: b - a }, (_, i) => `${i ? 'L' : 'M'}${X(a + i).toFixed(1)},${Y(f(a + i)).toFixed(1)}`).join('')

const TONES = ['tone-r', 'tone-py', 'tone-prophet']
const scores = models.map((m) => ({ mape: mape(m.f, CUT, HIST), bias: bias(m.f, CUT, HIST) }))
const best = scores.reduce((b, s, i) => (s.mape < scores[b].mape ? i : b), 0)

export default function Backtest({ stages, at, setAt }: { stages: Stage[]; at: number; setAt: (i: number) => void }) {
  // stage 1 to 3 add one model each, the last stage shows all of them scored
  const shown = models.map((_, i) => at >= i + 1)
  const scored = at >= models.length + 1
  const cut = X(CUT)

  return (
    <div className="model" onClick={(e) => e.stopPropagation()}>
      <StageList stages={stages} at={at} setAt={setAt} />

      <div className="model-figure">
        <svg className="model-svg" viewBox={`0 0 ${W} 320`} role="img" aria-label="Three models forecasting 26 held out weeks against what came in">
          {[40_000, 60_000, 80_000].map((v) => (
            <g key={v}>
              <line className="vz-grid" x1={L} x2={W - R} y1={Y(v)} y2={Y(v)} />
              <text className="vz-axis" x={L - 8} y={Y(v) + 4} textAnchor="end">{v / 1000}K</text>
            </g>
          ))}
          <text className="vz-axis" x={X(HIST - 46)} y={B + 22} textAnchor="middle">2025</text>
          <text className="vz-axis" x={X(HIST - 20)} y={B + 22} textAnchor="middle">2026</text>

          <g className="model-ahead">
            <rect x={cut} y={T - 10} width={W - R - cut} height={B - T + 10} />
            <line x1={cut} x2={cut} y1={T - 10} y2={B} />
            <text x={cut + 8} y={T + 6}>Held out, 26 weeks</text>
            <text x={cut - 8} y={T + 6} textAnchor="end" className="model-train">Training</text>
          </g>

          <path className="model-clean bt-actual" d={line((t) => clean[t], FROM, HIST)} />
          {models.map((m, i) => shown[i] && (
            <path key={m.name} pathLength={1} className={`model-fit ${TONES[i]}${scored || at === i + 1 ? '' : ' dim'}`} d={line(m.f, CUT, HIST)} />
          ))}
        </svg>

        <table className="bt-table">
          <thead>
            <tr><th scope="col">Model</th><th scope="col">Built with</th><th scope="col">MAPE</th><th scope="col">Bias</th></tr>
          </thead>
          <tbody>
            {models.map((m, i) => (
              <tr key={m.name} className={`${shown[i] ? 'on' : ''}${scored && i === best ? ' best' : ''}`}>
                <th scope="row"><i className={TONES[i]} />{m.name}</th>
                <td>{m.with}</td>
                <td>{shown[i] ? `${scores[i].mape.toFixed(1)}%` : ''}</td>
                <td>{scored ? `${scores[i].bias > 0 ? '+' : ''}${scores[i].bias.toFixed(1)}%` : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="model-under">Actual in black, each model forecasts the shaded weeks without seeing them</p>
      </div>
    </div>
  )
}
