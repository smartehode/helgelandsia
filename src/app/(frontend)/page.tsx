import Link from 'next/link'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import { ForsideSearch } from '@/components/ForsideSearch'
import { HeroHeading } from '@/components/HeroHeading'
import { HeroStrip } from '@/components/HeroStrip'
import { WebcamWeatherWidget } from '@/components/widgets/WebcamWeatherWidget'
import { RenderBlocks } from '@/components/RenderBlocks'
import { getPayloadClient } from '@/lib/getPayload'
import { SITE } from '@/lib/og'

export const dynamic = 'force-dynamic'

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

// ─── Live-data til hero-stripen ──────────────────────────────────────────────

function weatherEmoji(code: number): string {
  if (code === 0) return '☀️'
  if (code <= 2) return '🌤️'
  if (code === 3) return '☁️'
  if (code === 45 || code === 48) return '🌫️'
  if (code >= 51 && code <= 67) return '🌧️'
  if (code >= 71 && code <= 77) return '❄️'
  if (code >= 80 && code <= 82) return '🌦️'
  return '⛈️'
}

const HERO_LOCATIONS = [
  { name: 'Brønnøysund', lat: 65.474, lon: 12.213 },
  { name: 'Sandnessjøen', lat: 66.014, lon: 12.636 },
  { name: 'Mosjøen',      lat: 65.836, lon: 13.195 },
  { name: 'Mo i Rana',    lat: 66.313, lon: 14.143 },
]

async function fetchHeroWeather(): Promise<{ name: string; temp: number; emoji: string }[]> {
  const results = await Promise.allSettled(
    HERO_LOCATIONS.map(async loc => {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lon}&current=temperature_2m,weather_code`,
        { signal: AbortSignal.timeout(3000), next: { revalidate: 1800 } },
      )
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const d = await res.json()
      return {
        name: loc.name,
        temp: Math.round(d.current?.temperature_2m ?? 0),
        emoji: weatherEmoji(d.current?.weather_code ?? 0),
      }
    }),
  )
  return results
    .filter((r): r is PromiseFulfilledResult<{ name: string; temp: number; emoji: string }> => r.status === 'fulfilled')
    .map(r => r.value)
}

async function fetchHeroPower(): Promise<number | null> {
  try {
    const dateStr = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Europe/Oslo', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date())
    const [y, m, day] = dateStr.split('-')
    const res = await fetch(
      `https://www.hvakosterstrommen.no/api/v1/prices/${y}/${m}-${day}_NO4.json`,
      { signal: AbortSignal.timeout(3000), next: { revalidate: 1800 } },
    )
    if (!res.ok) return null
    const prices: { NOK_per_kWh: number; time_start: string }[] = await res.json()
    if (!prices.length) return null
    const nowHour = new Date().toLocaleString('sv-SE', { timeZone: 'Europe/Oslo', hour: '2-digit' })
    const current = prices.find(
      p => new Date(p.time_start).toLocaleString('sv-SE', { timeZone: 'Europe/Oslo', hour: '2-digit' }) === nowHour,
    )
    return current != null ? Math.round(current.NOK_per_kWh * 100) : null
  } catch { return null }
}

// ─── Ikoner (Heroicons outline, MIT) ────────────────────────────────────────

const IconBuilding = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
  </svg>
)

const IconDocument = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
)

const IconBriefcase = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 0 0 .75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 0 0-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0 1 12 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 0 1-.673-.38m0 0A2.18 2.18 0 0 1 3 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 0 1 3.413-.387m7.5 0V5.25A2.25 2.25 0 0 0 13.5 3h-3a2.25 2.25 0 0 0-2.25 2.25v.894m7.5 0a48.667 48.667 0 0 0-7.5 0M12 12.75h.008v.008H12v-.008Z" />
  </svg>
)

const IconCalendar = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
  </svg>
)

const IconClipboard = () => (
  <svg fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-4 w-4" aria-hidden>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
  </svg>
)

