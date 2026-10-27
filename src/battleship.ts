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

