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
