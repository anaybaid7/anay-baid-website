# anay-baid-website

My personal site, live at https://a2baid.netlify.app

## Editing it

Almost everything comes from `src/data.ts`. Jobs, projects, school, skills and links all live there.

- `src/details.ts` has the diagrams and screens for the detail drawer.
- The resume button serves `public/Anay_Baid_Resume.pdf`. Swap the file and keep the name.
- Logos are in `public/logos/`.

## Running it

```bash
npm install
npm run dev
```

## Checks

```bash
npm run lint
npm test
npm run build
npm run test:e2e
```

CI runs these on every push.

## What's on it

- Intro, then At a glance, experience, projects, education, skills, GitHub activity and contact.
- A timeline of co-op terms. Click one to jump to that job.
- Each job and project has an **Open details** button. The drawer has an overview, an architecture diagram with a step-through of the data flow, screens or a wireframe where there's a UI, an interactive demo on made-up data, and the source behind that demo with syntax highlighting.
- Settings for theme, text size, type width, accent, contrast, motion, a skim view, which section comes first and which sections show. The link remembers them.
- Paste a job posting to see which of my skills it mentions and where I used them.
- Click a skill to show only the work that used it.
- Search (Ctrl K or /), keyboard shortcuts (? lists them), and a page map on wide screens.
- A terminal (the ` key) over the same data, with `ls`, `cat`, `grep`, `open`, `filter`, `theme` and `view`, tab completion and command history. The command logic is in `src/terminal.ts`.
- The resume opens on the page. The same data also builds `resume.txt`, `resume.json` and a contact card.
- Works offline after the first visit.

## Stack

React, TypeScript and Vite, with plain CSS. The GitHub section uses GitHub's public API.

## Deploying

Netlify builds it with `npm run build` and serves `dist`.
