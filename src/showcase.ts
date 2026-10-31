import type { DemoKind } from './details'

// The three pieces to look at first, each opening on its strongest demo
export const FEATURED: { id: string; kind: DemoKind; title: string }[] = [
  { id: 'job-purolator', kind: 'planner', title: 'Forecasting pipeline and planning tools' },
  { id: 'project-insightvault', kind: 'evaluate', title: 'Fraud alerts that explain themselves' },
  { id: 'project-starrez-enterprise-automation-suite', kind: 'extension', title: 'One-click front desk logging' },
]

// screenshots made by scripts/shots.mjs, one per demo and theme
export const thumb = (kind: DemoKind, theme: 'light' | 'dark') => `/shots/${kind}-${theme}.webp`
