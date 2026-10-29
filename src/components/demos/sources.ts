import pipeline from './pipeline.ts?raw'
import allocate from './allocate.ts?raw'
import sales from './sales.ts?raw'
import compareSchemas from './compareSchemas.ts?raw'
import score from './score.ts?raw'
import starrez from './starrez.ts?raw'
import battleship from '../../battleship.ts?raw'
import dispatch from './dispatch.ts?raw'
import shelter from './shelter.ts?raw'
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
  extension: { file: 'starrez.ts', source: starrez },
  battleship: { file: 'battleship.ts', source: battleship },
  build: { file: 'dispatch.ts', source: dispatch },
  fsm: { file: 'shelter.ts', source: shelter },
  router: { file: 'appStore.ts', source: appStore },
}

// one entry per file, in the order the demos are listed
export const sourcesFor = (kinds: DemoKind[]) =>
  kinds.map((k) => SOURCES[k]).filter((s, i, all): s is Source => Boolean(s) && all.findIndex((x) => x?.file === s!.file) === i)
