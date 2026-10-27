/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { createServer, type Plugin, type ViteDevServer } from 'vite'

interface Formats {
  plainText(): string
  jsonResume(): unknown
  vcard(): string
  personLd(): unknown
}

// load src/resumeFormats.ts through Vite, the same way the app sees it
async function loadFormats(server?: ViteDevServer): Promise<Formats> {
  if (server) return (await server.ssrLoadModule('/src/resumeFormats.ts')) as unknown as Formats
  const tmp = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', server: { middlewareMode: true, hmr: false } })
  try {
    return (await tmp.ssrLoadModule('/src/resumeFormats.ts')) as unknown as Formats
  } finally {
    await tmp.close()
  }
}

// one data file, every format: the build writes the resume as plain text and
// JSON Resume, a contact card, and the search engine data in the page head,
// all from src/data.ts. The dev server serves the same files.
function publishResume(): Plugin {
  const files = (f: Formats): Record<string, [string, string]> => ({
    'resume.txt': ['text/plain; charset=utf-8', f.plainText()],
    'resume.json': ['application/json', JSON.stringify(f.jsonResume(), null, 2) + '\n'],
    'anay-baid.vcf': ['text/vcard', f.vcard()],
  })
  const ld = (f: Formats) => `<script type="application/ld+json">${JSON.stringify(f.personLd())}</script>`
  let built: Formats | undefined
  return {
    name: 'publish-resume',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const name = (req.url ?? '').replace(/^\//, '').split('?')[0]
        if (!['resume.txt', 'resume.json', 'anay-baid.vcf'].includes(name)) return next()
        const [type, body] = files(await loadFormats(server))[name]
        res.setHeader('Content-Type', type)
        res.end(body)
      })
    },
    async buildStart() {
      if (process.env.VITEST) return
      built = await loadFormats()
    },
    generateBundle() {
      if (!built) return
      for (const [fileName, [, source]] of Object.entries(files(built))) this.emitFile({ type: 'asset', fileName, source })
    },
    async transformIndexHtml(html, ctx) {
      const f = ctx.server ? await loadFormats(ctx.server) : built
      if (!f) return html
      return html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, ld(f))
    },
  }
}

// The event page lives in its own folder, so the PWA plugin's relative
// manifest and service worker tags would point inside it and 404. That page
// doesn't need offline support, so they come off it.
const eventPageWithoutPwa: Plugin = {
  name: 'event-page-without-pwa',
  enforce: 'post',
  transformIndexHtml: {
    order: 'post',
    handler: (html, ctx) =>
      ctx.path.includes('purolator-intern-event')
        ? html
            .replace(/<link rel="manifest"[^>]*>/, '')
            .replace(/<script id="vite-plugin-pwa:register-sw"[^>]*><\/script>/, '')
        : html,
  },
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    publishResume(),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Anay Baid',
        short_name: 'Anay Baid',
        description: 'Anay Baid, Computer Science at Waterloo.',
        theme_color: '#fbfbfa',
        background_color: '#fbfbfa',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the app shell + static assets so the site opens instantly
        // and works offline after the first visit — a real service worker,
        // not just a manifest for show.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,pdf}'],
        // the full-size photo is only used for the share image, not the page
        // the event page's screenshots load when that page is opened
        globIgnores: ['**/avatar.png', '**/og.png', '**/logos/*.png', '**/event-shots/**'],
        // Never cache the live GitHub API calls — that data should always be
        // fresh, or explicitly fail, not silently serve a stale snapshot.
        navigateFallbackDenylist: [/^\/api\//, /^\/purolator-intern-event/],
      },
    }),
    eventPageWithoutPwa,
  ],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        event: 'purolator-intern-event/index.html',
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    // e2e/ holds real-browser Playwright specs, run via `npm run test:e2e`,
    // not Vitest — they use @playwright/test's own test/expect and would
    // fail to even parse under jsdom.
    exclude: ['e2e/**', 'node_modules/**'],
  },
})
