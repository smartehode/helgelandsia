import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { safeFetch } from '@/lib/ssrf'

const WP_API = 'https://midtinorge.no/wp-json/wp/v2/posts'
const LOG = '[EksterneArtikler]'

interface ExternalArticle {
  title: string
  excerpt: string | null
  imageUrl: string | null
  link: string
  date: string | null
}

interface Props {
  title?: string
  source?: 'api' | 'manual' | 'begge'
  count?: number
  manualUrls?: { url: string }[]
  variant?: 'full' | 'kompakt'
}

// Modul-nivå cache for manuelle URL-er (WP-API + OG-fallback)
const manualCache = new Map<string, { article: ExternalArticle | null; ts: number }>()
const MANUAL_TTL = 1_800_000 // 30 min

// ── Hjelpere ─────────────────────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\.{3}\]|\[&hellip;\]|\[…\]/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#8217;/g, '’').replace(/&#8216;/g, '‘')
    .replace(/&#8211;/g, '–').replace(/&#8220;/g, '“').replace(/&#8221;/g, '”')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ').trim()
}

function parseOg(html: string, finalUrl: string): ExternalArticle | null {
  const meta = (prop: string): string | null => {
    const m =
      html.match(new RegExp(`<meta[^>]+property=["']og:${prop}["'][^>]+content=["']([^"']+)["']`, 'i')) ??
      html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:${prop}["']`, 'i'))
    return m?.[1] ?? null
  }
  const title = meta('title')
  if (!title) return null
  return {
    title: stripHtml(title),
    excerpt: meta('description') ? stripHtml(meta('description')!).slice(0, 150) : null,
    imageUrl: meta('image'),
    link: finalUrl,
    date: null,
  }
}

function mapWpPost(post: any, fallbackUrl: string): ExternalArticle | null {
  const title = stripHtml(post.title?.rendered ?? '')
  if (!title) return null
  const media = post._embedded?.['wp:featuredmedia']?.[0]
  const imageUrl =
    media?.media_details?.sizes?.medium_large?.source_url ??
    media?.media_details?.sizes?.large?.source_url ??
    media?.media_details?.sizes?.medium?.source_url ??
    media?.source_url ??
    null
  const excerpt = post.excerpt?.rendered
    ? stripHtml(post.excerpt.rendered).slice(0, 150) || null
    : null
  return { title, excerpt, imageUrl, link: post.link ?? fallbackUrl, date: post.date ?? null }
}

// ── Datahenting ───────────────────────────────────────────────────────────────

async function fetchFromWpApi(count: number): Promise<ExternalArticle[]> {
  try {
    const res = await fetch(
      `${WP_API}?_embed&per_page=${Math.min(count, 10)}&status=publish`,
      { signal: AbortSignal.timeout(5000), next: { revalidate: 1800 } },
    )
    if (!res.ok) return []
    const posts: any[] = await res.json()
    if (!Array.isArray(posts)) return []
    return posts.flatMap((p): ExternalArticle[] => {
      const a = mapWpPost(p, '')
      return a ? [a] : []
    })
  } catch {
    return []
  }
}

function urlToSlug(url: string): string | null {
  try {
    const { pathname } = new URL(url)
    const slug = pathname.replace(/\/$/, '').split('/').filter(Boolean).at(-1) ?? ''
    return slug || null
  } catch {
    return null
  }
}

async function fetchByWpSlug(rawUrl: string): Promise<ExternalArticle | null> {
  const slug = urlToSlug(rawUrl)
  if (!slug) {
    console.log(LOG, `slug-utledning feilet for "${rawUrl}"`)
    return null
  }
  const apiUrl = `${WP_API}?slug=${encodeURIComponent(slug)}&_embed`
  console.log(LOG, `WP-API-oppslag: ${apiUrl}`)
  try {
    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(5000), next: { revalidate: 1800 } })
    console.log(LOG, `WP-API HTTP ${res.status} for slug="${slug}"`)
    if (!res.ok) return null
    const posts: any[] = await res.json()
    console.log(LOG, `WP-API ${posts.length} treff for slug="${slug}"`)
    if (!Array.isArray(posts) || !posts.length) return null
    const article = mapWpPost(posts[0], rawUrl)
    if (article) {
      console.log(LOG, `→ WP-API OK: tittel="${article.title.slice(0, 60)}", bilde=${article.imageUrl ? 'JA' : 'NEI'}`)
    }
    return article
  } catch (err: any) {
    console.log(LOG, `WP-API unntak for slug="${slug}": ${err?.message ?? err}`)
    return null
  }
}

async function fetchOgFallback(url: string): Promise<ExternalArticle | null> {
  console.log(LOG, `OG-fallback for "${url}"`)
  try {
    const { buffer, finalUrl } = await safeFetch(url, { maxBytes: 200_000 })
    const html = buffer.toString('utf-8')
    const article = parseOg(html, finalUrl)
    console.log(LOG, `→ OG: ${article
      ? `tittel="${article.title.slice(0, 60)}", bilde=${article.imageUrl ? 'JA' : 'NEI'}`
      : 'null (ingen og:title med content)'}`)
    return article
  } catch (err: any) {
    console.log(LOG, `OG-fallback feilet: ${err?.message ?? err}`)
    return null
  }
}

