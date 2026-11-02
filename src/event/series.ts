// One terminal's weekly pieces for the model slides, all mock. The parts are
// built the same way the real model splits a series (yearly shape, trend,
// holidays and the big client), so the fits on the slides add up honestly.

export const HIST = 52 * 3 + 43 // 2023 week 1 to 2026 week 43
export const ALL = HIST + 9 + 52 // forecast runs to the end of next year
const LEVEL = 52_000

export const weekOf = (t: number) => (t % 52) + 1
const yearOf = (t: number) => 2023 + Math.floor(t / 52)
const bump = (w: number, at: number, width: number) => Math.exp(-(((w - at) / width) ** 2))

// quiet January, a summer dip, the climb into peak
export const season = (w: number) => 1 - 0.07 * bump(w, 2, 2.5) - 0.09 * bump(w, 31, 4) + 0.16 * bump(w, 46, 3) + 0.42 * bump(w, 49, 2)
export const trend = (t: number) => 1 + (0.035 * t) / 52
// weeks with a stat holiday lose about a day, Christmas week loses more
const HOLIDAYS = [1, 8, 14, 21, 27, 32, 36, 41]
export const holiday = (w: number) => (w === 52 ? 0.64 : HOLIDAYS.includes(w) ? 0.86 : 1)
// the big client runs a sale every summer, the week moves a little each year
const SALE: Record<number, number> = { 2023: 28, 2024: 29, 2025: 28, 2026: 28, 2027: 27 }
export const client = (t: number) => 1 + 0.22 * bump(weekOf(t), SALE[yearOf(t)], 0.8)
const noise = (t: number) => 1 + 0.022 * Math.sin(t * 12.9898 + Math.sin(t * 78.233) * 4)

// one-off weeks the cleaning step takes out, three events and an outage
export const ODD: Record<number, number> = { 18: 1.3, 91: 1.22, 118: 1.26, 128: 0.62 }

// the fit as each part is added, season only, plus trend, plus regressors
export const fits = [
  (t: number) => LEVEL * 1.05 * season(weekOf(t)),
  (t: number) => LEVEL * trend(t) * season(weekOf(t)),
  (t: number) => LEVEL * trend(t) * season(weekOf(t)) * holiday(weekOf(t)) * client(t),
]
export const clean = Array.from({ length: HIST }, (_, t) => fits[2](t) * noise(t))
export const raw = clean.map((v, t) => v * (ODD[t] ?? 1))

// mean absolute percentage error and mean signed error, in %, over weeks a to b
export const mape = (f: (t: number) => number, a = 0, b = HIST) => {
  let n = 0
  for (let t = a; t < b; t++) n += Math.abs(f(t) - clean[t]) / clean[t]
  return (100 * n) / (b - a)
}
export const bias = (f: (t: number) => number, a: number, b: number) => {
  let n = 0
  for (let t = a; t < b; t++) n += (f(t) - clean[t]) / clean[t]
  return (100 * n) / (b - a)
}

// the three models scored on held out weeks, each off in its own way
export const CUT = HIST - 26
const port = (t: number) => fits[2](t) * (1 + 0.006 + 0.012 * Math.sin(t * 1.7))
export const models = [
  { name: 'R model', with: 'STL and ARIMA with regressors', f: port },
  { name: 'Python port', with: 'statsmodels STL and pmdarima', f: (t: number) => port(t) * (1 + 0.006 * Math.sin(t * 2.3 + 1)) },
  {
    name: 'Prophet',
    with: 'Trend changepoints and Fourier terms',
    f: (t: number) => {
      const w = weekOf(t)
      return LEVEL * trend(t) * season(w) * (1 - (1 - holiday(w)) * 0.7) * (1 + 0.5 * (client(t) - 1)) * (0.982 + 0.015 * Math.sin(t * 0.9))
    },
  },
]
