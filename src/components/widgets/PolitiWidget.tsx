import type { WidgetVariant } from './PowerPriceWidget'
import { KOMMUNENAVN_LC, KOMMUNESENTRE, KOMMUNENAVN_TIL_NUMMER } from '@/lib/helgeland/kommuner'
import { PolitiList } from './PolitiList'
import type { PoliceMsg, PoliceThread, MapMarker } from './PolitiList'

interface Props {
  title?: string
  count?: number
  variant?: WidgetVariant
}

// In-memory cache: "kommunenr:area" → {lat, lng}
const geocodeCache = new Map<string, { lat: number; lng: number }>()

async function geocodeArea(
  area: string,
  municipalityLC: string,
): Promise<{ lat: number; lng: number }> {
  const fallback = KOMMUNESENTRE[municipalityLC] ?? { lat: 66.05, lng: 13.2 }
  if (!area) return fallback

  const kommuneNr = KOMMUNENAVN_TIL_NUMMER[municipalityLC]
  const cacheKey = `${kommuneNr ?? municipalityLC}:${area}`
  const cached = geocodeCache.get(cacheKey)
  if (cached) return cached

  try {
    const url =
      `https://ws.geonorge.no/stedsnavn/v1/navn?sok=${encodeURIComponent(area)}&treffPerSide=1` +
      (kommuneNr ? `&kommunenummer=${kommuneNr}` : '') +
      `&fuzzy=false`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'helgelandsia.no' },
      signal: AbortSignal.timeout(3000),
      next: { revalidate: 86400 },
    })
    if (res.ok) {
      const data = await res.json()
      const pt = data.navn?.[0]?.representasjonspunkt
      if (pt?.nord && pt?.øst) {
        const coords = { lat: pt.nord as number, lng: pt.øst as number }
        geocodeCache.set(cacheKey, coords)
        return coords
      }
    }
  } catch {
    // Geokoding feiler stille — fallback til kommunesenter
  }

  geocodeCache.set(cacheKey, fallback)
  return fallback
}

function relTimeStr(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diffMs / 60_000)
  if (m < 2) return 'nettopp'
  if (m < 60) return `${m} min`
  const h = Math.floor(diffMs / 3_600_000)
  if (h < 24) return `${h} t`
  return new Intl.DateTimeFormat('nb-NO', { day: 'numeric', month: 'short' }).format(
    new Date(iso),
  )
}

export async function PolitiWidget({
  title = 'Politiloggen Helgeland',
  count = 5,
  variant = 'full',
}: Props) {
  let threads: PoliceThread[] = []

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
    const data = (await res.json()) as { messages: PoliceMsg[] }

    // Grupper alle Helgeland-meldinger per threadId.
    // API leverer nyeste meldinger først — msgs[0] = siste oppdatering per tråd.
    const threadMap = new Map<string, PoliceMsg[]>()
    for (const msg of data.messages ?? []) {
      if (!KOMMUNENAVN_LC.has(msg.municipality?.toLowerCase() ?? '')) continue
      const arr = threadMap.get(msg.threadId) ?? []
      arr.push(msg)
      threadMap.set(msg.threadId, arr)
    }

    // Bygg PoliceThread-objekter — én per sak, begrenset til count
    for (const [threadId, msgs] of threadMap.entries()) {
      const latest = msgs[0]
      threads.push({
        id: threadId,
        category: latest.category,
        municipality: latest.municipality,
        area: latest.area,
        isActive: latest.isActive,
        latest,
        history: msgs.slice(1).reverse(), // eldre meldinger, eldst først
      })
      if (threads.length >= count) break
    }
  } catch {
    return null
  }

  if (!threads.length) return null

  // Geokod tråder parallelt — aldri blokker på feil (Promise.allSettled)
  let markers: MapMarker[] = []
  if (variant !== 'kompakt') {
    const geoResults = await Promise.allSettled(
      threads.map(async t => {
        const municipalityLC = t.municipality.toLowerCase()
        const coords = await geocodeArea(t.area ?? '', municipalityLC)
        const location = t.area ? `${t.municipality} · ${t.area}` : t.municipality
        return {
          lat: coords.lat,
          lng: coords.lng,
          category: t.category,
          label: location,
          text: t.latest.text.slice(0, 120) + (t.latest.text.length > 120 ? '…' : ''),
          time: relTimeStr(t.latest.createdOn),
        } satisfies MapMarker
      }),
    )
    markers = geoResults
      .filter((r): r is PromiseFulfilledResult<MapMarker> => r.status === 'fulfilled')
      .map(r => r.value)
  }

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
      <PolitiList threads={threads} variant={variant ?? 'full'} markers={markers} />
    </div>
  )
}
