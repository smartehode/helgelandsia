import type { WidgetVariant } from './PowerPriceWidget'
import { NewsCarousel, type CarouselItem } from './NewsCarousel'

export type NewsSourceName = 'BAnett' | 'Helgelendingen' | 'Helgelands Blad' | 'NRK Nordland'

interface Props {
  title?: string
  sources?: NewsSourceName[]
  count?: number
  variant?: WidgetVariant
}

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: NewsSourceName
  image: string
}

const ALL_SOURCES: { name: NewsSourceName; urls: string[] }[] = [
  { name: 'BAnett', urls: ['https://www.banett.no/rss', 'https://www.banett.no/feed'] },
  { name: 'Helgelendingen', urls: ['https://www.helg.no/rss'] },
  { name: 'Helgelands Blad', urls: ['https://www.hblad.no/rss', 'https://www.hblad.no/feed'] },
  { name: 'NRK Nordland', urls: ['https://www.nrk.no/nordland/toppsaker.rss'] },
]

const SOURCE_STYLE: Record<NewsSourceName, string> = {
  'BAnett':          'bg-sea/15 text-sea',
  'Helgelendingen':  'bg-sea/30 text-sea',
  'Helgelands Blad': 'bg-fjord/15 text-fjord',
  'NRK Nordland':    'bg-fjord/30 text-fjord',
}

const CAROUSEL_COUNT = 5

// --- RSS-parsing ---

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .trim()
}

function extractText(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`))
  if (cdata) return decodeEntities(cdata[1])
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))
  return plain ? decodeEntities(plain[1]) : ''
}

function extractLink(item: string): string {
  const std = item.match(/<link>\s*(https?:[^\s<]+)\s*<\/link>/)
  if (std) return std[1]
  const cdata = item.match(/<link>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/link>/)
  if (cdata) return cdata[1].trim()
  const guid = item.match(/<guid[^>]*>\s*(https?:[^\s<]+)\s*<\/guid>/)
  if (guid) return guid[1]
  return ''
}

function extractImage(item: string): string {
  const enc = item.match(/<enclosure[^>]*\burl="([^"]+)"[^>]*\btype="image[^"]*"/)
    ?? item.match(/<enclosure[^>]*\btype="image[^"]*"[^>]*\burl="([^"]+)"/)
  if (enc) return enc[1]
  const mc = item.match(/<media:content[^>]*\burl="([^"]+)"/)
  if (mc) return mc[1]
  const mt = item.match(/<media:thumbnail[^>]*\burl="([^"]+)"/)
  if (mt) return mt[1]
  return ''
}

function parseRss(xml: string, source: NewsSourceName): NewsItem[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)]
    .map(m => {
      const item = m[1]
      return {
        title: extractText(item, 'title'),
        link: extractLink(item),
        pubDate: extractText(item, 'pubDate'),
        source,
        image: extractImage(item),
      }
    })
    .filter(n => !!n.title && !!n.link)
}

async function fetchSource(name: NewsSourceName, urls: string[]): Promise<NewsItem[]> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 900 },
        headers: { 'Accept': 'application/rss+xml, application/xml, text/xml, */*' },
      })
      if (!res.ok) continue
      const xml = await res.text()
      const items = parseRss(xml, name)
      if (items.length > 0) return items
    } catch {}
  }
  return []
}

// Hent og:image fra artikkelsiden (2 s timeout, cachet 1 t)
async function fetchOgImage(url: string): Promise<string> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(2000),
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Helgelandsia/1.0)' },
    })
    if (!res.ok) return ''
    const html = await res.text()
    const m = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/)
      ?? html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/)
    return m?.[1] ?? ''
  } catch {
    return ''
  }
}

function relativeTime(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60_000)
  if (diffMin < 2) return 'nå nettopp'
  if (diffMin < 60) return `for ${diffMin} min siden`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `for ${diffHr} t siden`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay === 1) return 'i går'
  if (diffDay < 7) return `for ${diffDay} d siden`
  return d.toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
}

// --- Visningskomponenter ---

function SourcePill({ source }: { source: NewsSourceName }) {
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${SOURCE_STYLE[source] ?? 'bg-ink/10 text-ink'}`}>
      {source}
    </span>
  )
}

// Rad med bilde (full variant, sak CAROUSEL_COUNT+)
function NewsRowFull({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank" rel="noopener"
      className="flex items-start gap-3 rounded-xl px-2 py-2 -mx-2 hover:bg-ink/5 transition-colors"
    >
      {item.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.image}
          alt=""
          loading="lazy"
          className="shrink-0 rounded-lg object-cover"
          style={{ width: 60, height: 60 }}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <SourcePill source={item.source} />
          {relativeTime(item.pubDate) && (
            <span className="text-xs text-muted">{relativeTime(item.pubDate)}</span>
          )}
        </div>
        <p className="text-sm font-medium text-ink line-clamp-2 leading-snug">{item.title}</p>
      </div>
    </a>
  )
}

// Kompakt rad — ingen bilder
function NewsRowKompakt({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.link}
      target="_blank" rel="noopener"
      className="flex items-start gap-2 rounded-xl px-2 py-1.5 -mx-2 hover:bg-ink/5 transition-colors"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 mb-0.5">
          <SourcePill source={item.source} />
          {relativeTime(item.pubDate) && (
            <span className="text-xs text-muted">{relativeTime(item.pubDate)}</span>
          )}
        </div>
        <p className="text-sm font-medium text-ink line-clamp-2 leading-snug">{item.title}</p>
      </div>
    </a>
  )
}

// --- Eksportert widget ---

export async function NewsWidget({
  title,
  sources,
  count = 8,
  variant = 'full',
}: Props) {
  const activeSources = ALL_SOURCES.filter(s => !sources?.length || sources.includes(s.name))

  const results = await Promise.allSettled(
    activeSources.map(s => fetchSource(s.name, s.urls)),
  )

  const seen = new Set<string>()
  const maxCount = variant === 'kompakt' ? Math.min(count, 5) : count
  const allItems = results
    .flatMap(r => (r.status === 'fulfilled' ? r.value : []))
    .filter(n => {
      if (seen.has(n.link)) return false
      seen.add(n.link)
      return true
    })
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .slice(0, maxCount)

  // Berik topp-5 med og:image der RSS-bildet mangler
  const carouselRaw = allItems.slice(0, CAROUSEL_COUNT)
  const restItems = allItems.slice(CAROUSEL_COUNT)

  const carouselItems: CarouselItem[] = await Promise.all(
    carouselRaw.map(async item => {
      const image = item.image || (await fetchOgImage(item.link))
      return { title: item.title, link: item.link, pubDate: item.pubDate, source: item.source, image }
    }),
  )

  const heading = title ?? 'Lokale nyheter'

  return (
    <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
      <h2 className="font-serif text-xl font-semibold text-fjord">{heading}</h2>

      {allItems.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Kunne ikke hente nyheter akkurat nå.</p>
      ) : variant === 'full' ? (
        <div className="mt-4 space-y-1">
          <NewsCarousel items={carouselItems} />
          {restItems.map((item, i) => (
            <NewsRowFull key={item.link + i} item={item} />
          ))}
        </div>
      ) : (
        <div className="mt-3 space-y-0.5">
          {allItems.map((item, i) => (
            <NewsRowKompakt key={item.link + i} item={item} />
          ))}
        </div>
      )}
    </div>
  )
}
