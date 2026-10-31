// Screenshots each showcase demo, in light and dark, into public/shots.
// Run against a built preview: npm run build && npx vite preview, then
// node scripts/shots.mjs [base url]. Needs ImageMagick for the webp step.
import { chromium } from 'playwright'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const base = process.argv[2] ?? 'http://localhost:4173'
const tmp = mkdtempSync(join(tmpdir(), 'shots-'))

// put a few demos in a state worth looking at before the picture
const click = (sel) => async (p) => {
  await p.locator(sel).first().click()
  await p.waitForTimeout(3500)
}
const SETUP = {
  pipeline: click('.demo .demo-primary'),
  network: click('.demo .demo-primary'),
  graph: click('.demo .demo-primary'),
  sdk: click('.demo .demo-primary'),
  fsm: click('.demo .demo-primary'),
  evaluate: async (p) => p.locator('.eval input[type=range]').fill('0.35'),
  heatmap: async (p) => p.locator('.heat-grid button').nth(1).click(),
  showtime: async (p) => p.locator('.showtime input[type=checkbox]').first().check(),
  battleship: async (p) => p.getByRole('button', { name: 'Random' }).click(),
  extension: async (p) => {
    await p.getByRole('button', { name: /Copy 2 pkgs/ }).click()
    await p.waitForTimeout(600)
  },
}

// the part of each demo worth a thumbnail; the crop grows around it to 8:5
const FOCUS = {
  planner: '.demo .pchart',
  battleship: '.place',
  sdk: '.sdk-grid',
  heatmap: '.heat-grid',
  network: '.topo',
  graph: '.jobs',
  showtime: '.pchart.st',
  fsm: '.shelter-grid',
}

// grow a box to 8:5 around its centre, kept inside the demo
function crop(f, d) {
  let { x, y, width: w, height: h } = f
  if (w / h > 1.6) {
    const nh = w / 1.6
    y -= (nh - h) / 2
    h = nh
  } else {
    const nw = h * 1.6
    x -= (nw - w) / 2
    w = nw
  }
  w = Math.min(w, d.width)
  h = Math.min(h, d.height, w / 1.6)
  x = Math.max(d.x, Math.min(x, d.x + d.width - w))
  y = Math.max(d.y, Math.min(y, d.y + d.height - h))
  return { x, y, width: w, height: h }
}

// read the tile list straight from src/showcase.ts
const tiles = [...readFileSync('src/showcase.ts', 'utf8').matchAll(/id: '([^']+)', kind: '([^']+)'/g)].map(([, id, kind]) => ({ id, kind }))

const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1000, height: 1400 }, colorScheme: theme, deviceScaleFactor: 2, reducedMotion: 'reduce' })
  for (const t of tiles) {
    const p = await ctx.newPage()
    await p.goto(`${base}/?open=${t.id}&tab=try&demo=${t.kind}`)
    await p.locator('.demo').first().waitFor()
    await p.waitForTimeout(400)
    await SETUP[t.kind]?.(p)
    // let the drawer finish sliding in before measuring
    await p.waitForTimeout(1200)
    const demo = await p.locator('.demo').first().boundingBox()
    const focus = FOCUS[t.kind] && (await p.locator(FOCUS[t.kind]).first().boundingBox())
    const pad = 12
    const box = focus ? crop({ x: focus.x - pad, y: focus.y - pad, width: focus.width + pad * 2, height: focus.height + pad * 2 }, demo) : crop({ x: demo.x, y: demo.y, width: Math.min(demo.width, 700), height: Math.min(demo.width, 700) / 1.6 }, demo)
    const png = join(tmp, `${t.kind}-${theme}.png`)
    await p.screenshot({ path: png, clip: box })
    execFileSync('convert', [png, '-resize', '640x400^', '-gravity', 'northwest', '-extent', '640x400', '-quality', '82', `public/shots/${t.kind}-${theme}.webp`])
    console.log(t.kind, theme)
    await p.close()
  }
  await ctx.close()
}
await browser.close()