async function fetchManualArticle(url: string): Promise<ExternalArticle | null> {
  const hit = manualCache.get(url)
  if (hit && Date.now() - hit.ts < MANUAL_TTL) {
    console.log(LOG, `cache-treff for "${url}" → ${hit.article ? 'OK' : 'null'}`)
    return hit.article
  }
  // Primærvei: WP-API slug-oppslag
  const article = (await fetchByWpSlug(url)) ?? (await fetchOgFallback(url))
  manualCache.set(url, { article, ts: Date.now() })
  return article
}

// ── Widget ────────────────────────────────────────────────────────────────────

export async function EksterneArtiklerWidget({
  title = 'Fra Midt-Norge',
  source = 'api',
  count = 5,
  manualUrls = [],
  variant = 'full',
}: Props) {
  // Manuelle URL-er brukes alltid når de finnes.
  // source-feltet styrer kun om WP-APIet også kalles ('manual' = kun manuelle).
  const useApi = source !== 'manual'
  const useManual = manualUrls.length > 0

  const [apiArticles, manualResults] = await Promise.all([
    useApi ? fetchFromWpApi(count) : Promise.resolve([] as ExternalArticle[]),
    useManual
      ? Promise.allSettled(manualUrls.map(({ url }) => fetchManualArticle(url))).then(rs =>
          rs
            .filter((r): r is PromiseFulfilledResult<ExternalArticle | null> => r.status === 'fulfilled')
            .map(r => r.value)
            .filter((a): a is ExternalArticle => a !== null),
        )
      : Promise.resolve([] as ExternalArticle[]),
  ])

  // Manuelle URL-er vises først, deretter API — dedup på normalisert URL
  const seen = new Set<string>()
  const articles: ExternalArticle[] = []
  for (const a of [...manualResults, ...apiArticles]) {
    const key = a.link.replace(/\/$/, '')
    if (!seen.has(key)) { seen.add(key); articles.push(a) }
  }

  if (!articles.length) return null

  const fmtDate = (d: string | null) => {
    if (!d) return null
    try { return format(new Date(d), 'd. MMM yyyy', { locale: nb }) } catch { return null }
  }

  if (variant === 'kompakt') {
    return (
      <div className="overflow-hidden rounded-xl border border-ink/10 bg-white">
        <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          <a href="https://midtinorge.no" target="_blank" rel="noopener noreferrer"
            className="text-xs text-sea transition hover:underline">
            midtinorge.no ↗
          </a>
        </div>
        <ul className="divide-y divide-ink/5">
          {articles.map((a, i) => {
            const dato = fmtDate(a.date)
            return (
              <li key={i}>
                <a href={a.link} target="_blank" rel="noopener noreferrer"
                  className="block px-4 py-3 transition hover:bg-fog/50">
                  <p className="line-clamp-2 text-sm text-ink">{a.title}</p>
                  {dato && <p className="mt-0.5 text-[11px] text-muted">{dato}</p>}
                </a>
              </li>
            )
          })}
        </ul>
        <div className="border-t border-ink/5">
          <p className="px-4 py-2 text-center text-[11px] text-muted">
            Fra Midt-Norge ·{' '}
            <a href="https://midtinorge.no" target="_blank" rel="noopener noreferrer"
              className="hover:underline">midtinorge.no</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <a href="https://midtinorge.no" target="_blank" rel="noopener noreferrer"
          className="text-xs font-medium text-sea transition hover:underline">
          midtinorge.no ↗
        </a>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((a, i) => {
          const dato = fmtDate(a.date)
          return (
            <a key={i} href={a.link} target="_blank" rel="noopener noreferrer"
              className="group overflow-hidden rounded-xl border border-ink/10 bg-white transition hover:shadow-sm">
              <div className="aspect-[3/2] overflow-hidden bg-fog">
                {a.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.imageUrl} alt={a.title} loading="lazy"
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-serif text-3xl text-sea/20">M</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="line-clamp-2 font-serif text-base font-semibold leading-snug text-ink transition group-hover:text-sea">
                  {a.title}
                </p>
                {a.excerpt && <p className="mt-1 line-clamp-2 text-xs text-muted">{a.excerpt}</p>}
                {dato && <p className="mt-2 text-[11px] text-muted">{dato}</p>}
              </div>
            </a>
          )
        })}
      </div>
      <p className="mt-3 text-center text-[11px] text-muted">
        Fra Midt-Norge ·{' '}
        <a href="https://midtinorge.no" target="_blank" rel="noopener noreferrer"
          className="hover:underline">midtinorge.no</a>
      </p>
    </div>
  )
}
