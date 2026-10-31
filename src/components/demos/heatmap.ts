// Row counts per theatre per day, Azure minus on-prem. Most cells are zero;
// the rest come from a few kinds of fault, each with its own fix.

export const THEATRES = ['7104', '7112', '7120', '7133', '7141', '7158', '7166', '7179']
export const DAYS = 28 // February 2024

export type Cause = 'retry' | 'missed' | 'midnight'

export interface Fault {
  id: string
  cause: Cause
  theatre: number
  day: number
  // diff per affected cell, by day offset
  cells: [number, number][]
}

export const FAULTS: Fault[] = [
  { id: 'f1', cause: 'retry', theatre: 2, day: 9, cells: [[0, 412]] },
  { id: 'f2', cause: 'missed', theatre: 5, day: 16, cells: [[0, -1873]] },
  { id: 'f3', cause: 'midnight', theatre: 0, day: 3, cells: [[0, -38], [1, 38]] },
  { id: 'f4', cause: 'midnight', theatre: 6, day: 23, cells: [[0, -21], [1, 21]] },
  { id: 'f5', cause: 'retry', theatre: 3, day: 26, cells: [[0, 96]] },
]

export const CAUSE: Record<Cause, { title: string; sql: string; fix: string }> = {
  retry: {
    title: 'An ETL retry loaded the batch twice',
    sql: 'SELECT sale_id, COUNT(*)\nFROM box_office\nWHERE theatre_id = :t AND show_date = :d\nGROUP BY sale_id HAVING COUNT(*) > 1;',
    fix: 'Delete the duplicates and key the load on sale_id',
  },
  missed: {
    title: 'The day never landed on-prem',
    sql: "SELECT status, finished_at\nFROM load_log\nWHERE theatre_id = :t AND load_date = :d;\n-- status = 'timeout'",
    fix: 'Re-run the load for that theatre and day',
  },
  midnight: {
    title: 'Late shows filed under the next day',
    sql: "SELECT show_id, show_ts\nFROM box_office\nWHERE theatre_id = :t\n  AND show_ts::time < '05:00';\n-- on-prem show_date is VARCHAR, cut from UTC",
    fix: 'Cast show_date from local time, not UTC',
  },
}

export function grid(fixed: Set<string>) {
  const g = THEATRES.map(() => Array<number>(DAYS).fill(0))
  const owner: (string | null)[][] = THEATRES.map(() => Array(DAYS).fill(null))
  for (const f of FAULTS) {
    if (fixed.has(f.id)) continue
    for (const [off, diff] of f.cells) {
      g[f.theatre][f.day + off] += diff
      owner[f.theatre][f.day + off] = f.id
    }
  }
  return { g, owner }
}
