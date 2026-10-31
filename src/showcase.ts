import type { DemoKind } from './details'

// The demos shown up front, one picture each, in the order a reviewer
// should see them. Each opens its drawer straight on that demo.
export interface Tile {
  id: string
  kind: DemoKind
  title: string
}

export const SHOWCASE: Tile[] = [
  { id: 'job-purolator', kind: 'planner', title: 'Weekly volume planner' },
  { id: 'job-purolator', kind: 'pipeline', title: 'Forecast pipeline run' },
  { id: 'project-insightvault', kind: 'evaluate', title: 'Fraud threshold tuning' },
  { id: 'project-starrez-enterprise-automation-suite', kind: 'extension', title: 'Front desk extension' },
  { id: 'project-battleship-for-purolator', kind: 'battleship', title: 'Two-player Battleship' },
  { id: 'job-iotum', kind: 'sdk', title: 'Embedded meeting SDK' },
  { id: 'job-cineplex-entertainment', kind: 'heatmap', title: 'Copy reconciliation' },
  { id: 'job-nationwide-appraisals', kind: 'network', title: 'Bastion and private subnet' },
  { id: 'project-ci-cd-build-automation-tool', kind: 'graph', title: 'Dispatch across repos' },
  { id: 'job-cineplex-entertainment', kind: 'showtime', title: 'Cleaning model inputs' },
  { id: 'project-pashu', kind: 'fsm', title: 'Animal needs state machine' },
  { id: 'project-client-side-routing-system', kind: 'router', title: 'Client-side router' },
]

export const thumb = (t: Tile, theme: 'light' | 'dark') => `/shots/${t.kind}-${theme}.webp`
