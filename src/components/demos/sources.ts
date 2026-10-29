import pipeline from './pipeline.ts?raw'
import allocate from './allocate.ts?raw'
import sales from './sales.ts?raw'
import compareSchemas from './compareSchemas.ts?raw'
import score from './score.ts?raw'
import workflow from './workflow.ts?raw'
import battleship from '../../battleship.ts?raw'
import planBuild from './planBuild.ts?raw'
import npc from './npc.ts?raw'
import appStore from './appStore.ts?raw'
import type { DemoKind } from '../../details'

export interface Source {
  file: string
  source: string
}

// the logic behind each demo, shown as is in the drawer's Code tab
export const SOURCES: Partial<Record<DemoKind, Source>> = {
  pipeline: { file: 'pipeline.ts', source: pipeline },
  allocation: { file: 'allocate.ts', source: allocate },
  stream: { file: 'sales.ts', source: sales },
  dataval: { file: 'compareSchemas.ts', source: compareSchemas },
  fraud: { file: 'score.ts', source: score },
  scorer: { file: 'score.ts', source: score },
  extension: { file: 'workflow.ts', source: workflow },
  battleship: { file: 'battleship.ts', source: battleship },
  build: { file: 'planBuild.ts', source: planBuild },
  fsm: { file: 'npc.ts', source: npc },
  router: { file: 'appStore.ts', source: appStore },
}

// one entry per file, in the order the demos are listed
export const sourcesFor = (kinds: DemoKind[]) =>
  kinds.map((k) => SOURCES[k]).filter((s, i, all): s is Source => Boolean(s) && all.findIndex((x) => x?.file === s!.file) === i)
