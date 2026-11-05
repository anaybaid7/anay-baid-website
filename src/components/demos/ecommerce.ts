// Two forecasts for a monthly series with a strong December, scored on the
// last twelve months they never saw. The same seasonal-naive baseline any
// forecast at work has to beat, and one step up from it.

export interface Month {
  month: string // YYYY-MM
  value: number
}

export type Model = 'naive' | 'growth'

export const MODELS: Record<Model, string> = {
  naive: 'Same month last year',
  growth: 'Last year, scaled by the trailing 12 month growth',
}

export const addMonths = (m: string, n: number) => {
  const [y, mo] = m.split('-').map(Number)
  const t = y * 12 + (mo - 1) + n
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)

// forecast h months past the end of history
export function forecast(history: Month[], model: Model, h: number): Month[] {
  const v = history.map((m) => m.value)
  const n = v.length
  // growth of the last 12 months over the 12 before them
  const g = model === 'growth' && n >= 24 ? sum(v.slice(n - 12)) / sum(v.slice(n - 24, n - 12)) : 1
  const out: Month[] = []
  for (let i = 1; i <= h; i++) {
    // the same month a year before, wrapping onto earlier forecasts past a year out
    const back = n - 12 + ((i - 1) % 12)
    const base = v[back] * g ** Math.floor((i - 1) / 12)
    out.push({ month: addMonths(history[n - 1].month, i), value: base * g })
  }
  return out
}

// mean absolute percentage error on the held out months
export function backtest(series: Month[], model: Model, holdout = 12) {
  const train = series.slice(0, -holdout)
  const test = series.slice(-holdout)
  const pred = forecast(train, model, holdout)
  const mape = sum(test.map((t, i) => Math.abs(pred[i].value - t.value) / t.value)) / holdout
  return { pred, mape }
}
