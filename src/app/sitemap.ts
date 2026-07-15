import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/getPayload'
import { bizUrl } from '@/lib/slug'

export const dynamic = 'force-dynamic'

const BASE = 'https://helgelandsia.no'

type SitemapEntry = MetadataRoute.Sitemap[0]
type SitemapDoc = { slug: string; updatedAt: string; name?: string; orgnr?: string | null }

async function fetchSlugs(
  payload: any,
  collection: string,
  where: Record<string, any>,
): Promise<SitemapDoc[]> {
  const PAGE_SIZE = 1000
  const all: SitemapDoc[] = []
  let page = 1
  let hasMore = true
  while (hasMore) {
    const result = await payload.find({
      collection,
      where,
      depth: 0,
      limit: PAGE_SIZE,
      page,
      overrideAccess: true,
    })
    for (const d of result.docs) {
      if (d.slug) all.push({ slug: d.slug, updatedAt: d.updatedAt ?? '', name: d.name, orgnr: d.orgnr ?? null })
    }
    hasMore = result.hasNextPage ?? false
    page++
  }
  return all
}

function toEntries(
  slugs: Array<{ slug: string; updatedAt: string }>,
  prefix: string,
  changeFrequency: SitemapEntry['changeFrequency'],
  priority: number,
): MetadataRoute.Sitemap {
  return slugs.map(d => ({
    url: `${BASE}/${prefix}/${d.slug}`,
    lastModified: d.updatedAt ? new Date(d.updatedAt) : undefined,
    changeFrequency,
    priority,
  }))
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE,                         changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/bedrifter`,          changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/stillinger`,         changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/arrangementer`,      changeFrequency: 'daily',   priority: 0.8 },
    { url: `${BASE}/historier`,          changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/anbud`,              changeFrequency: 'daily',   priority: 0.7 },
    { url: `${BASE}/pressemeldinger`,    changeFrequency: 'weekly',  priority: 0.6 },
    { url: `${BASE}/nyhetsbrev`,         changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/nyttig`,             changeFrequency: 'weekly',  priority: 0.5 },
    { url: `${BASE}/om`,                 changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Hent alle slugger parallelt — Promise.allSettled slik at én feilet collection
  // ikke tar ned hele sitemapet.
  const [businesses, posts, events, jobs, pressReleases, newsletters] = await Promise.allSettled([
    fetchSlugs(payload, 'businesses', {
      and: [
        { _status: { equals: 'published' } },
        { showOnPublicListing: { equals: true } },
      ],
    }),
    fetchSlugs(payload, 'posts',           { _status: { equals: 'published' } }),
    fetchSlugs(payload, 'events',          { _status: { equals: 'published' } }),
    fetchSlugs(payload, 'jobs',            { _status: { equals: 'published' } }),
    fetchSlugs(payload, 'press-releases',  { _status: { equals: 'published' } }),
    fetchSlugs(payload, 'newsletters',     { _status: { equals: 'published' } }),
  ])

  // Fallback til tom liste ved feil
  const biz   = businesses.status === 'fulfilled'    ? businesses.value    : []
  const art   = posts.status === 'fulfilled'         ? posts.value         : []
  const evt   = events.status === 'fulfilled'        ? events.value        : []
  const job   = jobs.status === 'fulfilled'          ? jobs.value          : []
  const press = pressReleases.status === 'fulfilled' ? pressReleases.value : []
  const news  = newsletters.status === 'fulfilled'   ? newsletters.value   : []

  // TODO: når bedrifter > 50k, bruk generateSitemaps() + id-parameter for splitting.
  return [
    ...staticUrls,
    ...biz.map(d => ({
      url: `${BASE}${bizUrl({ orgnr: d.orgnr, name: d.name ?? d.slug, slug: d.slug })}`,
      lastModified: d.updatedAt ? new Date(d.updatedAt) : undefined,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
    ...toEntries(art,   'historier',       'monthly', 0.7),
    ...toEntries(evt,   'arrangementer',   'weekly',  0.7),
    ...toEntries(job,   'stillinger',      'weekly',  0.6),
    ...toEntries(press, 'pressemeldinger', 'monthly', 0.5),
    ...toEntries(news,  'nyhetsbrev',      'monthly', 0.5),
  ]
}
