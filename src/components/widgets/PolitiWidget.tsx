import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import type { WidgetVariant } from './PowerPriceWidget'

interface Props {
  title?: string
  count?: number
  variant?: WidgetVariant
}

interface PoliceMsg {
  id: string
  threadId: string
  category: string
  district: string
  municipality: string
  area: string
  isActive: boolean
  text: string
  createdOn: string
  isEdited: boolean
}

// Lowercase for case-insensitiv match mot API-verdier.
// Meløy (1837) er Salten — IKKE Helgeland, og er bevisst utelatt.
const HELGELAND_KOMMUNER = new Set([
  'brønnøy', 'sømna', 'bindal', 'vevelstad',
  'herøy', 'alstahaug', 'dønna', 'leirfjord',
  'vefsn', 'grane', 'hattfjelldal',
  'hemnes', 'rana', 'nesna',
  'lurøy', 'rødøy', 'træna', 'vega',
])

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diffMs / 60_000)
  if (m < 2) return 'nettopp'
  if (m < 60) return `for ${m} min siden`
  const h = Math.floor(diffMs / 3_600_000)
  if (h < 24) return `for ${h} t siden`
  return format(new Date(iso), 'd. MMM HH:mm', { locale: nb })
}

const CAT_CLS: Record<string, string> = {
  Trafikk:       'bg-amber-50 text-amber-700',
  'Ro og orden': 'bg-blue-50 text-blue-700',
  Voldshendelse: 'bg-red-50 text-red-700',
  Redning:       'bg-orange-50 text-orange-700',
  Brann:         'bg-red-100 text-red-800',
  Ulykke:        'bg-orange-50 text-orange-700',
  Tyveri:        'bg-purple-50 text-purple-700',
  Innbrudd:      'bg-purple-50 text-purple-700',
  Savnet:        'bg-pink-50 text-pink-700',
  Sjø:           'bg-sky-50 text-sky-700',
  Arrangement:   'bg-green-50 text-green-700',
  Dyr:           'bg-lime-50 text-lime-700',
  Skadeverk:     'bg-stone-100 text-stone-700',
  Vær:           'bg-sky-50 text-sky-700',
}

export async function PolitiWidget({
  title = 'Politiloggen Helgeland',
  count = 5,
  variant = 'full',
}: Props) {
  let msgs: PoliceMsg[] = []

  try {
    const res = await fetch(
      'https://api.politiloggen.politiet.no/messages?Districts=Nordland&Take=50',
      {
        headers: { 'User-Agent': 'helgelandsia.no' },
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 300 },
      },
    )
    if (!res.ok) return null
    const data = await res.json() as { messages: PoliceMsg[] }

    // API leverer nyeste meldinger først.
    // Dedup på threadId — beholder kun nyeste melding per hendelse (inkl. oppdateringer).
    const seen = new Set<string>()
    for (const msg of data.messages ?? []) {
      if (!HELGELAND_KOMMUNER.has(msg.municipality?.toLowerCase() ?? '')) continue
      if (seen.has(msg.threadId)) continue
      seen.add(msg.threadId)
      msgs.push(msg)
      if (msgs.length >= count) break
    }
  } catch {
    return null
  }

  if (!msgs.length) return null

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
      <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <a
          href="https://www.politiet.no/politiloggen"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] text-muted transition hover:text-sea"
        >
          Kilde: Politiet (NLOD 2.0) ↗
        </a>
      </div>
      <ul className="divide-y divide-ink/5">
        {msgs.map(msg => {
          const catCls = CAT_CLS[msg.category] ?? 'bg-fog text-muted'
          const location = msg.area ? `${msg.municipality} · ${msg.area}` : msg.municipality
          return (
            <li key={msg.id} className="px-4 py-3.5 transition hover:bg-fog/40">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  {msg.isActive && (
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500"
                      title="Pågående hendelse"
                    />
                  )}
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${catCls}`}>
                    {msg.category}
                  </span>
                </div>
                <span className="shrink-0 text-[11px] text-muted">{relativeTime(msg.createdOn)}</span>
              </div>
              <p className="mb-1 text-[11px] font-medium text-sea">
                {location}{msg.isEdited ? ' · oppdatert' : ''}
              </p>
              <p className={`text-[12px] leading-relaxed text-ink/80 ${variant === 'kompakt' ? 'line-clamp-1' : 'line-clamp-3'}`}>
                {msg.text}
              </p>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
