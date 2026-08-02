import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPayloadClient } from '@/lib/getPayload'
import { BUSINESS_CATEGORIES, getCategoryById, publicListingWhere, SHOW_ON_PUBLIC_LISTING_FILTER } from '@/lib/businesses/categories'
import { kategorierForAnbud } from '@/lib/doffin/match'
import BedrifterFilters from '@/components/BedrifterFilters'
import { bizUrl } from '@/lib/slug'
import type { Where } from 'payload'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Næringslivet på Helgeland',
  description: 'Finn lokale bedrifter, leverandører og virksomheter på Helgeland. Søk blant tusenvis av bedrifter i 18 kommuner.',
}

const mediaUrl = (m: any) =>
  m && typeof m === 'object' ? m.sizes?.thumbnail?.url ?? m.url : null

function BusinessCard({ b }: { b: any }) {
  const logo = mediaUrl(b.logo)
  const cat = b.naceCategory ? getCategoryById(b.naceCategory) : null

  return (
    <Link
      href={bizUrl(b)}
      className="group flex flex-col overflow-hidden rounded-2xl bg-paper ring-1 ring-ink/5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_44px_-16px_rgba(12,39,51,0.3)]"
    >
      {logo && (
        <div className="relative aspect-[4/3] overflow-hidden bg-fog">
          <img src={logo} alt={b.name} className="h-full w-full object-contain p-4 transition duration-500 group-hover:scale-105" />
          {b.featured && (
            <span className="absolute top-2 right-2 rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fjord">
              ★ Anbefalt
            </span>
          )}
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        {!logo && b.featured && (
          <span className="mb-1.5 self-start rounded-full bg-sun px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-fjord">
            ★ Anbefalt
          </span>
        )}
        <h3 className="font-serif text-base font-semibold leading-snug text-ink transition group-hover:text-sea line-clamp-2">
          {b.name}
        </h3>
        <p className="mt-1 text-xs text-muted">{b.kommunenavn}</p>
        <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
          {cat && (
            <span className="rounded-full bg-fog px-2 py-0.5 text-[10px] font-medium text-sea">
              {cat.icon} {cat.label}
            </span>
          )}
          {b.antallAnsatte > 0 && (
            <span className="text-[10px] text-muted">{b.antallAnsatte} ans.</span>
          )}
        </div>
      </div>
    </Link>
  )
}

function Pagination({ page, totalPages, searchParams }: { page: number; totalPages: number; searchParams: Record<string, string> }) {
  if (totalPages <= 1) return null
  const makeHref = (p: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('side', String(p))
    return `?${params.toString()}`
  }
  const pages = Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
    if (totalPages <= 7) return i + 1
    if (i === 0) return 1
    if (i === 6) return totalPages
    const mid = Math.min(Math.max(page, 4), totalPages - 3)
    return mid - 3 + i + 1
  })
  return (
    <nav className="mt-10 flex items-center justify-center gap-1">
      {page > 1 && (
        <Link href={makeHref(page - 1)} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-fog">← Forrige</Link>
      )}
      {pages.map(p => (
        <Link key={p} href={makeHref(p)}
          className={`rounded-lg px-3 py-2 text-sm ${p === page ? 'bg-sea text-white font-semibold' : 'text-muted hover:bg-fog'}`}>
          {p}
        </Link>
      ))}
      {page < totalPages && (
        <Link href={makeHref(page + 1)} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-fog">Neste →</Link>
      )}
    </nav>
  )
}

// Ikke-fremhevede: featured = false ELLER felt mangler (NULL)
const NOT_FEATURED: Where = { or: [{ featured: { equals: false } }, { featured: { exists: false } }] }

const LIMIT = 24

