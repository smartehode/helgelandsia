import Link from 'next/link'
import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getPayloadClient } from '@/lib/getPayload'
import { BUSINESS_CATEGORIES, getCategoryById, publicListingWhere } from '@/lib/businesses/categories'
import BedrifterFilters from '@/components/BedrifterFilters'
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
      href={`/bedrifter/${b.slug}`}
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

  // Bygger base-where for søket. ENK inkluderes når toggle er på ELLER det er et tekstsøk.
  const buildSearchWhere = (extra: Where[]): Where => {
    return (showEnk || hasSearchQuery)
      ? { and: [{ _status: { equals: 'published' } }, ...extra] }
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
            return (
              <Link
                key={cat.id}
                href={`/bedrifter/kategori/${cat.id}`}
                className="flex flex-col items-center gap-1 rounded-xl p-3 text-center bg-paper ring-1 ring-ink/5 transition hover:shadow-md hover:ring-sea/30"
              >
                <span className="text-2xl leading-none">{cat.icon}</span>
                <span className="text-[11px] font-medium leading-tight text-ink">{cat.label}</span>
                <span className="text-[10px] tabular-nums text-muted">{count.toLocaleString('nb')}</span>
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
    </div>
  )
}