const NAV_CARDS = [
  { href: '/bedrifter',     icon: <IconBuilding />,   title: 'Bedrifter',     desc: 'Finn bedrifter i alle 18 Helgeland-kommuner', hintKey: 'bedrifter' },
  { href: '/anbud',         icon: <IconDocument />,   title: 'Anbud',         desc: 'Offentlige anbud og konkurranser i Nordland',  hintKey: 'anbud' },
  { href: '/stillinger',    icon: <IconBriefcase />,  title: 'Stillinger',    desc: 'Ledige stillinger ute i regionen',             hintKey: 'stillinger' },
  { href: '/arrangementer', icon: <IconCalendar />,   title: 'Arrangementer', desc: 'Hva skjer i Helgeland fremover',               hintKey: 'arrangementer' },
  { href: '/oppdrag',       icon: <IconClipboard />,  title: 'Oppdrag',       desc: 'Lokale oppdrag fra folk i regionen',           hintKey: 'oppdrag' },
]

// ─── Live-data til inngangskort ──────────────────────────────────────────────

interface LiveHint { label: string; text: string }
interface CardHints { bedrifter: LiveHint | null; anbud: LiveHint | null; stillinger: LiveHint | null; arrangementer: LiveHint | null; oppdrag: LiveHint | null }

async function fetchCardHints(payload: any): Promise<CardHints> {
  const now = new Date().toISOString()
  const [bRes, aRes, jRes, eRes, oRes] = await Promise.allSettled([
    payload.find({ collection: 'businesses', sort: '-registreringsdato', limit: 1, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'tenders', where: { and: [{ status: { equals: 'ACTIVE' } }, { deadline: { greater_than: now } }] }, sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'jobs', where: { _status: { equals: 'published' } }, sort: '-createdAt', limit: 1, depth: 0 }),
    payload.find({ collection: 'events', where: { and: [{ _status: { equals: 'published' } }, { startDate: { greater_than_equal: now } }] }, sort: 'startDate', limit: 1, depth: 0 }),
    payload.find({ collection: 'oppdrag', where: { _status: { equals: 'published' } }, sort: '-createdAt', limit: 1, depth: 0, overrideAccess: true }),
  ])

  const bedrifter = (() => {
    if (bRes.status !== 'fulfilled') return null
    const b = bRes.value.docs?.[0]
    if (!b) return null
    return { label: 'Nyeste', text: `Ny: ${[b.name, b.kommunenavn].filter(Boolean).join(', ')}` }
  })()

  const anbud = (() => {
    if (aRes.status !== 'fulfilled') return null
    const a = aRes.value.docs?.[0]
    if (!a) return null
    const frist = a.deadline ? format(new Date(a.deadline), 'd. MMM', { locale: nb }) : null
    return { label: 'Nyeste', text: frist ? `${a.title} · frist ${frist}` : a.title }
  })()

  const stillinger = (() => {
    if (jRes.status !== 'fulfilled') return null
    const j = jRes.value.docs?.[0]
    if (!j) return null
    return { label: 'Nyeste', text: [j.title, j.employer].filter(Boolean).join(' · ') }
  })()

  const arrangementer = (() => {
    if (eRes.status !== 'fulfilled') return null
    const e = eRes.value.docs?.[0]
    if (!e) return null
    const dato = e.startDate ? format(new Date(e.startDate), 'd. MMM', { locale: nb }) : null
    return { label: 'Neste', text: dato ? `${e.title} · ${dato}` : e.title }
  })()

  const oppdrag = (() => {
    if (oRes.status !== 'fulfilled') return null
    const o = oRes.value.docs?.[0]
    if (!o) return null
    const kommune = o.kommune
      ? `${(o.kommune as string).charAt(0).toUpperCase()}${(o.kommune as string).slice(1)}`
      : null
    return { label: 'Nyeste', text: kommune ? `${o.tittel}, ${kommune}` : o.tittel }
  })()

  return { bedrifter, anbud, stillinger, arrangementer, oppdrag }
}

