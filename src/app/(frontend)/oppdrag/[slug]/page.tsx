import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'
import { getCategoryById } from '@/lib/businesses/categories'
import { SITE } from '@/lib/og'
import { MeldInteresseKnapp } from '@/components/MeldInteresseKnapp'

export const dynamic = 'force-dynamic'

function formatDato(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}

export async function generateMetadata({
  params,
}: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'oppdrag',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1, depth: 0,
  })
  const o: any = docs[0]
  if (!o) return {}
  const cat = getCategoryById(o.kategori)
  const title = o.tittel
  const description = o.beskrivelse
    ? o.beskrivelse.slice(0, 120)
    : `Lokalt oppdrag i ${cat?.label ?? 'bransjen'} på Helgeland`
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE}/oppdrag/${slug}` },
  }
}

export default async function OppdragDetaljPage({
  params,
}: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayloadClient()

  // Hent oppdrag — kun publiserte (ALDRI kontaktinfo i denne fetchen)
  const { docs } = await payload.find({
    collection: 'oppdrag',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
  })
  const o: any = docs[0]
  if (!o) notFound()

  const cat = getCategoryById(o.kategori)
  const kommuneDisplay = o.kommune
    ? (o.kommune as string).charAt(0).toUpperCase() + (o.kommune as string).slice(1)
    : ''

  // Sjekk om innlogget member har en verifisert bedrift i riktig kategori
  let kanMeldeInteresse = false
  let harMeldtInteresse = false
  let relevantBizId: number | null = null

  try {
    const { user }: any = await payload.auth({ headers: await getHeaders() })
    if (user && user.collection === 'members') {
      const bizRes = await payload.find({
        collection: 'businesses',
        where: {
          and: [
            { owner: { equals: user.id } },
            { claimStatus: { equals: 'verified' } },
            { _status: { equals: 'published' } },
            { naceCategory: { equals: o.kategori } },
          ],
        },
        limit: 1, depth: 0, overrideAccess: true,
      })
      if (bizRes.docs.length > 0) {
        kanMeldeInteresse = true
        relevantBizId = bizRes.docs[0].id as number
        // Sjekk om allerede interessert (hent interessert-lista med overrideAccess)
        const oppdragFull: any = await payload.findByID({
          collection: 'oppdrag',
          id: o.id,
          depth: 0,
          overrideAccess: true,
        })
        harMeldtInteresse = (oppdragFull.interessert ?? []).some((entry: any) => {
          const id = typeof entry.bedrift === 'object' ? entry.bedrift?.id : entry.bedrift
          return Number(id) === relevantBizId
        })
      }
    }
  } catch { /* stille feil — kanMeldeInteresse forblir false */ }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <nav className="mb-6 text-sm text-muted">
        <Link href="/oppdrag" className="hover:text-sea">Oppdrag</Link>
        <span className="mx-2">›</span>
        <span className="text-ink">{o.tittel}</span>
      </nav>

      <article className="rounded-2xl border border-ink/10 bg-white px-6 py-8">
        <header className="mb-6">
          <h1 className="font-serif text-2xl font-bold text-fjord">{o.tittel}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            {cat && (
              <span className="rounded-full bg-fog px-2.5 py-1">
                {cat.icon} {cat.label}
              </span>
            )}
            {kommuneDisplay && <span>{kommuneDisplay}</span>}
            <span>{formatDato(o.createdAt)}</span>
          </div>
        </header>

        {o.onsketTidsrom && (
          <div className="mb-4 flex items-start gap-2">
            <span className="shrink-0 text-xs font-medium text-muted">Tidsrom:</span>
            <span className="text-sm text-ink">{o.onsketTidsrom}</span>
          </div>
        )}

        {o.beskrivelse && (
          <div className="mb-6 whitespace-pre-wrap text-sm leading-relaxed text-ink">
            {o.beskrivelse}
          </div>
        )}

        {/* Kontaktinfo er ALDRI synlig her — kun via "Meld interesse"-flyten */}

        <hr className="my-6 border-ink/10" />

        <div className="rounded-xl border border-ink/10 bg-fog/40 p-4">
          <p className="mb-3 text-sm font-medium text-ink">Er du bedrift og kan hjelpe?</p>

          {kanMeldeInteresse ? (
            harMeldtInteresse ? (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                Du har allerede meldt interesse for dette oppdraget. Oppdragsgiveren vil ta kontakt.
              </div>
            ) : (
              <MeldInteresseKnapp oppdragSlug={slug} bizId={relevantBizId!} />
            )
          ) : (
            <p className="text-sm text-muted">
              Innlogget bedriftseier med verifisert profil i riktig bransje kan melde interesse —{' '}
              <Link
                href={`/logg-inn?fra=${encodeURIComponent(`/oppdrag/${slug}`)}`}
                className="text-sea hover:underline"
              >
                logg inn
              </Link>{' '}
              for å se knappen.
            </p>
          )}
        </div>
      </article>

      <p className="mt-4 text-center text-[11px] text-muted">
        Helgelandsia formidler kun kontakt og er ikke part i avtaler.
      </p>
    </div>
  )
}
