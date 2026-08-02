import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/getPayload'
import { BUSINESS_CATEGORIES, getCategoryById } from '@/lib/businesses/categories'
import { SITE } from '@/lib/og'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Lokale oppdrag',
  description: 'Finn lokale oppdrag på Helgeland. Privatpersoner og bedrifter søker hjelp fra lokale fagfolk.',
  openGraph: {
    title: 'Lokale oppdrag',
    description: 'Finn lokale oppdrag på Helgeland.',
    url: `${SITE}/oppdrag`,
  },
}

function formatDato(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'long', year: 'numeric' })
  } catch { return '' }
}

export default async function OppdragPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const kategori = sp.kategori ?? ''
  const kommune = sp.kommune ?? ''

  const payload = await getPayloadClient()

  const where: any = { and: [{ _status: { equals: 'published' } }] }
  if (kategori) where.and.push({ kategori: { equals: kategori } })
  if (kommune) where.and.push({ kommune: { equals: kommune } })

  const { docs: oppdrag, totalDocs } = await payload.find({
    collection: 'oppdrag',
    where,
    sort: '-createdAt',
    limit: 50,
    depth: 0,
  })

  const valgtKategori = kategori ? getCategoryById(kategori) : null

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">

      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-fjord">Lokale oppdrag</h1>
          <p className="mt-1 text-sm text-muted">
            Privatpersoner og bedrifter på Helgeland søker hjelp fra lokale fagfolk.
          </p>
        </div>
        <Link
          href="/logg-inn?fra=%2Fmin-side%3Ftype%3Doppdrag"
          className="shrink-0 rounded-xl bg-fjord px-4 py-2 text-sm font-semibold text-white transition hover:bg-sea"
        >
          + Send inn oppdrag
        </Link>
      </div>

      {/* Filtre */}
      <form method="get" className="mb-8 flex flex-wrap gap-3">
        <select name="kategori" defaultValue={kategori}
          className="rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink focus:border-sea focus:outline-none">
          <option value="">Alle bransjer</option>
          {BUSINESS_CATEGORIES.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
          ))}
        </select>
        <input name="kommune" defaultValue={kommune} placeholder="Kommune…"
          className="w-40 rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-sea focus:outline-none" />
        <button type="submit"
          className="rounded-lg bg-sea px-4 py-2 text-sm font-medium text-white transition hover:bg-fjord">
          Filtrer
        </button>
        {(kategori || kommune) && (
          <Link href="/oppdrag" className="rounded-lg border border-ink/15 px-4 py-2 text-sm text-muted hover:text-sea">
            Nullstill
          </Link>
        )}
      </form>

      {valgtKategori && (
        <p className="mb-4 text-sm text-muted">
          Viser oppdrag i: <strong className="text-ink">{valgtKategori.icon} {valgtKategori.label}</strong>
        </p>
      )}

      {/* Oppdragsliste — INGEN kontaktinfo synlig */}
      {oppdrag.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-ink/15 py-16 text-center">
          <p className="text-muted">
            {(kategori || kommune) ? 'Ingen oppdrag funnet med dette filteret.' : 'Ingen aktive oppdrag akkurat nå.'}
          </p>
          <Link
            href="/logg-inn?fra=%2Fmin-side%3Ftype%3Doppdrag"
            className="mt-4 inline-block rounded-xl bg-fjord px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sea"
          >
            Send inn det første oppdraget
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-muted">{totalDocs} oppdrag</p>
          <ul className="space-y-3">
            {(oppdrag as any[]).map((o) => {
              const cat = getCategoryById(o.kategori)
              const kommuneDisplay = o.kommune
                ? (o.kommune as string).charAt(0).toUpperCase() + (o.kommune as string).slice(1)
                : ''
              return (
                <li key={o.id}>
                  <Link
                    href={`/oppdrag/${o.slug}`}
                    className="group flex flex-col gap-1 rounded-xl border border-ink/10 bg-white px-5 py-4 transition hover:border-sea/30 hover:shadow-sm"
                  >
                    <h2 className="font-serif text-base font-semibold text-ink transition group-hover:text-sea">
                      {o.tittel}
                    </h2>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                      {cat && (
                        <span className="rounded-full bg-fog px-2 py-0.5">
                          {cat.icon} {cat.label}
                        </span>
                      )}
                      {kommuneDisplay && <span>{kommuneDisplay}</span>}
                      {o.onsketTidsrom && <span>· {o.onsketTidsrom}</span>}
                      <span className="ml-auto">{formatDato(o.createdAt)}</span>
                    </div>
                    {o.beskrivelse && (
                      <p className="mt-1 line-clamp-2 text-xs text-muted">{o.beskrivelse}</p>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </>
      )}
    </div>
  )
}