// ─── Seksjonsoverskrift ──────────────────────────────────────────────────────

function SecHeader({ label, href }: { label: string; href: string }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-ink">{label}</h2>
      <Link href={href} className="text-xs font-medium text-sea transition hover:underline">
        Se alle →
      </Link>
    </div>
  )
}

// ─── Forside ─────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const payload = await getPayloadClient()

  const [widgetAreasRes, weather, power, hints] = await Promise.all([
    payload.findGlobal({ slug: 'sidefelt', depth: 1 }).catch(() => null),
    fetchHeroWeather(),
    fetchHeroPower(),
    fetchCardHints(payload).catch(() => ({ bedrifter: null, anbud: null, stillinger: null, arrangementer: null, oppdrag: null } as CardHints)),
  ])

  const widgetAreas: any = widgetAreasRes
  const weatherItems = weather.map(w => ({ label: `${w.emoji} ${w.name}:`, value: `${w.temp}°C` }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE}/#organization`,
        name: 'Helgelandsia',
        url: SITE,
        logo: { '@type': 'ImageObject', url: `${SITE}/opengraph-image` },
        areaServed: { '@type': 'Place', name: 'Helgeland' },
        description: 'Regional portal for Helgeland — bedrifter, stillinger, anbud og arrangementer fra 18 kommuner.',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE}/#website`,
        url: SITE,
        name: 'Helgelandsia',
        publisher: { '@id': `${SITE}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: `${SITE}/api/sok?q={search_term_string}` },
          'query-input': 'required name=search_term_string',
        },
      },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="mx-auto w-full max-w-[1200px] px-4">

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="py-10 text-center sm:py-14">
        <HeroHeading />
        <p className="mx-auto mt-3 max-w-md text-base text-muted">
          Næringsliv, stillinger, arrangementer og leserinnlegg fra hele regionen.
        </p>
        <ForsideSearch />
        {(weatherItems.length > 0 || power != null) && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-muted">
            {power != null && (
              <span>⚡ Strøm NO4: <strong className="font-semibold text-ink">{power} øre/kWh</strong></span>
            )}
            <HeroStrip items={weatherItems} />
          </div>
        )}
      </section>

      {/* ── 2. INNGANGSKORT ─────────────────────────────────────────────── */}
      <section className="border-t border-ink/10 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {NAV_CARDS.map((card, i) => {
            const hint = hints[card.hintKey as keyof CardHints]
            const isLast = i === NAV_CARDS.length - 1
            return (
              <Link
                key={card.href}
                href={card.href}
                className={`group flex flex-col gap-1.5 rounded-xl border border-ink/10 bg-white p-4 transition hover:border-sea/50 hover:shadow-sm${isLast ? ' col-span-2 sm:col-span-1' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sea">{card.icon}</span>
                  <p className="text-sm font-semibold text-fjord">{card.title}</p>
                </div>
                <p className="truncate text-xs leading-snug text-muted">
                  {hint ? (
                    <><span className="font-medium text-muted/50">{hint.label}: </span>{hint.text}</>
                  ) : card.desc}
                </p>
              </Link>
            )
          })}
        </div>
      </section>

      {/* ── FREMHEVET SONE — full bredde ────────────────────────────────── */}
      {widgetAreas?.fremhevet?.length > 0 && (
        <section className="border-t border-ink/10 py-12">
          {(widgetAreas.fremhevet as any[]).map((block: any, i: number) => {
            if (block.blockType === 'featuredPosts') {
              const blockPosts = (block.posts ?? []).filter((p: any) => typeof p === 'object' && p?.slug)
              if (!blockPosts.length) return null
              return (
                <div key={block.id ?? i}>
                  {block.heading && <SecHeader label={block.heading} href="/leserinnlegg" />}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {blockPosts.map((post: any) => {
                      const img = mediaUrl(post.heroImage, 'card') ?? mediaUrl(post.heroImage)
                      return (
                        <Link
                          key={post.id}
                          href={`/leserinnlegg/${post.slug}`}
                          className="group overflow-hidden rounded-xl border border-ink/10 bg-white transition hover:shadow-sm"
                        >
                          <div className="aspect-[3/2] overflow-hidden bg-fog">
                            {img
                              ? <img src={img} alt={post.heroImage?.alt ?? post.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                              : <div className="flex h-full w-full items-center justify-center"><span className="font-serif text-3xl text-sea/20">H</span></div>
                            }
                          </div>
                          <div className="p-4">
                            <h3 className="font-serif text-base font-semibold leading-snug text-ink transition group-hover:text-sea">
                              {post.title}
                            </h3>
                            {post.excerpt && (
                              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{post.excerpt}</p>
                            )}
                            {post.publishedAt && (
                              <p className="mt-2 text-[11px] text-muted">
                                {format(new Date(post.publishedAt), 'd. MMMM yyyy', { locale: nb })}
                              </p>
                            )}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                </div>
              )
            }
            return <RenderBlocks key={block.id ?? i} blocks={[block]} />
          })}
        </section>
      )}

      {/* ── 3. INNHOLD + SIDEFELT ───────────────────────────────────────── */}
      {/* Midten-sone (venstre) + sidefelt (høyre) — alt konfigureres i admin  */}
      <div className="border-t border-ink/10 pt-12 pb-16 grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">

        {/* Midten-sone: historier, arrangementer og andre admin-blokker */}
        <div>
          {widgetAreas?.midten?.length > 0 && (
            <RenderBlocks
              blocks={widgetAreas.midten}
              kolonner={(widgetAreas.midtenKolonner as '1' | '2' | '3' | '4') ?? '2'}
              gap="gap-8"
            />
          )}
        </div>

        {/* Sidefelt: admin-konfigurerte blokker, ellers webkamera som standard */}
        <aside className="lg:sticky lg:top-6">
          {widgetAreas?.sidefelt?.length > 0 ? (
            <RenderBlocks
              blocks={widgetAreas.sidefelt}
              kolonner={(widgetAreas.sidefeltKolonner as '1' | '2' | '3' | '4') ?? '1'}
              gap="gap-4"
            />
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">Helgeland live</p>
                <Link href="/nyttig" className="text-xs font-medium text-sea transition hover:underline">
                  Mer nyttig →
                </Link>
              </div>
              <WebcamWeatherWidget title="" />
            </div>
          )}
        </aside>

      </div>

      {/* Bunn-sone — kompakt, kolonnetall fra admin */}
      {widgetAreas?.bunn?.length > 0 && (
        <section className="border-t border-ink/10 py-12">
          <RenderBlocks
            blocks={widgetAreas.bunn}
            kolonner={(widgetAreas.bunnKolonner as '1' | '2' | '3' | '4') ?? '3'}
            gap="gap-4"
          />
        </section>
      )}

      {/* CTA-stripe */}
      <section className="mb-12 border-t border-ink/10 py-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-eyebrow text-muted">For næringslivet</p>
        <h2 className="mx-auto mt-3 max-w-xl font-serif text-2xl font-semibold text-fjord sm:text-3xl">
          Driver du bedrift på Helgeland?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
          Over 24 000 bedrifter i 18 kommuner. Ta over din oppføring, legg til kontaktinfo og
          logo — gratis i fase 1.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/bedrifter"
            className="rounded-full bg-fjord px-7 py-3 text-sm font-semibold text-white transition hover:bg-fjord/90"
          >
            Finn din bedrift
          </Link>
          <Link
            href="/min-side"
            className="rounded-full border border-ink/20 px-7 py-3 text-sm font-medium text-ink transition hover:bg-fog"
          >
            Logg inn / registrer deg
          </Link>
        </div>
      </section>

    </div>
    </>
  )
}