export default async function BedrifterPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const q = params.q?.trim() ?? ''
  const kategori = params.kategori ?? ''
  const kommune = params.kommune ?? ''
  const showEnk = params.enk === '1'
  const side = Math.max(1, parseInt(params.side ?? '1', 10) || 1)

  // showEnk er kun en modifikator, ikke en trigger — lista vises aldri av avhukingen alene
  const hasFilters = !!(q || kategori || kommune)
  // Ved tekstsøk inkluderes ENK automatisk — man skal kunne finne en bedrift selv om den er ENK
  const hasSearchQuery = !!q

  const payload = await getPayloadClient()

  const nowDate = new Date()
  const thirtyDaysAgo = new Date(nowDate)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  // Fire bakgrunnsqueries i parallell: anbud, nyregistrerte, opphørte og oppdrag.
  // registreringsdato = enhet.registreringsdatoEnhetsregisteret (historisk BRREG-dato,
  // IKKE import-dato) — trygt å filtrere på uten "25 000 nye bedrifter"-fellen.
  const [allActiveTendersRes, nyregistrerteRes, opphortRes, allOppdragRes] = await Promise.all([
    payload.find({
      collection: 'tenders' as any,
      where: { status: { equals: 'ACTIVE' } },
      sort: '-publicationDate',
      limit: 500,
      overrideAccess: true,
      depth: 0,
    }),
    payload.find({
      collection: 'businesses',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { brregEntityType: { equals: 'hovedenhet' } },
          { registreringsdato: { greater_than_equal: thirtyDaysAgo.toISOString() } },
        ],
      },
      sort: '-registreringsdato',
      limit: 10,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'businesses',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { brregStatus: { in: ['konkurs', 'underAvvikling'] } },
        ],
      },
      sort: 'name',
      limit: 10,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'oppdrag',
      where: { _status: { equals: 'published' } },
      limit: 500,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const allActiveTenders: any[] = allActiveTendersRes.docs
  const nyregistrerte: any[] = nyregistrerteRes.docs
  const opphort: any[] = opphortRes.docs

  // Oppdrag-telling per kategori
  const oppdragCountPerCategory: Record<string, number> = {}
  for (const o of allOppdragRes.docs as any[]) {
    const kat = o.kategori as string | undefined
    if (kat) oppdragCountPerCategory[kat] = (oppdragCountPerCategory[kat] ?? 0) + 1
  }

  // Kategoritelling: ett anbud kan treffe flere kategorier (flere CPV-koder)
  const tenderCountPerCategory: Record<string, number> = {}
  for (const t of allActiveTenders) {
    for (const catId of kategorierForAnbud(t)) {
      tenderCountPerCategory[catId] = (tenderCountPerCategory[catId] ?? 0) + 1
    }
  }

  // Siste 5 med ikke-passert frist (for "Siste offentlige anbud"-seksjonen)
  const latestTenders = allActiveTenders
    .filter(t => !t.deadline || new Date(t.deadline) > nowDate)
    .slice(0, 5)

  // Bygger base-where for søket. ENK inkluderes når toggle er på ELLER det er et tekstsøk.
  // showOnPublicListing filtreres alltid — ENK-bypassen fjerner kun Enkeltpersonforetak-kravet.
  const buildSearchWhere = (extra: Where[]): Where => {
    return (showEnk || hasSearchQuery)
      ? { and: [{ _status: { equals: 'published' } }, SHOW_ON_PUBLIC_LISTING_FILTER, ...extra] }
      : publicListingWhere(...extra)
  }

  const extra: Where[] = []
  if (q) extra.push({ or: [{ name: { contains: q } }, { orgnr: { contains: q } }] })
  if (kategori) extra.push({ naceCategory: { equals: kategori } })
  if (kommune) extra.push({ kommunenavn: { equals: kommune } })
  const searchWhere = buildSearchWhere(extra)

  const [heroCount, featuredRes, nonFeaturedRes, ...catCounts] = await Promise.all([
    payload.count({
      collection: 'businesses',
      where: publicListingWhere(),
    }),
    // Fremhevede: for søkeresultater øverst, eller forsidepanel når ingen filtre
    hasFilters
      ? payload.find({
          collection: 'businesses',
          where: { and: [searchWhere, { featured: { equals: true } }] } as Where,
          sort: 'name',
          limit: 24,
          depth: 1,
        })
      : payload.find({
          collection: 'businesses',
          where: publicListingWhere({ featured: { equals: true } }),
          limit: 6,
          depth: 1,
        }),
    // Ikke-fremhevede (paginert): kun ved aktive filtre
    hasFilters
      ? payload.find({
          collection: 'businesses',
          where: { and: [searchWhere, NOT_FEATURED] } as Where,
          sort: 'name',
          limit: LIMIT,
          page: side,
          depth: 1,
        })
      : Promise.resolve(null as any),
    ...BUSINESS_CATEGORIES.map(cat =>
      payload.count({
        collection: 'businesses',
        where: publicListingWhere({ naceCategory: { equals: cat.id } }),
      }),
    ),
  ])

  // Fremhevede øverst, deretter alfabetisk ikke-fremhevede
  const listing = hasFilters
    ? {
        docs: [...(featuredRes?.docs ?? []), ...(nonFeaturedRes?.docs ?? [])],
        totalDocs: (featuredRes?.totalDocs ?? 0) + (nonFeaturedRes?.totalDocs ?? 0),
        totalPages: nonFeaturedRes?.totalPages ?? 1,
      }
    : null
  const featured = hasFilters ? null : featuredRes
  const totalPages = listing?.totalPages ?? 1
  const searchParamsForPagination = Object.fromEntries(
    Object.entries(params).filter(([k]) => k !== 'side'),
  )

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-sea md:text-4xl">
          Næringslivet på Helgeland
        </h1>
        <p className="mt-2 text-muted">
          {heroCount.totalDocs.toLocaleString('nb')} bedrifter i 18 kommuner.{' '}
          Utforsk bransjer og finn lokale leverandører.
        </p>
      </div>

      {/* Filtre */}
      <div className="mb-8 rounded-2xl bg-fog/60 p-4">
        <Suspense>
          <BedrifterFilters />
        </Suspense>
      </div>

      {/* Kategorigrid */}
      <section className="mb-10">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-eyebrow text-muted">Bransjer</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {BUSINESS_CATEGORIES.map((cat, i) => {
            const count = catCounts[i]?.totalDocs ?? 0
            const tenderCount = tenderCountPerCategory[cat.id] ?? 0
            const oppdragCount = oppdragCountPerCategory[cat.id] ?? 0
            return (
              <Link
                key={cat.id}
                href={`/bedrifter/kategori/${cat.id}`}
                className="flex flex-col items-center gap-1 rounded-xl p-3 text-center bg-paper ring-1 ring-ink/5 transition hover:shadow-md hover:ring-sea/30"
              >
                <span className="text-2xl leading-none">{cat.icon}</span>
                <span className="text-[11px] font-medium leading-tight text-ink">{cat.label}</span>
                <span className="text-[10px] tabular-nums text-muted">{count.toLocaleString('nb')} bedrifter</span>
                {(tenderCount > 0 || oppdragCount > 0) && (
                  <div className="flex flex-wrap justify-center gap-1">
                    {tenderCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold text-amber-800">
                        {tenderCount} anbud
                      </span>
                    )}
                    {oppdragCount > 0 && (
                      <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[9px] font-semibold text-green-800">
                        {oppdragCount} oppdrag
                      </span>
                    )}
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Standardvisning: fremhevede bedrifter (ingen filtre aktive) */}
      {!hasFilters && featured && featured.docs.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-eyebrow text-muted">Anbefalte bedrifter</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.docs.map((b: any) => <BusinessCard key={b.id} b={b} />)}
          </div>
        </section>
      )}

      {/* Søkeresultater (filtre aktive) — fremhevede øverst, deretter resten */}
      {hasFilters && listing && (
        <section>
          <p className="mb-4 text-sm text-muted">
            {listing.totalDocs === 0
              ? 'Ingen bedrifter funnet.'
              : `Viser ${listing.docs.length} av ${listing.totalDocs.toLocaleString('nb')} treff`}
          </p>
          {listing.docs.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listing.docs.map((b: any) => <BusinessCard key={b.id} b={b} />)}
            </div>
          ) : (
            <p className="py-16 text-center text-muted">Prøv et annet søk eller filter.</p>
          )}
          <Pagination page={side} totalPages={totalPages} searchParams={searchParamsForPagination} />
        </section>
      )}

      {/* Nytt på Helgeland — nyregistrerte og opphørte bedrifter */}
      {(nyregistrerte.length > 0 || opphort.length > 0) && (
        <section className="mt-12 border-t border-ink/10 pt-10">
          <h2 className="mb-6 font-serif text-xl font-semibold text-ink">Nytt på Helgeland</h2>
          <div className="grid gap-6 md:grid-cols-2">

            {nyregistrerte.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
                  Nyregistrerte siste 30 dager
                </h3>
                <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
                  {nyregistrerte.map((b: any) => {
                    const cat = b.naceCategory ? getCategoryById(b.naceCategory) : null
                    const regDato = b.registreringsdato
                      ? new Date(b.registreringsdato).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                      : null
                    return (
                      <li key={b.id}>
                        <Link
                          href={bizUrl(b)}
                          className="group flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-fog/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink transition group-hover:text-sea">
                              {b.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {b.kommunenavn}
                              {cat && ` · ${cat.icon} ${cat.label}`}
                            </p>
                          </div>
                          {regDato && (
                            <span className="shrink-0 text-xs text-muted">{regDato}</span>
                          )}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )}

            {opphort.length > 0 && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
                  Konkurs & avvikling (nåværende status)
                </h3>
                <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
                  {opphort.map((b: any) => {
                    const cat = b.naceCategory ? getCategoryById(b.naceCategory) : null
                    const isKonkurs = b.brregStatus === 'konkurs'
                    return (
                      <li key={b.id}>
                        <Link
                          href={bizUrl(b)}
                          className="group flex items-start justify-between gap-3 px-5 py-3 transition hover:bg-fog/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink transition group-hover:text-sea">
                              {b.name}
                            </p>
                            <p className="mt-0.5 text-xs text-muted">
                              {b.kommunenavn}
                              {cat && ` · ${cat.icon} ${cat.label}`}
                            </p>
                          </div>
                          <span className={`shrink-0 text-[11px] font-semibold ${isKonkurs ? 'text-red-600' : 'text-amber-600'}`}>
                            {isKonkurs ? 'Konkurs' : 'Under avvikling'}
                          </span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
                <p className="mt-2 text-[11px] text-muted">
                  Kilde: Brønnøysundregistrene. Dato for statusendring lagres ikke.
                </p>
              </div>
            )}

          </div>
        </section>
      )}

      {/* Siste offentlige anbud — skjules helt hvis ingen anbud i basen */}
      {latestTenders.length > 0 && (
        <section className="mt-12 border-t border-ink/10 pt-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-eyebrow text-muted">
            Siste offentlige anbud
          </h2>
          <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
            {latestTenders.map((t: any) => {
              const days = t.deadline
                ? Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86_400_000)
                : null
              return (
                <li key={t.id}>
                  <a
                    href={t.doffinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start justify-between gap-4 px-5 py-4 transition hover:bg-fog/50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-ink transition group-hover:text-sea">
                        {t.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">
                        {t.buyerName}
                        {t.municipality && ` · ${t.municipality}`}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {t.deadline ? (
                        <>
                          <p className="text-xs text-muted">
                            {new Date(t.deadline).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })}
                          </p>
                          {days !== null && days <= 14 && (
                            <span className={`text-[10px] font-semibold ${days <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                              {days === 0 ? 'I dag' : days === 1 ? '1 dag' : `${days} dager`}
                            </span>
                          )}
                        </>
                      ) : (
                        <p className="text-xs italic text-muted">Ingen frist</p>
                      )}
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
          <div className="mt-3 text-right">
            <Link href="/anbud" className="text-sm text-sea underline-offset-2 hover:underline">
              Se alle Nordland-anbud →
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
