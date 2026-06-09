import { Card } from '@/components/Card'
import { getPayloadClient } from '@/lib/getPayload'
import type { Metadata } from 'next'

export const revalidate = 300
export const metadata: Metadata = {
  title: 'Bedrifter',
  description: 'Næringsliv og bedrifter på Helgeland.',
}

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

export default async function BusinessesPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'businesses',
    where: { _status: { equals: 'published' } },
    sort: 'name',
    limit: 50,
    depth: 1,
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-serif text-3xl font-bold text-sea">Næringsliv</h1>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((b: any) => (
          <Card
            key={b.id}
            href={`/bedrifter/${b.slug}`}
            title={b.name}
            excerpt={b.tagline}
            imageUrl={mediaUrl(b.logo, 'card')}
            imageAlt={b.logo?.alt}
            meta={b.category?.title}
          />
        ))}
      </div>
    </div>
  )
}
