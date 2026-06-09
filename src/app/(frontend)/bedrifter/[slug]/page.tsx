import { notFound } from 'next/navigation'
import Image from 'next/image'
import type { Metadata } from 'next'
import { RichText } from '@/components/RichText'
import { getPayloadClient } from '@/lib/getPayload'

export const revalidate = 300

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

async function getBusiness(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'businesses',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const b: any = await getBusiness(slug)
  if (!b) return {}
  return { title: b.name, description: b.tagline }
}

const DAYS: Record<string, string> = {
  mon: 'Man', tue: 'Tir', wed: 'Ons', thu: 'Tor', fri: 'Fre', sat: 'Lør', sun: 'Søn',
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const b: any = await getBusiness(slug)
  if (!b) notFound()

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-center gap-4">
        {mediaUrl(b.logo, 'thumbnail') && (
          <Image src={mediaUrl(b.logo, 'thumbnail')!} alt={b.logo?.alt ?? b.name} width={80} height={80} className="rounded-xl object-cover" />
        )}
        <div>
          <h1 className="font-serif text-3xl font-bold text-sea">{b.name}</h1>
          {b.tagline && <p className="text-slate-600">{b.tagline}</p>}
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2">
          <RichText data={b.description} />
        </div>
        <aside className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-black/5">
          <h2 className="font-semibold text-sea">Kontakt</h2>
          {b.address && <p className="text-sm text-slate-600">{b.address}</p>}
          {b.phone && <p className="text-sm">📞 {b.phone}</p>}
          {b.email && <p className="text-sm">✉️ <a className="text-brand-600" href={`mailto:${b.email}`}>{b.email}</a></p>}
          {b.website && <p className="text-sm">🔗 <a className="text-brand-600" href={b.website} target="_blank" rel="noopener">Nettside</a></p>}
          {Array.isArray(b.openingHours) && b.openingHours.length > 0 && (
            <div>
              <h3 className="mt-3 text-sm font-semibold">Åpningstider</h3>
              <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
                {b.openingHours.map((h: any, i: number) => (
                  <li key={i}>{DAYS[h.day] ?? h.day}: {h.opens}–{h.closes}</li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
