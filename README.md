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

- An "At a glance" panel right under the intro with graduation date, what I'm looking for, total co-op time, the skills I've used most, hackathon wins and location. Most of it is worked out from `data.ts`.
- Numbers that show results in the bullets ("40%", "10 to 20x", "100K+") are bolded so they stand out when skimming.
- A career timeline drawn to scale from the dates in `data.ts`. Hover or click a term on it, or a company in the list, and that job's details show up. Up and down arrows work too.
- Projects, with the live Battleship game up top.
- A grid of my public GitHub activity for the last 13 weeks, plus my most recently pushed repos, both pulled live from GitHub.
- A light and dark switch that remembers your choice.
- A search menu (Cmd/Ctrl+K or "/") that jumps to any job or project, copies my email, opens the resume, and so on.
- Skills you can click to see exactly which jobs and projects used them, worked out from the tech tags in `data.ts`.
- The resume opens right on the page, with a download button. Phones get the PDF in a new tab instead.
- Links straight to a job or project, like `/#job-iotum` or `/#project-pashu`.
- A line at the bottom that says when I'm likely to reply, based on the time in Toronto.
- A preview image for when the link gets shared (`public/og.png`).
- Printing the page gives a clean one-page summary with every job listed.

## Stack

React, TypeScript and Vite. Archivo, bundled from npm so there's no request to Google Fonts. The "Recently on GitHub" list is fetched live from GitHub's public API, and falls back to a plain link if that fails. It's also a PWA, so it works offline after the first visit.

## Deploying

Netlify builds it with `npm run build` and serves `dist`. There's also a Dockerfile (nginx), a GitHub Pages workflow, Terraform for S3 and CloudFront in `infra/`, and Kubernetes manifests in `k8s/`, none of which are what's live right now.
