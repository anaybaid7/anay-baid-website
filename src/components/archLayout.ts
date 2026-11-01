import type { Architecture, ArchNode, NodeKind } from '../details'

// Shared by the drawer diagram and the case study: where each box sits and
// how the lines between them bend.
export const W = 188
export const H = 62
export const GX = 56
export const GY = 52
export const PAD = 22
export const STEP_MS = 3200

export interface Box {
  x: number
  y: number
  node: ArchNode
}

// a path between two boxes that bends at right angles when they aren't on
// the same row or column. Works in either direction.
export function route(a: Box, b: Box) {
  const ax = a.x + W / 2
  const ay = a.y + H / 2
  const bx = b.x + W / 2
  const by = b.y + H / 2
  if (Math.abs(ay - by) < 1) {
    const [x1, x2] = bx > ax ? [a.x + W, b.x] : [a.x, b.x + W]
    return `M${x1},${ay} H${x2}`
  }
  if (Math.abs(ax - bx) < 1) {
    const [y1, y2] = by > ay ? [a.y + H, b.y] : [a.y, b.y + H]
    return `M${ax},${y1} V${y2}`
  }
  const right = bx > ax
  const x1 = right ? a.x + W : a.x
  const x2 = right ? b.x : b.x + W
  const mid = (x1 + x2) / 2
  return `M${x1},${ay} H${mid} V${by} H${x2}`
}

// small line icons for what each box is, drawn in a 16px box
export const ICONS: Record<NodeKind, string> = {
  client: 'M2 3h12v10H2z M2 6h12',
  service: 'M2 2h12v5H2z M2 9h12v5H2z M5 4.5h.01 M5 11.5h.01',
  store: 'M2 4c0-1.5 12-1.5 12 0v8c0 1.5-12 1.5-12 0z M2 4c0 1.5 12 1.5 12 0 M2 8c0 1.5 12 1.5 12 0',
  job: 'M8 2a6 6 0 1 0 .01 0z M8 5v3l2 2',
  queue: 'M2 3h12 M2 6.5h12 M2 10h12 M2 13.5h12',
  cloud: 'M4.5 12.5h7a3 3 0 0 0 .3-6 4 4 0 0 0-7.6-.8A2.9 2.9 0 0 0 4.5 12.5z',
  person: 'M8 2.5a2.5 2.5 0 1 0 .01 0z M3 14c.5-3 2.5-4.5 5-4.5s4.5 1.5 5 4.5',
  file: 'M4 2h5l3 3v9H4z M9 2v3h3',
  code: 'M6 4 2 8l4 4 M10 4l4 4-4 4',
}


export function layout(arch: Architecture) {
  const top = arch.groups?.length ? 30 : 0
  const boxes = new Map<string, Box>()
  for (const node of arch.nodes) boxes.set(node.id, { node, x: PAD + node.col * (W + GX), y: PAD + top + node.row * (H + GY) })
  const cols = Math.max(...arch.nodes.map((n) => n.col)) + 1
  const rows = Math.max(...arch.nodes.map((n) => n.row)) + 1
  return { boxes, width: PAD * 2 + cols * W + (cols - 1) * GX, height: PAD * 2 + top + rows * H + (rows - 1) * GY }
}
