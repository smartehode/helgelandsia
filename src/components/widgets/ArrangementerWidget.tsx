import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { getPayloadClient } from '@/lib/getPayload'

interface Props {
  title?: string
  count?: number
  variant?: 'full' | 'kompakt'
  bredde?: string   // '1 kolonne' | '2 kolonner' | 'Full bredde'
}

function osloTodayMidnight(): Date {
  const osloDate = new Date().toLocaleDateString('sv', { timeZone: 'Europe/Oslo' })
  const utcMidnight = new Date(osloDate + 'T00:00:00Z')
  const osloOffsetHours = +new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Oslo', hour: 'numeric', hour12: false,
  }).format(utcMidnight)
  return new Date(utcMidnight.getTime() - osloOffsetHours * 3_600_000)
}

function isOngoing(e: any): boolean {
  if (!e.startDate || new Date(e.startDate) > new Date()) return false
  if (e.endDate) return new Date(e.endDate) > new Date()
  return true
}

function imageUrl(m: any): string | null {
  if (!m || typeof m !== 'object') return null
  return m.sizes?.card?.url ?? m.sizes?.thumbnail?.url ?? m.url ?? null
}

// Trekker ut ren tekst fra Lexical JSON (richText) — kun første avsnitt
function lexicalToText(content: any): string {
  if (!content || typeof content !== 'object') return ''
  const paras = content.root?.children ?? content.children ?? []
  for (const para of paras) {
    const text = (para.children ?? [])
      .filter((n: any) => n.type === 'text' && n.text)
      .map((n: any) => n.text as string)
      .join('')
      .trim()
    if (text) return text
  }
  return ''
}

export async function ArrangementerWidget({
  title = 'Kommende arrangementer',
  count = 5,
  variant = 'full',
  bredde,
}: Props) {
  const payload = await getPayloadClient()
  const nowISO = new Date().toISOString()
  const todayISO = osloTodayMidnight().toISOString()
  let events: any[] = []
  try {
    const res = await payload.find({
      collection: 'events',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { or: [
            { startDate: { greater_than_equal: todayISO } },
            { endDate: { greater_than_equal: nowISO } },
          ]},
        ],
      },
      sort: 'startDate',
      limit: count * 2,
      depth: 1,
    })
    events = res.docs
      .sort((a: any, b: any) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      })
      .slice(0, count)
  } catch { }
  if (!events.length) return null

  // Bred visning: 2 kolonner eller full bredde (ikke smal/1-kolonne)
  const wideMode = variant === 'full' && bredde !== undefined && bredde !== '1 kolonne'

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
          const ongoing = isOngoing(event)
          const imgUrl = wideMode ? imageUrl(event.image) : null
          const ingress = wideMode ? lexicalToText(event.description) : ''

          return (
            <li key={event.id}>
              <Link
                href={`/arrangementer/${event.slug}`}
                className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-fog/60"
              >
                {/* Dato-badge */}
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

                {/* Bilde — etter dato, til venstre for tekst (kun bred modus + bilde finnes) */}
                {imgUrl && (
                  <div className="shrink-0 overflow-hidden rounded-md">
                    <Image
                      src={imgUrl}
                      alt={event.image?.alt ?? event.title}
                      width={160}
                      height={100}
                      className="object-cover"
                      sizes="160px"
                    />
                  </div>
                )}

                {/* Tekst — tar resten av raden */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink transition group-hover:text-sea">
                    {event.title}
                  </p>
                  {variant === 'full' && event.locationName && (
                    <p className="mt-0.5 truncate text-xs text-muted">{event.locationName}</p>
                  )}
                  {ingress && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-muted/60">{ingress}</p>
                  )}
                </div>

                {/* "Nå"-indikator */}
                {ongoing && (
                  <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-sea">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-sea" />
                    Nå
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
