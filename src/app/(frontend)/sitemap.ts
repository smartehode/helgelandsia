import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/getPayload'

const base = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  const collect = async (collection: 'posts' | 'businesses' | 'events', prefix: string) => {
    const { docs } = await payload.find({
      collection,
      where: { _status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
    })
    return docs.map((d: any) => ({
      url: `${base}/${prefix}/${d.slug}`,
      lastModified: d.updatedAt,
    }))
  }

  const [posts, businesses, events] = await Promise.all([
    collect('posts', 'historier'),
    collect('businesses', 'bedrifter'),
    collect('events', 'arrangementer'),
  ])

  return [
    { url: base, lastModified: new Date() },
    { url: `${base}/historier` },
    { url: `${base}/bedrifter` },
    { url: `${base}/arrangementer` },
    ...posts,
    ...businesses,
    ...events,
  ]
}
