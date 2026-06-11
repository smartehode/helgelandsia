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

async function getPressRelease(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'press-releases',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 1,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p: any = await getPressRelease(slug)
  if (!p) return {}
  return { title: p.title, description: p.excerpt }
}

export default async function PressReleasePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const p: any = await getPressRelease(slug)
  if (!p) notFound()

  const heroUrl = mediaUrl(p.image, 'hero') ?? mediaUrl(p.image)

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {heroUrl && (
        <div className="relative mb-8 aspect-[16/9] overflow-hidden rounded-2xl">
          <Image src={heroUrl} alt={p.image?.alt ?? p.title} fill className="object-cover" priority />
        </div>
      )}
      <p className="mb-2 text-sm text-muted">
        {p.organization ? `${p.organization} · ` : ''}
        {format(new Date(p.createdAt), 'd. MMMM yyyy', { locale: nb })}
      </p>
      <h1 className="font-serif text-3xl font-bold text-sea">{p.title}</h1>
      {p.excerpt && <p className="mt-3 text-lg text-ink/70">{p.excerpt}</p>}

      <div className="mt-8 prose prose-slate max-w-none">
        <RichText data={p.content} />
      </div>

      {(p.contactName || p.contactEmail || p.contactPhone) && (
        <aside className="mt-10 rounded-2xl bg-paper p-6 ring-1 ring-ink/5 space-y-1">
          <h2 className="font-semibold text-sea">Kontakt</h2>
          {p.contactName && <p className="text-sm text-ink">{p.contactName}</p>}
          {p.contactPhone && <p className="text-sm">📞 {p.contactPhone}</p>}
          {p.contactEmail && (
            <p className="text-sm">✉️ <a href={`mailto:${p.contactEmail}`} className="text-sea hover:underline">{p.contactEmail}</a></p>
          )}
        </aside>
      )}
    </div>
  )
}
