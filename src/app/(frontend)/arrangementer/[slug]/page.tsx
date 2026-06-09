import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { RichText } from '@/components/RichText'
import { getPayloadClient } from '@/lib/getPayload'

export const dynamic = 'force-dynamic'

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

async function getEvent(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e: any = await getEvent(slug)
  if (!e) return {}
  return { title: e.title }
}

export default async function EventPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const e: any = await getEvent(slug)
  if (!e) notFound()

  const heroUrl = mediaUrl(e.image, 'hero')

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {heroUrl && (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src={heroUrl} alt={e.image?.alt ?? e.title} fill className="object-cover" priority />
        </div>
      )}
      <h1 className="font-serif text-3xl font-bold text-sea">{e.title}</h1>
      <div className="mt-3 space-y-1 text-slate-600">
        {e.startDate && (
          <p>🗓️ {format(new Date(e.startDate), "EEEE d. MMMM yyyy 'kl.' HH:mm", { locale: nb })}</p>
        )}
        {e.locationName && <p>📍 {e.locationName}</p>}
        {e.organizer?.name && <p>👥 Arrangør: {e.organizer.name}</p>}
        <p>🎟️ {e.free ? 'Gratis' : e.price || 'Se billettlenke'}</p>
      </div>

      <div className="mt-8"><RichText data={e.description} /></div>

      {e.ticketUrl && (
        <a href={e.ticketUrl} target="_blank" rel="noopener"
           className="mt-8 inline-block rounded-full bg-brand-600 px-6 py-3 font-medium text-white hover:bg-brand-700">
          Kjøp billett
        </a>
      )}
    </div>
  )
}
