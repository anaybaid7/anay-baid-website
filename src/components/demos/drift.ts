// Six servers set up by hand from the same runbook, then patched and tweaked
// one at a time over a quarter. Each week's changes are listed so the drift
// can be replayed; rebuilding from one image puts every box back in step.

export const HOSTS = ['app-01', 'app-02', 'app-03', 'batch-01', 'batch-02', 'report-01']

export const ITEMS = [
  { key: 'jre', label: 'Runtime' },
  { key: 'openssl', label: 'OpenSSL' },
  { key: 'tls', label: 'Min TLS' },
  { key: 'mtu', label: 'MTU' },
  { key: 'keepalive', label: 'TCP keepalive' },
  { key: 'tz', label: 'Timezone' },
  { key: 'app', label: 'App config' },
] as const

export type Key = (typeof ITEMS)[number]['key']
export type Config = Record<Key, string>

export const BASE: Config = { jre: '17.0.8', openssl: '3.0.9', tls: '1.2', mtu: '1500', keepalive: '7200s', tz: 'UTC', app: 'v41' }

// [week, host index, key, new value]
export const CHANGES: [number, number, Key, string][] = [
  [1, 0, 'app', 'v42'],
  [1, 1, 'app', 'v42'],
  [2, 3, 'tz', 'America/New_York'],
  [3, 0, 'openssl', '3.0.11'],
  [3, 1, 'openssl', '3.0.11'],
  [4, 2, 'mtu', '9001'],
  [5, 0, 'jre', '17.0.9'],
  [6, 4, 'keepalive', '600s'],
  [6, 2, 'app', 'v42'],
  [7, 5, 'tls', '1.0'],
  [8, 0, 'app', 'v43'],
  [8, 2, 'openssl', '3.0.11'],
  [9, 3, 'jre', '17.0.9'],
  [10, 1, 'jre', '17.0.10'],
  [11, 4, 'mtu', '9001'],
  [12, 0, 'app', 'v44'],
  [12, 1, 'app', 'v44'],
]

export const WEEKS = 12

export function at(week: number, imagedFrom: number | null): Config[] {
  // once on the image, every patch ships as a new image to every host
  if (imagedFrom !== null && week >= imagedFrom) return HOSTS.map(() => image(week))
  const hosts = HOSTS.map(() => ({ ...BASE }))
  for (const [w, h, k, v] of CHANGES) if (w <= week) hosts[h][k] = v
  return hosts
}

// the image takes the newest runtime, OpenSSL and app, and the runbook's
// network and timezone settings, so one-off tweaks on single boxes are gone
const PATCHED: Key[] = ['jre', 'openssl', 'app']
export function image(week: number): Config {
  const c = { ...BASE }
  for (const [w, , k, v] of CHANGES) if (w <= week && PATCHED.includes(k) && v.localeCompare(c[k], 'en', { numeric: true }) > 0) c[k] = v
  return c
}

// how many host-settings differ from the most common value for that setting
export function drift(cfg: Config[]) {
  let n = 0
  for (const { key } of ITEMS) {
    const counts = new Map<string, number>()
    for (const c of cfg) counts.set(c[key], (counts.get(c[key]) ?? 0) + 1)
    n += cfg.length - Math.max(...counts.values())
  }
  return n
}
