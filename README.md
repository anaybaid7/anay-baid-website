# Anay Baid, Portfolio

A retro CRT-monitor-styled portfolio, click-to-navigate. React + TypeScript + Vite + Tailwind CSS v4.

## Stack

- **Vite** + **React 19** + **TypeScript**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Verdana**, the display/body typeface, system font (no web font request)
- **Web Audio API** for the PLAY/STOP button, a genuine in-browser chiptune arpeggio loop built from raw oscillator and gain nodes, no external audio file
- **cmdk** command palette (⌘K / Ctrl+K, or the "COMMANDS" button in the status bar), the same fuzzy-match primitive behind Linear/Vercel/Raycast's web UIs, wired to real navigation, the resume download, the music toggle, and external links. It's a second, keyboard-first way to use the entire site, not a decoration.
- **View Transitions API** for tab switches, a native, no-library cross-fade between panels (`document.startViewTransition`, feature-detected; browsers without it, and anyone with `prefers-reduced-motion` on, just get the instant DOM swap they'd have had anyway).
- **Zod** runtime schema validation (`src/data.schema.ts`), validates the shape of `src/data.ts` (real URLs, non-empty bullets, valid email, local asset paths that actually exist, etc.) at module load in development, so a bad hand-edit fails loudly and immediately instead of shipping silently. Fully tree-shaken out of the production bundle (`import.meta.env.DEV`-gated dynamic import), zero runtime cost for site visitors.
- **PWA**, installable and offline-capable via `vite-plugin-pwa` (Workbox-generated service worker + `manifest.webmanifest`). Precaches the app shell, the company logos, and the resume PDF itself, so a repeat visit loads instantly and works with no connection; the live GitHub API call is explicitly excluded from that cache so it's always fresh data or an honest failure, never stale.
- **Live GitHub API integration**, the Home page fetches your most recently updated public repos straight from `api.github.com` (unauthenticated, no key needed) and degrades to a plain profile link if the request fails.
- **Full WAI-ARIA Tabs pattern** on the nav (`role="tablist"`/`"tab"`/`"tabpanel"`, `aria-selected`, `aria-controls`, roving `tabindex`, arrow-key and Home/End keyboard navigation with wraparound), screen-reader and keyboard users get the same navigation everyone else does.
- **localStorage** persistence of the active tab (wrapped in try/catch for private-browsing environments) and a `document.title` that updates per tab.
- Real **SEO**: Open Graph tags, Twitter Card tags, a JSON-LD `Person` schema block in `index.html`, plus `robots.txt` and `sitemap.xml`.
- Respects `prefers-reduced-motion`, the power-light pulse, equalizer-bar, and view-transition animations are all disabled outright for anyone who has that OS setting on.
- **Vitest + React Testing Library**, 28 component/unit tests covering data integrity (`src/data.test.ts`, including that every logo file and the resume PDF actually exist on disk), tab navigation/keyboard behavior/ARIA state/command palette (`src/App.test.tsx`), and the Projects tech-filter logic (`src/pages/Projects.test.tsx`).
- **Playwright**, a separate end-to-end suite (`e2e/portfolio.spec.ts`) that drives a real Chromium browser against the actual built site: clicking through every tab, downloading the real resume PDF, opening the command palette with a real keyboard shortcut, confirming the service worker registers, and validating the web app manifest. This is deliberately a different tool from Vitest, it catches the class of bug that only exists in a real browser against real built output (a real file download, a real SW registration), which a jsdom unit test structurally cannot.
- **oxlint** for linting.
- **A `<ErrorBoundary>`** (`src/components/ErrorBoundary.tsx`) around the whole app and, separately, around each tab's panel. A render bug used to mean a blank white screen with nothing recoverable; now a crash confined to one tab shows an in-theme "SIGNAL LOST" fallback with a retry button, and switching tabs away and back resets that boundary automatically (it's keyed on the active tab). Covered by its own test file.
- **Docker**: a multi-stage `Dockerfile` (Node build stage, nginx runtime stage) plus `docker/nginx.conf` (gzip, security headers, tiered cache-control, SPA fallback) and `docker-compose.yml`. See "Running with Docker" below.
- **Terraform** (`infra/`): AWS S3 + CloudFront (Origin Access Control, not the legacy OAI pattern) as a second, parallel deploy target to Netlify, demonstrating the current recommended pattern for static hosting on AWS. See `infra/README.md`.
- **Kubernetes manifests** (`k8s/`): Deployment, Service, and an HPA for the same Docker image, written to show orchestration familiarity; `k8s/deployment.yaml` is upfront in its own comments that Kubernetes isn't actually the right tool for a single static site (S3+CloudFront or a plain container host is simpler here), it's what this would look like as one service in a larger cluster.
- **CI** (`.github/workflows/ci.yml`): lint, unit tests, typecheck+build, Playwright e2e, and a Docker build, on every push and PR. A separate `.github/workflows/infra-validate.yml` runs `terraform fmt -check` and a credential-free `terraform validate` whenever `infra/` changes.

## Structure

Four tabs (Home, Resume, Projects, Hire Me), each with its own accent color that carries through everything on that tab. The whole thing is state-driven React, no routing library, a single static page.

