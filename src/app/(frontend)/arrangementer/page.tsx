import Link from 'next/link'
import { Card } from '@/components/Card'
import { getUpcomingEvents } from '@/lib/queries'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = {
  title: 'Arrangementer',
  description: 'Kommende arrangementer på Helgeland.',
}

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

const BIDRA = `/logg-inn?fra=${encodeURIComponent('/min-side?type=arrangement')}`

export default async function EventsPage() {
  const events = await getUpcomingEvents(50)
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-serif text-3xl font-bold text-sea">Hva skjer</h1>
        <Link
          href={BIDRA}
          className="shrink-0 rounded-full border border-fjord/30 px-4 py-2 text-sm font-medium text-fjord transition hover:bg-fjord hover:text-white"
        >
          + Legg ut arrangement
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink/20 bg-white px-8 py-14 text-center">
          <p className="text-base text-muted">Ingen kommende arrangementer er lagt ut ennå.</p>
          <p className="mt-1 text-sm text-muted/70">Planlegger du noe? Del det med Helgeland!</p>
          <Link
            href={BIDRA}
            className="mt-6 inline-block rounded-full bg-fjord px-7 py-3 text-sm font-semibold text-white transition hover:bg-sea"
          >
            Legg ut et arrangement
          </Link>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((e: any) => (
              <Card
                key={e.id}
                href={`/arrangementer/${e.slug}`}
                title={e.title}
                imageUrl={mediaUrl(e.image, 'card')}
                imageAlt={e.image?.alt}
                meta={e.startDate ? format(new Date(e.startDate), 'EEEE d. MMM', { locale: nb }) : null}
              />
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link href={BIDRA} className="text-sm font-medium text-fjord transition hover:text-sea">
              Planlegger du noe? Legg ut et arrangement →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
