import { getStore } from '@netlify/blobs'
import type { Config } from '@netlify/functions'
import { refresh, type Stored } from '../lib/statcan'

// The scheduled run. StatCan publishes at 8:30 Eastern, and some methods
// return nothing between midnight and 8:30, so this runs late morning.
export default async () => {
  const store = getStore('statcan')
  const before = (await store.get('ecommerce', { type: 'json' })) as Stored | null
  const after = await refresh(before)
  await store.setJSON('ecommerce', after)
}

export const config: Config = { schedule: '15 15 * * *' }
