# anay-baid-website

My personal site, live at https://a2baid.netlify.app

One page. Who I am, where I've worked, what I've built, and how to reach me.

## Editing it

Almost everything on the page comes from `src/data.ts`. Jobs, projects, school, skills and links all live there, so that's usually the only file to touch.

- The resume button serves `public/Anay_Baid_Resume.pdf` as is. Swap the file to update it and keep the same name.
- Company and school logos are in `public/logos/`.
- `src/data.schema.ts` checks `data.ts` while you run the dev server, so a broken link or an empty bullet shows up as an error straight away.

## Running it

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm test          # unit tests
npm run build
npm run test:e2e  # browser tests against the built site
```

CI runs all of these on every push.

## What's on it

- Every section has the same shape. Its name sits in a narrow column on the left and stays put while you scroll, and the content runs down the right.
- An "At a glance" section under the intro with graduation date, total co-op time, the skills I've used most, hackathon wins and location. Most of it is worked out from `data.ts`.
- A career timeline drawn to scale from the dates in `data.ts`. Click a term on it to jump to that job.
- Every job and project as a row, dates on the left and the work on the right, each opening with its main result (the `highlight` field in `data.ts`).
- Settings (header button or the , key) for theme, text size, accent colour, motion, and a skim layout that cuts every job and project down to its name, dates and main result. Saved in the browser through a small `useSyncExternalStore` store (`src/settings.ts`), and every setting can also come from the URL, so `/?view=skim&size=l` opens the page that way for whoever clicks it. The panel is a native popover.
- A job posting checker (the M key, or the link under "At a glance"). Paste a posting and it lists what it asks for from my stack and where on the page I've used each one, then can filter the page down to just that. It's plain keyword matching with aliases (`src/match.ts`), runs in the browser, and sends nothing anywhere.
- A stack filter. Pick a skill, or come in on a link like `/?stack=Terraform`, and every job and project that didn't use it fades back. Esc clears it.
- Keyboard shortcuts, J and K to step through jobs and projects, S for skim, T for theme, ? for the full list.
- Theme, layout and filter changes crossfade using the View Transitions API where the browser has it.
- A copy-link button beside every job and project title.
- "How it's built" under the bigger jobs and projects, a row of steps showing how the pieces connect. Hover or click a step to read what it does. The steps live in the `how` field in `data.ts`.
- "Try it here" on Battleship opens the live game in a frame on the page. It only loads when someone asks for it.
- Pointing at a term on the timeline names the job and dates above it.
- A thin reading progress bar at the top, done in CSS with a scroll-driven animation (no JavaScript), and left out in browsers without support.
- An "About this site" section listing the stack, privacy, and how many tests there are. The test counts and commit come from the repo at build time (`vite.config.ts`), so they stay accurate.
- The stack filter dims the timeline too, and "Print this view" prints exactly what's on screen, filtered or in skim, as a clean document with the interactive parts left out.
- The footer shows the time in Toronto, and the visitor's own time when they're somewhere else.
- One data file, every format. At build time a small Vite plugin (`publishResume` in `vite.config.ts`) writes `resume.txt`, `resume.json` (JSON Resume) and `anay-baid.vcf` next to the page, and puts schema.org data in the page head, all from `src/resumeFormats.ts`. The dev server serves the same files. `curl https://a2baid.netlify.app/resume.txt` prints the resume in a terminal.
- A grid of my public GitHub activity for the last 13 weeks, plus my most recently pushed repos, both pulled live from GitHub.
- A light and dark switch that remembers your choice.
- A search menu (Cmd/Ctrl+K or "/") that jumps to any job or project, copies my email, opens the resume, and so on.
- Skills as a sortable table worked out from the work itself, never self-rated. For each skill on the resume it shows months in co-op roles that used it, how many projects used it, when it was last used, and where (`src/skillStats.ts`). Click a skill to filter the page to that work. Skills with nothing tagged yet are listed underneath.
- The resume opens right on the page, with a download button. Phones get the PDF in a new tab instead.
- Links straight to a job or project, like `/#job-iotum` or `/#project-pashu`.
- A line at the bottom that says when I'm likely to reply, based on the time in Toronto.
- A preview image for when the link gets shared (`public/og.png`).
- Printing the page gives a clean one-page summary with every job listed.

## Speed and accessibility

Lighthouse on a throttled mobile profile scores 92 to 99 for performance and 100 for accessibility, best practices and SEO. Things that keep it there:

- The photo and logos are small WebP files, the photo with a 2x version for sharp screens.
- The name's opening animation uses a transform, not an animated font width, so nothing re-lays-out while it runs.
- The GitHub section only loads once you scroll near it.
- Every colour pair passes WCAG AA contrast, in both light and dark.

## Stack

React, TypeScript and Vite. Archivo, bundled from npm so there's no request to Google Fonts. The "Recently on GitHub" list is fetched live from GitHub's public API, and falls back to a plain link if that fails. It's also a PWA, so it works offline after the first visit.

## Deploying

Netlify builds it with `npm run build` and serves `dist`. There's also a Dockerfile (nginx), a GitHub Pages workflow, Terraform for S3 and CloudFront in `infra/`, and Kubernetes manifests in `k8s/`, none of which are what's live right now.
