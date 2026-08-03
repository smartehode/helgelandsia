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
  // Foretrekker original for kort-bredde; bruker sizes som fallback
  return m.url ?? m.sizes?.card?.url ?? m.sizes?.thumbnail?.url ?? null
}

// Trekker ut første avsnitt som ren tekst fra Lexical JSON
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

// ─── Kortkomponent (bred modus) ──────────────────────────────────────────────

function EventCard({ event }: { event: any }) {
  const startDt = event.startDate ? new Date(event.startDate) : null
  const ongoing  = isOngoing(event)
  const imgUrl   = imageUrl(event.image)
  const ingress  = lexicalToText(event.description)

  return (
    <Link
      href={`/arrangementer/${event.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ink/10 bg-white transition hover:shadow-md"
    >
      {/* Bildeflate 16:10 */}
      <div className="relative aspect-[16/10] overflow-hidden bg-fjord/10">
        {imgUrl ? (
          <Image
            src={imgUrl}
            alt={event.image?.alt ?? event.title}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(min-width: 640px) 50vw, 100vw"
          />
        ) : (
          /* Plassholder — bevisst, ikke tomt hull */
          <div className="flex h-full w-full items-center justify-center">
            <svg
              className="h-12 w-12 text-fjord/20"
              fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
            </svg>
          </div>
        )}

        {/* Dato-badge: rivekalender-stil — nedre venstre */}
        {startDt && (
          <div className="absolute bottom-2 left-2 w-11 overflow-hidden rounded-lg bg-white shadow-md ring-1 ring-black/5">
            <div className="bg-fjord py-[3px] text-center">
              <span className="block text-[8px] font-bold uppercase tracking-widest text-white/90">
                {format(startDt, 'MMM', { locale: nb })}
              </span>
            </div>
            <div className="py-[3px] text-center">
              <span className="block font-serif text-[18px] font-bold leading-tight text-fjord">
                {format(startDt, 'd')}
              </span>
            </div>
          </div>
        )}

        {/* "Pågår nå"-badge — øvre høyre */}
        {ongoing && (
          <div className="absolute right-2 top-2">
            <span className="flex items-center gap-1 rounded-full bg-sea px-2 py-0.5 text-[10px] font-semibold text-white shadow">
              <span className="h-1.5 w-1.5 rounded-full bg-white/80" />
              Pågår nå
            </span>
          </div>
        )}
      </div>

      {/* Tekstinnhold */}
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 text-[15px] font-medium leading-snug text-ink transition group-hover:text-sea">
          {event.title}
        </p>
        {event.locationName && (
          <p className="mt-1 line-clamp-1 text-xs text-muted">{event.locationName}</p>
        )}
        {ingress && (
          <p className="mt-1 line-clamp-1 text-xs text-muted/60">{ingress}</p>
        )}
      </div>
    </Link>
  )
}

// ─── Listekomponent (smal/1-kolonne) — uendret ───────────────────────────────

function EventListItem({ event, variant }: { event: any; variant: 'full' | 'kompakt' }) {
  const startDt = event.startDate ? new Date(event.startDate) : null
  const ongoing  = isOngoing(event)

  return (
    <li>
      <Link
        href={`/arrangementer/${event.slug}`}
        className="group flex items-center gap-3 px-4 py-2.5 transition hover:bg-fog/60"
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
          {variant === 'full' && event.locationName && (
            <p className="mt-0.5 truncate text-xs text-muted">{event.locationName}</p>
          )}
        </div>
        {ongoing && (
          <span className="shrink-0 flex items-center gap-1 text-[10px] font-semibold text-sea">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-sea" />
            Nå
          </span>
        )}
      </Link>
    </li>
  )
}

// ─── Hoved-widget ─────────────────────────────────────────────────────────────

export async function ArrangementerWidget({
  title = 'Kommende arrangementer',
  count = 5,
  variant = 'full',
  bredde,
}: Props) {
  const payload = await getPayloadClient()
  const nowISO   = new Date().toISOString()
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

  // Kortgrid kun i full variant med bred blokk (2 kolonner eller Full bredde)
  const wideMode = variant === 'full' && bredde !== undefined && bredde !== '1 kolonne'

  if (wideMode) {
    return (
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <Link href="/arrangementer" className="text-xs font-medium text-sea transition hover:underline">
            Se alle →
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      </div>
    )
  }

  // Tekstliste — 1-kolonne-sone og kompakt variant
  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <Link href="/arrangementer" className="text-xs font-medium text-sea transition hover:underline">
          Se alle →
        </Link>
      </div>
      <ul className="divide-y divide-ink/5">
        {events.map(event => (
          <EventListItem key={event.id} event={event} variant={variant} />
        ))}
      </ul>
    </div>
  )
}
