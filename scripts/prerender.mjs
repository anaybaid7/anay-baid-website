// Renders the page to HTML at build time and puts it inside #root, so the
// first paint doesn't wait for the JavaScript bundle. The client then
// hydrates the same markup instead of building it from scratch.
import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { JSDOM } from 'jsdom'
import Beasties from 'beasties'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://a2baid.netlify.app/' })
const g = globalThis
for (const k of ['window', 'document', 'navigator', 'location', 'history', 'localStorage', 'HTMLElement', 'Element', 'Node', 'getComputedStyle', 'matchMedia', 'IntersectionObserver', 'MutationObserver', 'requestAnimationFrame']) {
  if (!(k in g) || k === 'navigator') {
    Object.defineProperty(g, k, { value: dom.window[k], configurable: true, writable: true })
  }
}
g.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
dom.window.matchMedia = g.matchMedia

const { render, cases } = await import('../dist-ssr/entry-server.js')
const html = render()
const file = 'dist/index.html'
const page = await readFile(file, 'utf8')
if (!page.includes('<div id="root"></div>')) throw new Error('no empty #root in dist/index.html')
// Inline the CSS the first screen uses and load the rest without blocking
// paint. Rules keyed on the settings attributes (theme, accent, size and so
// on) are always kept, since those are set by a script before first paint.
const beasties = new Beasties({ path: 'dist', publicPath: './', preload: 'swap', pruneSource: false, reduceInlineStyles: false, allowRules: [/\[data-/, /prefers-color-scheme/, /prefers-reduced-motion/], logLevel: 'warn' })
// beasties also preloads the web fonts the inlined CSS uses
const full = await beasties.process(page.replace('<div id="root"></div>', `<div id="root">${html}</div>`))
await writeFile(file, full)

// One page per case study, so a shared /work/<name>/ link previews that case
// study instead of the whole site. The app opens the case study from the path.
const SITE = 'https://a2baid.netlify.app'
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const meta = (html, re, value) => {
  if (!re.test(html)) throw new Error(`no ${re} in index.html`)
  return html.replace(re, (m) => m.replace(/content="[^"]*"/, `content="${esc(value)}"`))
}
for (const c of cases()) {
  // the build links assets relatively, which would resolve under /work/<name>/
  // and registers the service worker relative to the page, so point it at the root
  let out = full
    .replace(/(src|href)="\.\//g, '$1="/')
    .replace(
      /<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/,
      `<script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('/sw.js', { scope: '/' }))</script>`,
    )
  out = out.replace(/<title>[^<]*<\/title>/, `<title>${esc(c.title)}</title>`)
  out = meta(out, /<meta name="description"[^>]*>/, c.description)
  for (const k of ['og:title', 'twitter:title']) out = meta(out, new RegExp(`<meta (property|name)="${k}"[^>]*>`), c.title)
  for (const k of ['og:description', 'twitter:description']) out = meta(out, new RegExp(`<meta (property|name)="${k}"[^>]*>`), c.description)
  for (const k of ['og:image', 'twitter:image']) out = meta(out, new RegExp(`<meta (property|name)="${k}"[^>]*>`), `${SITE}/og/case-${c.slug}.png`)
  out = meta(out, /<meta property="og:url"[^>]*>/, `${SITE}${c.path}`)
  out = out.replace('<meta property="og:type" content="website" />', '<meta property="og:type" content="article" />')
  await mkdir(`dist${c.path}`, { recursive: true })
  await writeFile(`dist${c.path}index.html`, out)
}
// scripts/og.mjs draws the preview images from this
await mkdir('node_modules/.cache', { recursive: true })
await writeFile('node_modules/.cache/cases.json', JSON.stringify(cases(), null, 2))
console.log(`wrote ${cases().length} case study pages`)
await rm('dist-ssr', { recursive: true, force: true })
console.log(`prerendered ${(html.length / 1024).toFixed(0)} kB into ${file}`)
