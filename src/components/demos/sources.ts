import callbridge from './callbridge.ts?raw'
import pipeline from './pipeline.ts?raw'
import planner from './planner.ts?raw'
import allocate from './allocate.ts?raw'
import sales from './sales.ts?raw'
import compareSchemas from './compareSchemas.ts?raw'
import score from './score.ts?raw'
import starrez from './starrez.ts?raw'
import battleship from '../../battleship.ts?raw'
import dispatch from './dispatch.ts?raw'
import shelter from './shelter.ts?raw'
import appStore from './appStore.ts?raw'
import evaluate from './evaluate.ts?raw'
import heatmap from './heatmap.ts?raw'
import graph from './graph.ts?raw'
import observer from './observer.ts?raw'
import drift from './drift.ts?raw'
import showtime from './showtime.ts?raw'
import sequence from './sequence.ts?raw'
import terraform from './terraform.ts?raw'
import type { DemoKind } from '../../details'

export interface Source {
  file: string
  source: string
}

// the logic behind each demo, shown as is in the drawer's Code tab
export const SOURCES: Partial<Record<DemoKind, Source>> = {
  sdk: { file: 'callbridge.ts', source: callbridge },
  pipeline: { file: 'pipeline.ts', source: pipeline },
  planner: { file: 'planner.ts', source: planner },
  allocation: { file: 'allocate.ts', source: allocate },
  stream: { file: 'sales.ts', source: sales },
  dataval: { file: 'compareSchemas.ts', source: compareSchemas },
  fraud: { file: 'score.ts', source: score },
  scorer: { file: 'score.ts', source: score },
  extension: { file: 'starrez.ts', source: starrez },
  battleship: { file: 'battleship.ts', source: battleship },
  build: { file: 'dispatch.ts', source: dispatch },
  fsm: { file: 'shelter.ts', source: shelter },
  router: { file: 'appStore.ts', source: appStore },
  evaluate: { file: 'evaluate.ts', source: evaluate },
  heatmap: { file: 'heatmap.ts', source: heatmap },
  graph: { file: 'graph.ts', source: graph },
  observer: { file: 'observer.ts', source: observer },
  drift: { file: 'drift.ts', source: drift },
  showtime: { file: 'showtime.ts', source: showtime },
  sequence: { file: 'sequence.ts', source: sequence },
  terraform: { file: 'terraform.ts', source: terraform },
}

// one entry per file, in the order the demos are listed
export const sourcesFor = (kinds: DemoKind[]) =>
  kinds.map((k) => SOURCES[k]).filter((s, i, all): s is Source => Boolean(s) && all.findIndex((x) => x?.file === s!.file) === i)
