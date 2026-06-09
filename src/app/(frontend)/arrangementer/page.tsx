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

export default async function EventsPage() {
  const events = await getUpcomingEvents(50)
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-8 font-serif text-3xl font-bold text-sea">Hva skjer</h1>
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
    </div>
  )
}
