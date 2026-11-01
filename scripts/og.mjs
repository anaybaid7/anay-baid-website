// Draws a 1200x630 link preview for each case study into public/og.
// Run after a build (it reads what prerender.mjs wrote), with the demo
// screenshots from shots.mjs in place: node scripts/og.mjs
import { chromium } from 'playwright'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'
import { resolve } from 'node:path'

const cases = JSON.parse(readFileSync('node_modules/.cache/cases.json', 'utf8'))
const font = pathToFileURL(resolve('node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2')).href
const shot = (kind) => pathToFileURL(resolve(`public/shots/${kind}-light.webp`)).href
const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const card = (c) => `<!doctype html><html><head><style>
@font-face { font-family: Archivo; src: url(${font}) format('woff2'); font-weight: 100 900; font-stretch: 62% 125%; }
* { box-sizing: border-box; margin: 0; }
body { width: 1200px; height: 630px; font-family: Archivo; color: #0b1f44; background: #fff; display: grid; grid-template-columns: 560px 1fr; gap: 48px; padding: 64px 0 0 64px; overflow: hidden; border-bottom: 14px solid #2457ff; }
.kicker { color: #2457ff; font-weight: 700; font-size: 24px; }
h1 { margin-top: 14px; font-size: 76px; line-height: 0.95; font-weight: 800; font-stretch: 118%; letter-spacing: -0.02em; }
.sub { margin-top: 16px; font-size: 23px; color: #48557a; }
.result { margin-top: 34px; font-size: 30px; font-weight: 600; }
.result b { color: #2457ff; font-weight: 800; }
.why { margin-top: 14px; font-size: 22px; line-height: 1.35; color: #48557a; }
.foot { position: absolute; left: 64px; bottom: 34px; font-size: 21px; font-weight: 650; color: #5e6987; }
img { width: 640px; border: 2px solid #d2d8e3; margin-top: 30px; }
</style></head><body>
<div>
  <p class="kicker">Case study</p>
  <h1 style="font-size: ${c.name.length > 24 ? 52 : c.name.length > 14 ? 60 : 76}px">${esc(c.name)}</h1>
  <p class="sub">${esc(c.sub)}</p>
  ${c.value ? `<p class="result"><b>${esc(c.value)}</b> ${esc(c.label)}</p>` : ''}
  <p class="why">${esc(c.why)}</p>
</div>
<div>${c.kind ? `<img src="${shot(c.kind)}">` : ''}</div>
<p class="foot">Anay Baid · a2baid.netlify.app/work/${c.slug}</p>
</body></html>`

mkdirSync('public/og', { recursive: true })
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {})
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
for (const c of cases) {
  const file = resolve(`node_modules/.cache/og-${c.slug}.html`)
  writeFileSync(file, card(c))
  await page.goto(pathToFileURL(file).href)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `public/og/case-${c.slug}.png` })
  console.log(c.slug)
}
await browser.close()
