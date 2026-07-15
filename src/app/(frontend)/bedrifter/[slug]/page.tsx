import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import type { Metadata } from 'next'
import { RichText } from '@/components/RichText'
import { ShareButtons } from '@/components/ShareButtons'
import { KontaktReveal } from '@/components/KontaktReveal'
import { getPayloadClient } from '@/lib/getPayload'
import { SITE, abs } from '@/lib/og'
import { getCategoryById } from '@/lib/businesses/categories'
import { getPercentilerForBusiness } from '@/lib/regnskap/percentiler'

export const dynamic = 'force-dynamic'

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`
}

function fmtKr(n: number | null | undefined): string {
  if (n == null) return '—'
  return new Intl.NumberFormat('nb-NO', { maximumFractionDigits: 0 }).format(n) + ' kr'
}

async function getBusiness(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'businesses',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const b: any = await getBusiness(slug)
  if (!b) return {}
  const meta = b.meta ?? {}
  const img = abs(mediaUrl(meta.image ?? b.logo, 'hero') ?? mediaUrl(meta.image ?? b.logo))
  // "[Navn] – [nace kort] i [kommune]" — unik per bedrift, aldri identisk
  const shortNace = b.naceBeskrivelse
    ? b.naceBeskrivelse.split(',')[0].slice(0, 45).trimEnd() + (b.naceBeskrivelse.split(',')[0].length > 45 ? '…' : '')
    : null
  const title = meta.title ?? [
    b.name,
    shortNace ? `– ${shortNace}` : null,
    b.kommunenavn ? `i ${b.kommunenavn}` : null,
  ].filter(Boolean).join(' ')
  const description = meta.description
    ?? b.tagline
    ?? [b.naceBeskrivelse, b.kommunenavn ? `i ${b.kommunenavn}` : null].filter(Boolean).join(' ')
  return {
    title,
    description,
    alternates: { canonical: `${SITE}/bedrifter/${slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE}/bedrifter/${slug}`,
      images: img ? [{ url: img }] : undefined,
      type: 'website',
    },
    twitter: { card: img ? 'summary_large_image' : 'summary' },
  }
}

const DAYS: Record<string, string> = {
  mon: 'Man', tue: 'Tir', wed: 'Ons', thu: 'Tor', fri: 'Fre', sat: 'Lør', sun: 'Søn',
}

export default async function BusinessPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const b: any = await getBusiness(slug)
  if (!b) notFound()

  const payload = await getPayloadClient()

  const cat = b.naceCategory ? getCategoryById(b.naceCategory) : null

  // Hent underenheter, regnskap og percentiler parallelt
  const [subunitsResult, regnskapResult, percentilResult] = await Promise.all([
    b.orgnr
      ? payload.find({
          collection: 'businesses',
          where: { parentOrgnr: { equals: b.orgnr } },
          sort: 'name',
          limit: 50,
          depth: 0,
          overrideAccess: true,
        })
      : null,
    b.orgnr
      ? payload.find({
          collection: 'regnskap' as any,
          where: { orgnr: { equals: b.orgnr } },
          sort: '-aar',
          limit: 1,
          overrideAccess: true,
        })
      : null,
    b.orgnr && b.naceCategory && cat
      ? getPercentilerForBusiness(payload, b.orgnr, b.naceCategory, cat.label)
      : null,
  ])

  const subunits = subunitsResult?.docs ?? []
  const regnskap: any = (regnskapResult as any)?.docs?.[0] ?? null
  const percentil = percentilResult
  const isBrreg = b.source === 'brreg'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: b.name,
    ...(b.orgnr && {
      identifier: { '@type': 'PropertyValue', name: 'Organisasjonsnummer', value: b.orgnr },
    }),
    ...(b.tagline && { description: b.tagline }),
    // Nettside er synlig på siden — OK å inkludere. Telefon/e-post holdes bak KontaktReveal.
    ...(b.website && { url: b.website }),
    ...(b.kommunenavn && {
      address: { '@type': 'PostalAddress', addressLocality: b.kommunenavn, addressCountry: 'NO' },
    }),
    ...(b.lat && b.lng && {
      geo: { '@type': 'GeoCoordinates', latitude: b.lat, longitude: b.lng },
    }),
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="mx-auto max-w-4xl px-4 py-12">
      {/* Tittel-seksjon */}
      <div className="flex items-start gap-4">
        {mediaUrl(b.logo, 'thumbnail') && (
          <Image
            src={mediaUrl(b.logo, 'thumbnail')!}
            alt={b.logo?.alt ?? b.name}
            width={80} height={80}
            className="rounded-xl object-contain ring-1 ring-ink/10 flex-shrink-0"
          />
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-serif text-2xl font-bold text-sea md:text-3xl">{b.name}</h1>
            {b.claimed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-sea/10 px-2 py-0.5 text-xs font-medium text-sea">
                ✓ Verifisert av eier
              </span>
            )}
            {b.featured && (
              <span className="rounded-full bg-sun px-2 py-0.5 text-xs font-bold text-fjord">★ Anbefalt</span>
            )}
          </div>
          {b.organisasjonsform && (
            <p className="mt-0.5 text-sm text-muted">{b.organisasjonsform}</p>
          )}
          {b.tagline && <p className="mt-1 text-slate-600">{b.tagline}</p>}
          <div className="mt-2 flex flex-wrap gap-2">
            {cat && (
              <span className="rounded-full bg-fog px-2 py-0.5 text-xs font-medium text-sea">
                {cat.icon} {cat.label}
              </span>
            )}
            {b.kommunenavn && (
              <span className="rounded-full bg-fog px-2 py-0.5 text-xs text-muted">{b.kommunenavn}</span>
            )}
          </div>
          <div className="mt-2">
            <ShareButtons title={b.name} />
          </div>
        </div>
      </div>

      {/* Innhold + sidebar */}
      <div className="mt-8 grid gap-8 md:grid-cols-3">
        {/* Venstre: beskrivelse + beriket innhold */}
        <div className="md:col-span-2 space-y-6">
          {b.description && <RichText data={b.description} />}

          {/* Bildegalleri */}
          {Array.isArray(b.gallery) && b.gallery.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {b.gallery.map((g: any, i: number) => {
                const url = mediaUrl(g.image, 'card') ?? mediaUrl(g.image)
                return url ? (
                  <img key={i} src={url} alt="" className="rounded-xl object-cover aspect-video w-full" />
                ) : null
              })}
            </div>
          )}

          {/* BRREG-fakta */}
          {isBrreg && (
            <div className="rounded-2xl bg-fog/60 p-5 ring-1 ring-ink/5">
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-eyebrow text-muted">Registerdata</h2>
              <dl className="grid gap-y-2 text-sm sm:grid-cols-2">
                {b.orgnr && (
                  <>
                    <dt className="text-muted">Organisasjonsnummer</dt>
                    <dd>
                      <a
                        href={`https://virksomhet.brreg.no/${b.orgnr}`}
                        target="_blank" rel="noopener"
                        className="text-sea hover:underline"
                      >
                        {b.orgnr}
                      </a>
                    </dd>
                  </>
                )}
                {b.naceBeskrivelse && (
                  <>
                    <dt className="text-muted">Næring</dt>
                    <dd>{b.naceKode && <span className="mr-1 text-muted">{b.naceKode}</span>}{b.naceBeskrivelse}</dd>
                  </>
                )}
                {b.antallAnsatte != null && (
                  <>
                    <dt className="text-muted">Ansatte</dt>
                    <dd>{b.antallAnsatte}</dd>
                  </>
                )}
                {b.registreringsdato && (
                  <>
                    <dt className="text-muted">Registrert</dt>
                    <dd>{fmtDate(b.registreringsdato)}</dd>
                  </>
                )}
              </dl>

              {/* Nøkkeltall fra Regnskapsregisteret */}
              {regnskap && (
                <div className="mt-4 border-t border-ink/10 pt-4">
                  <div className="mb-2 flex items-baseline justify-between gap-2">
                    <h3 className="text-sm font-semibold uppercase tracking-eyebrow text-muted">
                      Nøkkeltall ({regnskap.aar})
                    </h3>
                    {b.orgnr && (
                      <a
                        href={`https://virksomhet.brreg.no/${b.orgnr}`}
                        target="_blank"
                        rel="noopener"
                        className="text-[10px] text-sea hover:underline"
                      >
                        Fullstendig årsregnskap →
                      </a>
                    )}
                  </div>
                  <dl className="grid gap-y-1.5 text-sm sm:grid-cols-2">
                    {regnskap.omsetning != null && (
                      <>
                        <dt className="text-muted">Omsetning</dt>
                        <dd className="font-medium">{fmtKr(regnskap.omsetning)}</dd>
                      </>
                    )}
                    {regnskap.driftsresultat != null && (
                      <>
                        <dt className="text-muted">Driftsresultat</dt>
                        <dd className={`font-medium ${regnskap.driftsresultat < 0 ? 'text-red-600' : ''}`}>
                          {fmtKr(regnskap.driftsresultat)}
                        </dd>
                      </>
                    )}
                    {regnskap.aarsresultat != null && (
                      <>
                        <dt className="text-muted">Årsresultat</dt>
                        <dd className={`font-medium ${regnskap.aarsresultat < 0 ? 'text-red-600' : ''}`}>
                          {fmtKr(regnskap.aarsresultat)}
                        </dd>
                      </>
                    )}
                    {regnskap.egenkapital != null && (
                      <>
                        <dt className="text-muted">Egenkapital</dt>
                        <dd className={`font-medium ${regnskap.egenkapital < 0 ? 'text-red-600' : ''}`}>
                          {fmtKr(regnskap.egenkapital)}
                        </dd>
                      </>
                    )}
                  </dl>

                  {/* Percentil-badger — kun topp 25 % vises, stille ellers */}
                  {percentil && (percentil.omsetningLabel || percentil.driftsmarginLabel) && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {percentil.omsetningLabel && (
                        <span className="inline-flex items-center rounded-full bg-sea/10 px-2.5 py-0.5 text-[11px] font-medium text-sea">
                          {percentil.omsetningLabel} omsetning i {percentil.kategorinavn} på Helgeland
                        </span>
                      )}
                      {percentil.driftsmarginLabel && (
                        <span className="inline-flex items-center rounded-full bg-sea/10 px-2.5 py-0.5 text-[11px] font-medium text-sea">
                          {percentil.driftsmarginLabel} driftsmargin i {percentil.kategorinavn} på Helgeland
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {b.brregLastSynced && (
                <p className="mt-3 text-[10px] text-muted">
                  Sist oppdatert fra BRREG: {fmtDate(b.brregLastSynced)}
                </p>
              )}
            </div>
          )}

          {/* Underenheter (filialer) */}
          {subunits.length > 0 && (
            <div>
              <h2 className="mb-3 font-serif text-lg font-semibold text-sea">
                Avdelinger ({subunits.length})
              </h2>
              <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
                {subunits.map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-medium text-ink">{s.name}</span>
                    <span className="text-muted">{s.kommunenavn}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* "Ta over"-knapp: vises til alle når oppføringen er ukrevd */}
          {isBrreg && (b.claimStatus ?? 'unclaimed') === 'unclaimed' && (
            <div className="rounded-2xl border border-dashed border-ink/20 p-5 text-center">
              <p className="text-sm text-muted">Er dette din bedrift?</p>
              <Link
                href={`/bedrifter/${slug}/overta`}
                className="mt-2 inline-block rounded-xl bg-fog px-4 py-2 text-sm font-medium text-sea hover:bg-sea hover:text-white transition-colors"
              >
                Ta over oppføringen
              </Link>
            </div>
          )}
        </div>

        {/* Høyre: kontakt + kart */}
        <aside className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-black/5 self-start">
          <h2 className="font-semibold text-sea">Kontakt</h2>
          {b.address && <p className="text-sm text-slate-600">{b.address}</p>}
          {(b.city || b.kommunenavn) && (
            <p className="text-sm text-slate-600">
              {[b.city || b.kommunenavn, b.county, b.country].filter(Boolean).join(', ')}
            </p>
          )}
          <KontaktReveal slug={slug} hasPhone={Boolean(b.phone)} hasEmail={Boolean(b.email)} />
          {b.website && (
            <p className="text-sm">🔗 <a className="text-sea hover:underline" href={b.website} target="_blank" rel="noopener">Nettside</a></p>
          )}
          {b.social?.facebook && (
            <p className="text-sm">📘 <a className="text-sea hover:underline" href={b.social.facebook} target="_blank" rel="noopener">Facebook</a></p>
          )}
          {b.social?.instagram && (
            <p className="text-sm">📸 <a className="text-sea hover:underline" href={b.social.instagram} target="_blank" rel="noopener">Instagram</a></p>
          )}

          {Array.isArray(b.openingHours) && b.openingHours.length > 0 && (
            <div>
              <h3 className="mt-3 text-sm font-semibold">Åpningstider</h3>
              <ul className="mt-1 space-y-0.5 text-sm text-slate-600">
                {b.openingHours.map((h: any, i: number) => (
                  <li key={i}>{DAYS[h.day] ?? h.day}: {h.opens}–{h.closes}</li>
                ))}
              </ul>
            </div>
          )}

          {b.lat && b.lng && (
            <div className="mt-2 overflow-hidden rounded-xl">
              <iframe
                title="Kart"
                width="100%" height="200"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${b.lng - 0.015},${b.lat - 0.01},${b.lng + 0.015},${b.lat + 0.01}&layer=mapnik&marker=${b.lat},${b.lng}`}
                className="border-0"
              />
              <a
                href={`https://www.openstreetmap.org/?mlat=${b.lat}&mlon=${b.lng}#map=15/${b.lat}/${b.lng}`}
                target="_blank" rel="noopener"
                className="block pt-1 text-center text-xs text-muted hover:underline"
              >
                Åpne i kart
              </a>
            </div>
          )}
        </aside>
      </div>
    </div>
    </>
  )
}
