import { useEffect, useMemo, useState } from 'react'
import { MODELS, backtest, forecast, type Model, type Month } from './ecommerce'

interface Run {
  at: string
  ok: boolean
  rows: number
  checks: { name: string; ok: boolean; detail: string }[]
  revised: { month: string; from: number; to: number }[]
  added: string[]
  error?: string
}
interface Data {
  series: { table: string; coordinate: string; picked: string[]; release: string }
  months: Month[]
  runs: Run[]
}

const W = 640
const H = 240
const PAD = { l: 44, r: 10, t: 10, b: 24 }
const bn = (v: number) => `$${(v / 1e9).toFixed(1)}B`
const when = (iso: string) => new Date(iso).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })
const label = (m: string) => new Date(`${m}-15`).toLocaleString('en-CA', { month: 'short', year: 'numeric' })

// Canada's monthly retail e-commerce sales from Statistics Canada, pulled
// and checked by a scheduled function on this site, then forecast here.
// Pick a model to see how it did on the last year it never saw.
export default function EcomForecast() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState('')
  const [model, setModel] = useState<Model>('growth')

  useEffect(() => {
    let live = true
    fetch('/api/ecommerce')
      .then(async (r) => {
        // a build without the site's functions answers with the page itself
        if (!r.headers.get('content-type')?.includes('json')) throw 'the data function only runs on the deployed site'
        const body = await r.json()
        if (!r.ok) throw body.error ?? `HTTP ${r.status}`
        return body
      })
      .then((d: Data) => live && setData(d))
      .catch((e) => live && setError(String(e)))
    return () => {
      live = false
    }
  }, [])

  const view = useMemo(() => {
    if (!data || data.months.length < 36) return null
    const s = data.months
    const scores = (Object.keys(MODELS) as Model[]).map((k) => ({ k, ...backtest(s, k) }))
    const picked = scores.find((x) => x.k === model)!
    const ahead = forecast(s, model, 12)
    const shown = s.slice(-48)
    const all = [...shown, ...ahead]
    const max = Math.max(...all.map((m) => m.value)) * 1.05
    const x = (i: number) => PAD.l + (i / (all.length - 1)) * (W - PAD.l - PAD.r)
    const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b)
    const line = (pts: Month[], from: number) => pts.map((p, i) => `${i ? 'L' : 'M'}${x(from + i).toFixed(1)},${y(p.value).toFixed(1)}`).join('')
    return {
      scores,
      picked,
      ahead,
      actual: line(shown, 0),
      test: line(picked.pred, shown.length - 12),
      next: line([shown[shown.length - 1], ...ahead], shown.length - 1),
      split: x(shown.length - 12),
      now: x(shown.length - 1),
      ticks: [0, 0.25, 0.5, 0.75, 1].map((f) => ({ y: y(max * f), v: max * f })),
      years: all.map((m, i) => ({ m, i })).filter(({ m }) => m.month.endsWith('-01')).map(({ m, i }) => ({ x: x(i), year: m.month.slice(0, 4) })),
      last: s[s.length - 1],
    }
  }, [data, model])

  if (error) return <div className="demo ecom"><p className="demo-out warn">Couldn’t load the series right now ({error})</p></div>
  if (!data || !view) return <div className="demo ecom"><p className="demo-hint">Loading Statistics Canada data</p></div>
  const run = data.runs[0]

  return (
    <div className="demo ecom">
      <p className="demo-hint">Real data, refreshed daily. Switch the model and compare its error on the last 12 months.</p>
      <div className="demo-tabs" role="group" aria-label="Model">
        {view.scores.map((s) => (
          <button key={s.k} type="button" aria-pressed={model === s.k} onClick={() => setModel(s.k)}>
            {MODELS[s.k]} <small>{(s.mape * 100).toFixed(1)}% error</small>
          </button>
        ))}
      </div>

      <figure className="ecom-chart">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Monthly retail e-commerce sales, latest ${label(view.last.month)} at ${bn(view.last.value)}, forecast for the next 12 months`}>
          {view.ticks.map((t) => (
            <g key={t.y}>
              <line x1={PAD.l} x2={W - PAD.r} y1={t.y} y2={t.y} className="grid" />
              <text x={PAD.l - 6} y={t.y + 4} textAnchor="end">{bn(t.v)}</text>
            </g>
          ))}
          {view.years.map((t) => (
            <text key={t.year} x={t.x} y={H - 6} textAnchor="middle">{t.year}</text>
          ))}
          <rect x={view.split} y={PAD.t} width={view.now - view.split} height={H - PAD.t - PAD.b} className="held" />
          <path d={view.actual} className="actual" />
          <path d={view.test} className="test" />
          <path d={view.next} className="next" />
        </svg>
        <figcaption className="demo-legend">
          <i className="k-actual" /> StatCan actuals <i className="k-test" /> backtest on the held out year <i className="k-next" /> next 12 months
        </figcaption>
      </figure>

      <div className="nm-grid">
        <div>
          <p className="demo-h">Latest month</p>
          <dl className="br-stats">
            <div><dt>{label(view.last.month)}</dt><dd>{bn(view.last.value)}</dd></div>
            <div><dt>Forecast {label(view.ahead[0].month)}</dt><dd>{bn(view.ahead[0].value)}</dd></div>
          </dl>
          <p className="ecom-src">
            Table <a href={`https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=${data.series.table.replace(/-/g, '')}`} target="_blank" rel="noreferrer">{data.series.table}</a>, {data.series.picked.join(', ')}, released {when(data.series.release)}
          </p>
        </div>
        <div>
          <p className="demo-h">Last pipeline run, {when(run.at)}</p>
          {run.error ? (
            <p className="demo-out warn">{run.error}, kept the previous copy</p>
          ) : (
            <ul className="ecom-checks">
              {run.checks.map((c) => (
                <li key={c.name} className={c.ok ? '' : 'bad'}><b>{c.ok ? '✓' : '✗'}</b> {c.name} <span>{c.detail}</span></li>
              ))}
              <li><b>{run.revised.length ? '↺' : '='}</b> Revisions <span>{run.revised.length ? run.revised.map((r) => `${label(r.month)} ${bn(r.from)} to ${bn(r.to)}`).join(', ') : 'none since the last run'}</span></li>
            </ul>
          )}
          <p className="ecom-src">{data.runs.length} runs kept, {data.runs.filter((r) => r.ok).length} passed every check</p>
        </div>
      </div>
    </div>
  )
}
