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

const BIDRA = `/logg-inn?fra=${encodeURIComponent('/min-side?type=pressemelding')}`

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
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-semibold text-fjord">Pressemeldinger</h1>
        <Link
          href={BIDRA}
          className="shrink-0 rounded-full border border-fjord/30 px-4 py-2 text-sm font-medium text-fjord transition hover:bg-fjord hover:text-white"
        >
          + Send pressemelding
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 bg-white px-8 py-14 text-center">
          <p className="text-base text-muted">Ingen pressemeldinger er publisert ennå.</p>
          <p className="mt-1 text-sm text-muted/70">Har du en nyhet å dele med Helgeland?</p>
          <Link
            href={BIDRA}
            className="mt-6 inline-block rounded-full bg-fjord px-7 py-3 text-sm font-semibold text-white transition hover:bg-sea"
          >
            Skriv en pressemelding
          </Link>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-ink/5 rounded-xl border border-ink/10 bg-white">
            {docs.map((p: any) => (
              <li key={p.id}>
                <Link
                  href={`/pressemeldinger/${p.slug}`}
                  className="block px-6 py-5 transition hover:bg-fog/60"
                >
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
          <div className="mt-10 text-center">
            <Link href={BIDRA} className="text-sm font-medium text-fjord transition hover:text-sea">
              Har du en nyhet? Send en pressemelding →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
