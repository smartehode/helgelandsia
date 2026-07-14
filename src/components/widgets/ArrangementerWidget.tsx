import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { getPayloadClient } from '@/lib/getPayload'

interface Props {
  title?: string
  count?: number
  variant?: 'full' | 'kompakt'
}

export async function ArrangementerWidget({ title = 'Kommende arrangementer', count = 5, variant = 'full' }: Props) {
  const payload = await getPayloadClient()
  const now = new Date().toISOString()
  let events: any[] = []
  try {
    const res = await payload.find({
      collection: 'events',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { startDate: { greater_than_equal: now } },
        ],
      },
      sort: 'startDate',
      limit: count,
      depth: 0,
    })
    events = res.docs
  } catch { }
  if (!events.length) return null

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <Link href="/arrangementer" className="text-xs font-medium text-sea transition hover:underline">
          Se alle →
        </Link>
      </div>
      <ul className="divide-y divide-ink/5">
        {events.map((event: any) => {
          const startDt = event.startDate ? new Date(event.startDate) : null
          return (
            <li key={event.id}>
              <Link
                href={`/arrangementer/${event.slug}`}
                className="group flex items-center gap-4 px-4 py-3.5 transition hover:bg-fog/60"
              >
                {startDt && (
                  <div className="w-8 shrink-0 text-center">
                    <span className="block font-serif text-xl font-bold leading-none text-sea">
                      {format(startDt, 'd', { locale: nb })}
                    </span>
                    <span className="block text-[9px] font-semibold uppercase tracking-wide text-muted">
                      {format(startDt, 'MMM', { locale: nb })}
                    </span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink transition group-hover:text-sea">
                    {event.title}
                  </p>
                  {variant === 'full' && event.location && (
                    <p className="mt-0.5 truncate text-xs text-muted">{event.location}</p>
                  )}
                </div>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
