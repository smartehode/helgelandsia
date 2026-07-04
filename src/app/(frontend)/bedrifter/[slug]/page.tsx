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

export const dynamic = 'force-dynamic'

const mediaUrl = (m: any, size?: string) =>
  m && typeof m === 'object' ? (size && m.sizes?.[size]?.url) || m.url : null

function fmtDate(d: string | null | undefined): string {
  if (!d) return ''
  const dt = new Date(d)
  return `${dt.getDate()}.${dt.getMonth() + 1}.${dt.getFullYear()}`
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
  const title = meta.title ?? b.name
  const description = meta.description ?? b.tagline ?? b.naceBeskrivelse
  return {
    title,
    description,
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

  // Hent underenheter (draft, overrides access) og vis i listen
  const subunitsResult = b.orgnr
    ? await payload.find({
        collection: 'businesses',
        where: { parentOrgnr: { equals: b.orgnr } },
        sort: 'name',
        limit: 50,
        depth: 0,
        overrideAccess: true,
      })
    : null

  const subunits = subunitsResult?.docs ?? []
  const cat = b.naceCategory ? getCategoryById(b.naceCategory) : null
  const isBrreg = b.source === 'brreg'

  return (
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
  )
}
