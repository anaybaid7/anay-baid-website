import type { DemoKind } from './details'

// The three pieces to look at first. Each opens on its strongest demo and
// shows one decision from its notes in decisions.ts.
export const FEATURED: { id: string; kind: DemoKind; title: string; decision: number }[] = [
  { id: 'job-purolator', kind: 'planner', title: 'Forecasting pipeline and planning tools', decision: 3 },
  { id: 'project-insightvault', kind: 'evaluate', title: 'Fraud alerts that explain themselves', decision: 0 },
  { id: 'project-starrez-enterprise-automation-suite', kind: 'extension', title: 'One-click front desk logging', decision: 0 },
]

// short recordings made by scripts/clips.mjs
export const clip = (kind: DemoKind, theme: 'light' | 'dark', ext: 'webm' | 'mp4') => `/clips/${kind}-${theme}.${ext}`

// screenshots made by scripts/shots.mjs, one per demo and theme
export const thumb = (kind: DemoKind, theme: 'light' | 'dark') => `/shots/${kind}-${theme}.webp`

// the demos that have a recording: the featured ones and each entry's first
const CLIPS: DemoKind[] = ['planner', 'evaluate', 'extension', 'pipeline', 'sdk', 'provision', 'stream', 'fraud', 'build', 'fsm', 'battleship', 'router']
export const hasClip = (kind: DemoKind) => CLIPS.includes(kind)
