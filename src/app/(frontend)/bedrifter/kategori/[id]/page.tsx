import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import type { Metadata } from 'next'
import type { Where } from 'payload'
import { getPayloadClient } from '@/lib/getPayload'
import { getCategoryById, getCategoryById as getcat, BUSINESS_CATEGORIES, publicListingWhere, SHOW_ON_PUBLIC_LISTING_FILTER } from '@/lib/businesses/categories'
import { kategorierForAnbud } from '@/lib/doffin/match'
import BedrifterFilters from '@/components/BedrifterFilters'
import { SITE } from '@/lib/og'
import { bizUrl } from '@/lib/slug'
import { LeggUtOppdragFab } from '@/components/LeggUtOppdragFab'

export const dynamic = 'force-dynamic'

const mediaUrl = (m: any) =>
  m && typeof m === 'object' ? m.sizes?.thumbnail?.url ?? m.url : null

// Ikke-fremhevede: featured = false ELLER felt mangler (NULL)
const NOT_FEATURED: Where = { or: [{ featured: { equals: false } }, { featured: { exists: false } }] }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const cat = getCategoryById(id)
  if (!cat) return {}
  const title = `${cat.label} på Helgeland`
  const description = `Finn ${cat.label.toLowerCase()}-bedrifter på Helgeland. Oversikt over lokale virksomheter i 18 kommuner.`
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE}/bedrifter/kategori/${id}` },
  }
}

function BizCard({ b }: { b: any }) {
  const logo = mediaUrl(b.logo)
  return (
    <Link
      href={bizUrl(b)}
      className="group flex flex-col overflow-hidden rounded-2xl bg-paper ring-1 ring-ink/5 transition hover:-translate-y-1 hover:shadow-[0_14px_44px_-16px_rgba(12,39,51,0.3)]"
    >
      {logo && (
        <div className="relative aspect-[4/3] overflow-hidden bg-fog">
          <img src={logo} alt={b.name} className="h-full w-full object-contain p-4 transition group-hover:scale-105" />
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
        <h3 className="font-serif text-base font-semibold leading-snug text-ink transition group-hover:text-sea line-clamp-2">{b.name}</h3>
        <p className="mt-1 text-xs text-muted">{b.kommunenavn}</p>
        {b.antallAnsatte > 0 && (
          <p className="mt-auto pt-2 text-[10px] text-muted">{b.antallAnsatte} ansatte</p>
        )}
      </div>
    </Link>
  )
}

export default async function KategoriPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { id } = await params
  const cat = getcat(id)
  if (!cat) notFound()

  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const kommune = sp.kommune ?? ''
  const showEnk = sp.enk === '1'
  const side = Math.max(1, parseInt(sp.side ?? '1', 10) || 1)
  const LIMIT = 24
  const hasLocalFilters = !!(q || kommune)
  // Ved tekstsøk inkluderes ENK automatisk
  const hasSearchQuery = !!q

  // Felles betingelser for denne kategorisiden (status + ENK + kategori + ev. søk/kommune)
  const baseConditions: Where[] = [{ _status: { equals: 'published' } }, SHOW_ON_PUBLIC_LISTING_FILTER]
  // ENK skjules ved browsing, inkluderes ved tekstsøk
  if (!showEnk && !hasSearchQuery) {
    baseConditions.push({
      or: [
        { organisasjonsform: { not_equals: 'Enkeltpersonforetak' } },
        { organisasjonsform: { exists: false } },
      ],
    })
  }
  baseConditions.push({ naceCategory: { equals: id } })
  if (kommune) baseConditions.push({ kommunenavn: { equals: kommune } })
  if (q) baseConditions.push({ or: [{ name: { contains: q } }, { orgnr: { contains: q } }] })

  const featuredWhere: Where = { and: [...baseConditions, { featured: { equals: true } }] }
  const nonFeaturedWhere: Where = { and: [...baseConditions, NOT_FEATURED] }

  const payload = await getPayloadClient()
  const now = new Date()

  // Fire parallelle spørringer: fremhevede, resten (paginert), oppdrag og anbud.
  const [featuredQuery, listing, oppdragRes, tenderRes] = await Promise.all([
    payload.find({
      collection: 'businesses',
      where: featuredWhere,
      sort: 'name',
      limit: 24,
      depth: 1,
    }),
    payload.find({
      collection: 'businesses',
      where: nonFeaturedWhere,
      sort: 'name',
      limit: LIMIT,
      page: side,
      depth: 1,
    }),
    payload.find({
      collection: 'oppdrag',
      where: { and: [{ _status: { equals: 'published' } }, { kategori: { equals: id } }] },
      sort: '-createdAt',
      limit: 5,
      depth: 0,
    }),
    payload.find({
      collection: 'tenders' as any,
      where: { status: { equals: 'ACTIVE' } },
      sort: 'deadline',
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  // Filtrer anbud som matcher denne kategorien via NACE↔CPV-mapping
  const categoryTenders = (tenderRes.docs as any[])
    .filter(t => !t.deadline || new Date(t.deadline) > now)
    .filter(t => kategorierForAnbud(t).includes(id))
    .slice(0, 5)

  const totalDocs = featuredQuery.totalDocs + listing.totalDocs
  const totalPages = listing.totalPages ?? 1
  // Ved aktive filtre: kombiner fremhevede + resten i én liste
  const mainDocs = hasLocalFilters
    ? [...featuredQuery.docs, ...listing.docs]
    : listing.docs

  const makeHref = (p: number) => {
    const prms = new URLSearchParams(sp)
    prms.set('side', String(p))
    return `?${prms.toString()}`
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <LeggUtOppdragFab />
      {/* Brødsmulesti */}
      <nav className="mb-4 text-sm text-muted">
        <Link href="/bedrifter" className="hover:text-sea">Bedrifter</Link>
        <span className="mx-2">›</span>
        <span>{cat.icon} {cat.label}</span>
      </nav>

      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-sea md:text-4xl">
          {cat.icon} {cat.label} på Helgeland
        </h1>
        <p className="mt-2 text-muted">
          {totalDocs.toLocaleString('nb')} bedrifter
        </p>
      </div>

      <div className="mb-8 rounded-2xl bg-fog/60 p-4">
        <Suspense>
          <BedrifterFilters lockKategori={id} />
        </Suspense>
      </div>

      {/* Anbefalt-seksjon — kun uten lokale filtre, øverst over katalogen */}
      {!hasLocalFilters && featuredQuery.docs.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-eyebrow text-muted">Anbefalte</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredQuery.docs.map((b: any) => <BizCard key={b.id} b={b} />)}
          </div>
        </section>
      )}

      {/* Katalog: ved aktive filtre = fremhevede øverst + resten; ellers = kun ikke-fremhevede */}
      {mainDocs.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {mainDocs.map((b: any) => <BizCard key={b.id} b={b} />)}
        </div>
      ) : totalDocs === 0 ? (
        <p className="py-16 text-center text-muted">Ingen bedrifter funnet med dette filteret.</p>
      ) : null}

      {/* Paginering (teller kun ikke-fremhevede siden de er paginert) */}
      {totalPages > 1 && (
        <nav className="mt-10 flex justify-center gap-1">
          {side > 1 && <Link href={makeHref(side - 1)} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-fog">← Forrige</Link>}
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
            <Link key={p} href={makeHref(p)}
              className={`rounded-lg px-3 py-2 text-sm ${p === side ? 'bg-sea text-white font-semibold' : 'text-muted hover:bg-fog'}`}>
              {p}
            </Link>
          ))}
          {side < totalPages && <Link href={makeHref(side + 1)} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-fog">Neste →</Link>}
        </nav>
      )}

      {/* Aktuelle oppdrag i denne bransjen — vises alltid */}
      <section className="mt-14">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-eyebrow text-muted">
            Aktuelle oppdrag i {cat.label}
          </h2>
          {oppdragRes.docs.length > 0 && (
            <Link href={`/oppdrag?kategori=${id}`} className="text-xs text-sea hover:underline">
              Se alle →
            </Link>
          )}
        </div>

        {oppdragRes.docs.length > 0 ? (
          <>
            <ul className="space-y-2">
              {(oppdragRes.docs as any[]).map((o: any) => {
                const kommuneDisplay = o.kommune
                  ? (o.kommune as string).charAt(0).toUpperCase() + (o.kommune as string).slice(1)
                  : ''
                const dato = o.createdAt
                  ? new Date(o.createdAt).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
                  : ''
                return (
                  <li key={o.id}>
                    <Link
                      href={`/oppdrag/${o.slug}`}
                      className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white px-4 py-3 transition hover:border-sea/30 hover:shadow-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{o.tittel}</p>
                        <p className="text-xs text-muted">{kommuneDisplay}{o.onsketTidsrom ? ` · ${o.onsketTidsrom}` : ''}</p>
                      </div>
                      <span className="shrink-0 text-xs text-muted">{dato}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
            <p className="mt-3 text-xs text-muted">
              Driver du bedrift i denne bransjen?{' '}
              <Link href={`/oppdrag?kategori=${id}`} className="text-sea hover:underline">
                Se og svar på oppdrag →
              </Link>
              {' · '}
              <Link
                href="/logg-inn?fra=%2Fmin-side%3Ftype%3Doppdrag"
                className="text-sea hover:underline"
              >
                Legg ut nytt oppdrag
              </Link>
            </p>
          </>
        ) : (
          /* Tom: invitasjon til å legge ut */
          <div className="rounded-2xl border border-dashed border-ink/15 px-5 py-6 text-center">
            <p className="text-sm text-muted">
              Trenger du hjelp fra {cat.label.toLowerCase()}?{' '}
              <Link
                href="/logg-inn?fra=%2Fmin-side%3Ftype%3Doppdrag"
                className="font-medium text-sea hover:underline"
              >
                Legg ut oppdraget her
              </Link>
              {' '}— lokale fagfolk tar kontakt.
            </p>
          </div>
        )}
      </section>

      {/* Aktuelle anbud i denne bransjen (Doffin via NACE↔CPV-mapping) */}
      {categoryTenders.length > 0 && (
        <section className="mt-10">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-eyebrow text-muted">
              Aktuelle anbud i {cat.label}
            </h2>
            <a href="/anbud" className="text-xs text-sea hover:underline">Se alle →</a>
          </div>
          <ul className="space-y-2">
            {categoryTenders.map((t: any) => {
              const frist = t.deadline
                ? new Date(t.deadline).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
                : null
              const daysLeft = t.deadline
                ? Math.ceil((new Date(t.deadline).getTime() - now.getTime()) / 86_400_000)
                : null
              return (
                <li key={t.id}>
                  <a
                    href={t.doffinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between gap-4 rounded-xl border border-ink/10 bg-white px-4 py-3 transition hover:border-sea/30 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                      <p className="text-xs text-muted">
                        {t.buyerName}{t.municipality ? ` · ${t.municipality}` : ''}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      {frist && <span className="text-xs text-muted">{frist}</span>}
                      {daysLeft !== null && daysLeft <= 14 && (
                        <p className={`text-[10px] font-semibold ${daysLeft <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                          {daysLeft === 0 ? 'I dag' : daysLeft === 1 ? '1 dag' : `${daysLeft} dager`}
                        </p>
                      )}
                    </div>
                  </a>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Offentlige innkjøp fra{' '}
            <a href="https://doffin.no" target="_blank" rel="noopener noreferrer" className="text-sea hover:underline">
              Doffin
            </a>
            {' '}(nasjonalt kunngjøringsblad).
          </p>
        </section>
      )}

      {/* Relaterte kategorier */}
      <section className="mt-14">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-eyebrow text-muted">Andre bransjer</h2>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_CATEGORIES.filter(c => c.id !== id).map(c => (
            <Link
              key={c.id}
              href={`/bedrifter/kategori/${c.id}`}
              className="rounded-full bg-fog px-3 py-1.5 text-sm text-sea hover:bg-sea hover:text-white transition-colors"
            >
              {c.icon} {c.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
