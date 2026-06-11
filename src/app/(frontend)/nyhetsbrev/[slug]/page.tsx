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

async function getNewsletter(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'newsletters',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const n: any = await getNewsletter(slug)
  if (!n) return {}
  return { title: n.title }
}

export default async function NewsletterPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const n: any = await getNewsletter(slug)
  if (!n) notFound()

  const heroUrl = mediaUrl(n.image, 'hero') ?? mediaUrl(n.image)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {heroUrl && (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src={heroUrl} alt={n.image?.alt ?? n.title} fill className="object-cover" priority />
        </div>
      )}
      <p className="mb-2 text-sm text-muted">
        {n.organization ? `${n.organization} · ` : ''}
        {format(new Date(n.createdAt), 'd. MMMM yyyy', { locale: nb })}
      </p>
      <h1 className="font-serif text-3xl font-bold text-sea">{n.title}</h1>

      <div className="mt-8 prose prose-slate max-w-none">
        <RichText data={n.content} />
      </div>
    </div>
  )
}
