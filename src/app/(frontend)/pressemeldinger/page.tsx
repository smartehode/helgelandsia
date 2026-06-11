import { getPayloadClient } from '@/lib/getPayload'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Pressemeldinger',
  description: 'Pressemeldinger fra Helgeland.',
}

export default async function PressemeldingPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'press-releases',
    where: { _status: { equals: 'published' } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 font-serif text-3xl font-bold text-sea">Pressemeldinger</h1>
      {docs.length === 0 ? (
        <p className="text-muted">Ingen pressemeldinger er publisert ennå.</p>
      ) : (
        <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
          {docs.map((p: any) => (
            <li key={p.id}>
              <Link href={`/pressemeldinger/${p.slug}`} className="block px-6 py-5 hover:bg-ink/[0.02] transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink">{p.title}</p>
                    <p className="mt-0.5 text-sm text-muted">
                      {p.organization ? `${p.organization} · ` : ''}
                      {format(new Date(p.createdAt), 'd. MMM yyyy', { locale: nb })}
                    </p>
                    {p.excerpt && <p className="mt-1 text-sm text-ink/70 line-clamp-2">{p.excerpt}</p>}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
