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

const BIDRA = `/logg-inn?fra=${encodeURIComponent('/min-side?type=nyhetsbrev')}`

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
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold text-fjord">Nyhetsbrev</h1>
        <Link
          href={BIDRA}
          className="shrink-0 rounded-full border border-fjord/30 px-4 py-2 text-sm font-medium text-fjord transition hover:bg-fjord hover:text-white"
        >
          + Send nyhetsbrev
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 bg-white px-8 py-14 text-center">
          <p className="text-base text-muted">Ingen nyhetsbrev er publisert ennå.</p>
          <p className="mt-1 text-sm text-muted/70">Vil du nå ut til folk på Helgeland?</p>
          <Link
            href={BIDRA}
            className="mt-6 inline-block rounded-full bg-fjord px-7 py-3 text-sm font-semibold text-white transition hover:bg-sea"
          >
            Send et nyhetsbrev
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-ink/5 rounded-xl border border-ink/10 bg-white">
            {docs.map((n: any) => (
              <li key={n.id}>
                <Link
                  href={`/nyhetsbrev/${n.slug}`}
                  className="block px-6 py-5 transition hover:bg-fog/60"
                >
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
          <div className="mt-10 text-center">
            <Link href={BIDRA} className="text-sm font-medium text-fjord transition hover:text-sea">
              Vil du nå ut? Send et nyhetsbrev →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
