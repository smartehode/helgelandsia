import { getPayloadClient } from '@/lib/getPayload'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Nyhetsbrev',
  description: 'Nyhetsbrev fra Helgeland.',
}

export default async function NyhetsbrevPage() {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'newsletters',
    where: { _status: { equals: 'published' } },
    sort: '-createdAt',
    limit: 50,
    depth: 0,
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 font-serif text-3xl font-bold text-sea">Nyhetsbrev</h1>
      {docs.length === 0 ? (
        <p className="text-muted">Ingen nyhetsbrev er publisert ennå.</p>
      ) : (
        <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
          {docs.map((n: any) => (
            <li key={n.id}>
              <Link href={`/nyhetsbrev/${n.slug}`} className="block px-6 py-5 hover:bg-ink/[0.02] transition-colors">
                <div>
                  <p className="font-semibold text-ink">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {n.organization ? `${n.organization} · ` : ''}
                    {format(new Date(n.createdAt), 'd. MMM yyyy', { locale: nb })}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
