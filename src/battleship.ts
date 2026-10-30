// the five vehicles from the real game, placed at random on an 8x8 board
export const FLEET = [
  { name: 'Air Freighter', size: 5 },
  { name: 'Semi Truck', size: 4 },
  { name: 'Delivery Van', size: 3 },
  { name: 'Cargo Bike', size: 3 },
  { name: 'Scooter', size: 2 },
]
export const N = 8

type Ship = { name: string; cells: number[] }

export function placeFleet(random: () => number = Math.random): Ship[] {
  const taken = new Set<number>()
  return FLEET.map(({ name, size }) => {
    for (;;) {
      const across = random() < 0.5
      const r = Math.floor(random() * (across ? N : N - size + 1))
      const c = Math.floor(random() * (across ? N - size + 1 : N))
      const cells = Array.from({ length: size }, (_, i) => (across ? r * N + c + i : (r + i) * N + c))
      if (cells.every((x) => !taken.has(x))) {
        cells.forEach((x) => taken.add(x))
        return { name, cells }
      }
    }
  })
}


// The bot opponent: aim next to an unsunk hit when there is one, otherwise
// pick an open square on a checkerboard, since every ship covers one.
export function botShot(shots: number[], hits: number[], random: () => number = Math.random): number {
  const tried = new Set(shots)
  for (const h of hits) {
    const r = Math.floor(h / N)
    const c = h % N
    const around = [
      r > 0 ? h - N : -1,
      r < N - 1 ? h + N : -1,
      c > 0 ? h - 1 : -1,
      c < N - 1 ? h + 1 : -1,
    ].filter((x) => x >= 0 && !tried.has(x))
    if (around.length) return around[Math.floor(random() * around.length)]
  }
  const open = Array.from({ length: N * N }, (_, i) => i).filter((i) => !tried.has(i))
  const even = open.filter((i) => (Math.floor(i / N) + (i % N)) % 2 === 0)
  const pool = even.length ? even : open
  return pool[Math.floor(random() * pool.length)]
}

export type Placed = { name: string; cells: number[] }

// cells for a vehicle starting at a square, across or down, or null if it
// would run off the board
export function cellsAt(start: number, size: number, across: boolean): number[] | null {
  const r = Math.floor(start / N)
  const c = start % N
  if (across ? c + size > N : r + size > N) return null
  return Array.from({ length: size }, (_, i) => (across ? start + i : start + i * N))
}

// what the server checks before it accepts a fleet: the right number of
// vehicles, every cell on the board, and no two vehicles overlapping
export function validPlacement(ships: Placed[]) {
  if (ships.length !== FLEET.length) return `need ${FLEET.length} vehicles, got ${ships.length}`
  const cells = ships.flatMap((s) => s.cells)
  if (!cells.every((x) => x >= 0 && x < N * N)) return 'a vehicle is off the board'
  if (new Set(cells).size !== cells.length) return 'two vehicles overlap'
  return null
}
