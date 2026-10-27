import allocate from './allocate.ts?raw'
import score from './score.ts?raw'
import compareSchemas from './compareSchemas.ts?raw'
import planBuild from './planBuild.ts?raw'
import battleship from '../../battleship.ts?raw'
import type { DemoKind } from '../../details'

// the code behind each demo, shown as is in the drawer's Code tab
export const SOURCES: Partial<Record<DemoKind, { file: string; source: string }>> = {
  allocation: { file: 'allocate.ts', source: allocate },
  scorer: { file: 'score.ts', source: score },
  schema: { file: 'compareSchemas.ts', source: compareSchemas },
  build: { file: 'planBuild.ts', source: planBuild },
  battleship: { file: 'battleship.ts', source: battleship },
}
