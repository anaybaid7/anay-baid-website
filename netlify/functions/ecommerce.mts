import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'
import { refresh, type Stored } from '../lib/statcan'

const DAY = 864e5

// GET /api/ecommerce returns the stored series and its run log. The daily
// job keeps it fresh; if nothing has been stored yet, or the copy is more
// than two days old, this request runs the pipeline itself first.
export default async () => {
  const store = getStore('statcan')
  let data = (await store.get('ecommerce', { type: 'json' })) as Stored | null
  const age = data?.runs[0] ? Date.now() - Date.parse(data.runs[0].at) : Infinity
  if (!data || age > 2 * DAY) {
    try {
      data = await refresh(data)
      await store.setJSON('ecommerce', data)
    } catch (e) {
      return Response.json({ error: `Statistics Canada didn't answer: ${(e as Error).message}` }, { status: 502 })
    }
  }
  return Response.json(data, {
    headers: {
      // the edge serves most requests, the function wakes up about hourly
      'Cache-Control': 'public, max-age=300',
      'Netlify-CDN-Cache-Control': 'public, durable, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}

export const config: Config = { path: '/api/ecommerce' }
