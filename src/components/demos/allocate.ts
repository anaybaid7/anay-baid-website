export interface Site {
  name: string
  share: number
  capacity: number
}

export interface Allocation {
  placed: number[]
  capped: boolean[]
  short: number
}

// Split a volume across sites by forecast share without going over any site's
// capacity. Whatever a full site can't take moves to the sites with room, in
// proportion to their share, until it's all placed or everyone is full. The
// total is never changed, only moved.
export function allocate(volume: number, sites: Site[]): Allocation {
  const placed = sites.map(() => 0)
  const capped = sites.map(() => false)
  let left = volume
  for (let round = 0; round < sites.length + 1 && left > 0.5; round++) {
    const open = sites.map((_, i) => i).filter((i) => !capped[i])
    const shareSum = open.reduce((s, i) => s + sites[i].share, 0)
    if (open.length === 0 || shareSum === 0) break
    let spilled = 0
    for (const i of open) {
      const want = (left * sites[i].share) / shareSum
      const room = sites[i].capacity - placed[i]
      const take = Math.min(want, room)
      placed[i] += take
      spilled += want - take
      if (room - take < 0.5) capped[i] = true
    }
    left = spilled
  }
  return { placed: placed.map((p) => Math.round(p)), capped, short: Math.round(Math.max(0, left)) }
}

// The same split on a map. Each terminal sits in a city, and the overflow
// is tracked as moves from the terminal that couldn't take it to the one
// that did, so the cost of each policy shows up as parcel-kilometres.

export interface Terminal extends Site {
  at: [number, number] // lon, lat
}

export interface Move {
  from: number
  to: number
  amount: number
}

export type Policy = 'share' | 'nearest'

// great-circle distance in km
export function km([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) {
  const r = Math.PI / 180
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2
  return 6371 * 2 * Math.asin(Math.sqrt(a))
}

export function route(volume: number, sites: Terminal[], policy: Policy) {
  const shareSum = sites.reduce((s, t) => s + t.share, 0) || 1
  const want = sites.map((t) => (volume * t.share) / shareSum)
  const placed = sites.map((t, i) => Math.min(want[i], t.capacity))
  // what each terminal's own share couldn't fit, still owned by that terminal
  const over = want.map((w, i) => w - placed[i])
  const moves: Move[] = []
  const room = (i: number) => sites[i].capacity - placed[i]
  const send = (from: number, to: number, amount: number) => {
    if (amount < 0.5) return
    placed[to] += amount
    over[from] -= amount
    const m = moves.find((x) => x.from === from && x.to === to)
    if (m) m.amount += amount
    else moves.push({ from, to, amount })
  }

  if (policy === 'nearest') {
    // each terminal's overflow goes to the closest terminal with room first
    for (const from of sites.map((_, i) => i).sort((a, b) => over[b] - over[a])) {
      const near = sites.map((_, i) => i).filter((i) => i !== from).sort((a, b) => km(sites[from].at, sites[a].at) - km(sites[from].at, sites[b].at))
      for (const to of near) if (over[from] > 0.5) send(from, to, Math.min(over[from], room(to)))
    }
  } else {
    // spill by share, the way allocate() does, a round at a time
    for (let round = 0; round <= sites.length; round++) {
      const pool = over.reduce((a, b) => a + b, 0)
      const open = sites.map((_, i) => i).filter((i) => room(i) > 0.5)
      const openShare = open.reduce((s, i) => s + sites[i].share, 0)
      if (pool < 0.5 || !openShare) break
      const snapshot = [...over]
      for (const to of open) {
        const take = Math.min((pool * sites[to].share) / openShare, room(to))
        // the parcels it takes come from every overflowing terminal in proportion
        for (const [from, o] of snapshot.entries()) if (o > 0 && from !== to) send(from, to, (take * o) / pool)
      }
    }
  }

  const parcelKm = moves.reduce((s, m) => s + m.amount * km(sites[m.from].at, sites[m.to].at), 0)
  return {
    placed: placed.map(Math.round),
    capped: sites.map((_, i) => room(i) < 0.5),
    short: Math.round(Math.max(0, over.reduce((a, b) => a + b, 0))),
    moves: moves.map((m) => ({ ...m, amount: Math.round(m.amount) })).filter((m) => m.amount > 0),
    parcelKm: Math.round(parcelKm),
  }
}