All content lives in `src/data.ts`, that's the one file to edit to update anything: job history, projects, education, links, bio copy, and the Technical Skills section. It's validated against `src/data.schema.ts` in dev, so a typo that breaks a real invariant (an empty bullet, a malformed link, a logo path that doesn't exist) fails immediately with a clear error instead of shipping.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The Zod validation path is stripped from the production bundle entirely (dead code eliminated via `import.meta.env.DEV`), and `vite-plugin-pwa` generates the service worker and manifest as part of this step.

## Testing and linting

```bash
npm run test       # vitest, component/unit tests, one-shot
npm run test:watch
npm run test:e2e   # playwright, real-browser end-to-end tests against a built preview
npm run lint       # oxlint
```

`test:e2e` builds nothing itself, run `npm run build` first, or just let it start `vite preview` on its own (configured in `playwright.config.ts`).

## Running with Docker

```bash
docker compose up --build   # site at http://localhost:8080
```

or without compose:

```bash
docker build -t anay-portfolio .
docker run -p 8080:80 anay-portfolio
```

The image is a multi-stage build: an `npm ci && npm run build` stage on
`node:22-alpine`, then just the built `dist/` output copied into
`nginx:1.27-alpine`. The final image never contains `node_modules`, source
files, or a Node runtime, only static files and nginx.

**A note on verifying this in the sandbox this was built in**: the
Dockerfile, `docker/nginx.conf`, `.dockerignore`, and `docker-compose.yml`
were all written to current (2026) best practice and reviewed carefully, but
`docker build` could not actually be run to completion in the environment
this repo was assembled in, its outbound network policy allows the
`npm`/`pypi`/`crates`/`go`/`jsr` package registries but not arbitrary
container registry pulls (`registry-1.docker.io` returned `403 Forbidden`
on the base-image pull, confirmed via that environment's own proxy status
endpoint, not a bug in this Dockerfile). `.github/workflows/ci.yml`'s
`docker` job builds this image on every push, so it is exercised in CI even
though it wasn't hand-verified locally first. If you build it locally and
hit anything, it's worth an issue, this one genuinely wasn't run end-to-end
before being committed.

## Deploying

- **Vercel**: import the repo at vercel.com/new, auto-detects Vite.
- **Netlify**: import the repo, build command `npm run build`, publish directory `dist`.
- **GitHub Pages**: workflow at `.github/workflows/deploy.yml`, push to `main`, enable Pages (source: GitHub Actions).
- **AWS (S3 + CloudFront)**: `terraform apply` in `infra/`, see `infra/README.md`. A from-scratch, IaC-managed alternative to the above, not currently what's live.
- **Kubernetes**: `kubectl apply -f k8s/` against a cluster that already has the image pushed to a registry it can pull from (update the `image:` field in `k8s/deployment.yaml` first). Mostly here to demonstrate the pattern; overkill for a single static site.

## Resume PDF

`public/Anay_Baid_Resume.pdf` is the actual PDF Anay submits through WaterlooWorks, not a re-creation of it. Every download button (Resume page, Hire Me page, command palette) triggers a real download of this exact file via `src/downloadResume.ts`. To update it, replace that file with the new version, keeping the same filename, and keep `src/data.ts` in sync by hand so the on-page content (experience, education, Technical Skills) still matches what's in the PDF. An earlier version of this generated a PDF client-side from `data.ts` with jsPDF; that was a fun technical exercise, but it necessarily drifted from the true source document (no hyperlinked contact icons, no Technical Skills section, different layout), so it was dropped in favor of serving the real file, which also cut the production bundle from about 920KB to under 300KB by removing jsPDF, html2canvas, and dompurify entirely.

## Command palette

Press **⌘K** (Mac) or **Ctrl+K** (Windows/Linux), or click **COMMANDS** in the status bar. It can navigate to any tab, download the resume, email you, toggle the chiptune loop, or open your GitHub/LinkedIn/Devpost, all fuzzy-searchable. Add a new command by adding a `<Command.Item>` in `src/components/CommandPalette.tsx`.

## PWA icons

`public/pwa-192.png`, `public/pwa-512.png`, and `public/pwa-maskable-512.png` are rasterized from `public/icon-source.svg`. Regenerate them (e.g. via a headless browser screenshot or an SVG-to-PNG tool) if you change the source icon.

## Company logos

`public/logos/*.png` hold the real employer and university marks shown on the Resume page (Purolator, Iotum, Nationwide Appraisals, Cineplex, and the University of Waterloo shield). Each `ExperienceEntry` and the `education` object in `src/data.ts` reference one by root-relative path, and `src/data.test.ts` fails the build if a referenced file doesn't actually exist in `public/`.

## A note on the GitHub widget in dev sandboxes

The live GitHub-repos fetch on the Home page calls `api.github.com` directly from the browser, which GitHub serves with `Access-Control-Allow-Origin: *` on public unauthenticated GET requests, so it works in a real browser with no proxy in front of it. Some locked-down CI/sandbox environments block outbound calls to arbitrary hosts (only allowlisted ones), which will surface as a fetch failure purely in that environment. The component already handles this gracefully with a fallback UI; it's not a bug in the app. (The Playwright suite's "no console errors" test accounts for this explicitly rather than silencing all errors.)

## Before going live

- `og:url` / Twitter Card URLs, the JSON-LD `url`, and `robots.txt` / `sitemap.xml` all already point at `https://a2baid.netlify.app` (from the resume). Update them if the real deployed domain ends up different.
