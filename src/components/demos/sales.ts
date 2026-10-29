// Box office sales arriving one at a time. Each row is checked before it
// reaches the dashboard, and anything that would skew the totals is held back.

export interface Sale {
  id: number
  theatre: string
  show: number | null
  tickets: number
  gross: number
}

export const THEATRES = ['Downtown', 'Midtown', 'West End', 'Uptown']

// a small seeded generator so the stream looks random but replays the same
export function rng(seed: number) {
  let s = seed
  return () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
}

export function makeSale(id: number, rand: () => number, bad: boolean): Sale {
  const tickets = 1 + Math.floor(rand() * 4)
  const sale: Sale = {
    id,
    theatre: THEATRES[Math.floor(rand() * THEATRES.length)],
    show: 88000 + Math.floor(rand() * 400),
    tickets,
    gross: Math.round(tickets * (12.5 + rand() * 4) * 100) / 100,
  }
  if (!bad || rand() > 0.35) return sale
  const kind = Math.floor(rand() * 3)
  if (kind === 0) return { ...sale, gross: -sale.gross }
  if (kind === 1) return { ...sale, show: null }
  return { ...sale, id: id - 1 }
}

export function checkSale(s: Sale, seen: Set<number>): string | null {
  if (seen.has(s.id)) return `duplicate sale id ${s.id}`
  if (s.show === null) return 'missing showtime'
  if (s.gross < 0) return `negative gross ${s.gross.toFixed(2)}`
  return null
}
