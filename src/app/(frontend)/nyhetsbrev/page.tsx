import { getPayloadClient } from '@/lib/getPayload'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NyhetsbrevPaamelding } from '@/components/NyhetsbrevPaamelding'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Uka på Helgeland — nyhetsbrev',
  description: 'Meld deg på det ukentlige nyhetsbrevet fra Helgelandsia.',
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

      {/* Påmeldingsseksjon */}
      <div className="mb-12 rounded-2xl bg-fjord/5 px-6 py-8 ring-1 ring-fjord/10">
        <h1 className="mb-2 font-serif text-3xl font-semibold text-fjord">
          Uka på Helgeland
        </h1>
        <p className="mb-1 text-ink/80">
          Ukentlig oppsummering av det viktigste som skjer i regionen — arrangementer,
          anbud, nyheter og stillinger, levert rett i innboksen din.
        </p>
        <p className="mb-6 text-sm font-medium text-sea">Kommer snart — meld deg på nå!</p>
        <NyhetsbrevPaamelding fra="/nyhetsbrev" />
      </div>

      {/* Arkiv */}
      {docs.length > 0 && (
        <>
          <h2 className="mb-4 font-serif text-xl font-semibold text-fjord">Arkiv</h2>
          <ul className="divide-y divide-ink/5 rounded-xl border border-ink/10 bg-white">
            {docs.map((n: any) => (
              <li key={n.id}>
                <Link
                  href={`/nyhetsbrev/${n.slug}`}
                  className="block px-6 py-5 transition hover:bg-fog/60"
                >
                  <p className="font-semibold text-ink">{n.title}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {n.organization ? `${n.organization} · ` : ''}
                    {format(new Date(n.createdAt), 'd. MMM yyyy', { locale: nb })}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
