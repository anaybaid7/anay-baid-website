import type { Config, Context } from '@netlify/functions'

const USER = 'anaybaid7'
const SITE = 'anay-baid-website'
const ROUTES: Record<string, string> = {
  repos: `/users/${USER}/repos?sort=pushed&per_page=30`,
  pulls: `/repos/${USER}/${SITE}/pulls?state=closed&sort=updated&direction=desc&per_page=30`,
}

// GET /api/github/:what, a cached proxy for the GitHub data the page shows.
// Visitors' browsers each get 60 unauthenticated calls an hour. Through here
// the edge answers almost every request and GitHub sees a few calls an hour,
// with a token if one is set.
export default async (_req: Request, context: Context) => {
  const path = ROUTES[context.params.what]
  if (!path) return Response.json({ error: 'unknown route' }, { status: 404 })
  const token = Netlify.env.get('GITHUB_TOKEN')
  const r = await fetch(`https://api.github.com${path}`, {
    headers: { Accept: 'application/vnd.github+json', 'User-Agent': `${SITE}-site`, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  })
  if (!r.ok) return Response.json({ error: `GitHub answered ${r.status}` }, { status: 502 })
  return new Response(await r.text(), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=120',
      'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=600, stale-while-revalidate=86400',
    },
  })
}

export const config: Config = { path: '/api/github/:what' }
