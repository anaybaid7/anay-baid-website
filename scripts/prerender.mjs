// Renders the page to HTML at build time and puts it inside #root, so the
// first paint doesn't wait for the JavaScript bundle. The client then
// hydrates the same markup instead of building it from scratch.
import { readFile, writeFile, rm } from 'node:fs/promises'
import { JSDOM } from 'jsdom'

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'https://a2baid.netlify.app/' })
const g = globalThis
for (const k of ['window', 'document', 'navigator', 'location', 'history', 'localStorage', 'HTMLElement', 'Element', 'Node', 'getComputedStyle', 'matchMedia', 'IntersectionObserver', 'MutationObserver', 'requestAnimationFrame']) {
  if (!(k in g) || k === 'navigator') {
    Object.defineProperty(g, k, { value: dom.window[k], configurable: true, writable: true })
  }
}
g.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} })
dom.window.matchMedia = g.matchMedia

const { render } = await import('../dist-ssr/entry-server.js')
const html = render()
const file = 'dist/index.html'
const page = await readFile(file, 'utf8')
if (!page.includes('<div id="root"></div>')) throw new Error('no empty #root in dist/index.html')
await writeFile(file, page.replace('<div id="root"></div>', `<div id="root">${html}</div>`))
await rm('dist-ssr', { recursive: true, force: true })
console.log(`prerendered ${(html.length / 1024).toFixed(0)} kB into ${file}`)
