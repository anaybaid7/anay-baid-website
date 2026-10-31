// A rush at the front desk as a single queue. Students arrive, one staff
// member logs each pickup, and the next student waits until that's done.
// By hand is the README's 20 seconds per entry; the extension is a click
// and a glance at the entry.

export const BY_HAND = 20
export const ONE_CLICK = 3

export interface Visit {
  arrive: number
  start: number
  end: number
}

// students arrive every few seconds after the mail is sorted
export function arrivals(n: number, gap: number) {
  // a little jitter so it doesn't look like a metronome
  return Array.from({ length: n }, (_, i) => Math.max(0, i * gap + ((i * 7) % 5) - 2))
}

export function serve(times: number[], each: number): Visit[] {
  let free = 0
  return times.map((arrive) => {
    const start = Math.max(arrive, free)
    free = start + each
    return { arrive, start, end: free }
  })
}

export const stats = (v: Visit[]) => ({
  longest: Math.max(...v.map((x) => x.start - x.arrive)),
  done: v.at(-1)!.end,
  // people standing in line at time t
  line: (t: number) => v.filter((x) => x.arrive <= t && x.start > t).length,
})
