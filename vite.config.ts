/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Anay Baid, Portfolio',
        short_name: 'Anay Baid',
        description: 'Portfolio for Anay Baid, a Waterloo CS co-op software engineer.',
        theme_color: '#2b1f4d',
        background_color: '#2b2050',
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
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,pdf}'],
        // Never cache the live GitHub API calls — that data should always be
        // fresh, or explicitly fail, not silently serve a stale snapshot.
        navigateFallbackDenylist: [/^\/api\//],
      },
    }),
  ],
  base: './',
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
