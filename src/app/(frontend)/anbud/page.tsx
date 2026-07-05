import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/getPayload'
import { getCpvLabel, getNoticeTypeLabel } from '@/lib/doffin/cpv'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Offentlige anbud på Helgeland',
  description: 'Aktuelle anbudskonkurranser og offentlige anskaffelser fra Nordland. Kilde: Doffin.',
}

const HELGELAND_KOMMUNER = [
  'Bindal', 'Sømna', 'Brønnøy', 'Vega', 'Vevelstad', 'Herøy',
  'Alstahaug', 'Leirfjord', 'Vefsn', 'Grane', 'Hattfjelldal',
  'Dønna', 'Nesna', 'Hemnes', 'Rana', 'Lurøy', 'Træna', 'Rødøy',
  'Helgeland',
]

function deadlineBadge(deadline: string | null | undefined) {
  if (!deadline) return null
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86_400_000)
  if (days < 0) return null
  const cls = days <= 7
    ? 'rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700'
    : 'rounded-full bg-fog px-2 py-0.5 text-[10px] font-medium text-sea'
  const label = days === 0 ? 'I dag!' : days === 1 ? '1 dag igjen' : `${days} dager igjen`
  return <span className={cls}>{label}</span>
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '–'
  return new Date(iso).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TenderCard({ t }: { t: any }) {
  const cpvLabel = getCpvLabel(t.cpvHovedkode)
  const typeLabel = getNoticeTypeLabel(t.noticeType)
  const isExpiringSoon = t.deadline
    ? Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86_400_000) <= 7
    : false

  return (
    <a
      href={t.doffinUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col gap-3 rounded-2xl bg-paper p-5 ring-1 ring-ink/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-8px_rgba(12,39,51,0.2)]"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-serif text-base font-semibold leading-snug text-ink transition group-hover:text-sea line-clamp-3">
          {t.title}
        </h3>
        {isExpiringSoon && t.deadline && (
          <span className="shrink-0 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
            Snart frist
          </span>
        )}
      </div>

      <p className="text-sm font-medium text-muted">{t.buyerName}</p>

      {t.description && (
        <p className="text-xs text-muted/80 line-clamp-2">{t.description}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        {cpvLabel && (
          <span className="rounded-full bg-fog px-2 py-0.5 text-[10px] font-medium text-sea">
            {cpvLabel}
          </span>
        )}
        <span className="rounded-full bg-fog px-2 py-0.5 text-[10px] font-medium text-muted">
          {typeLabel}
        </span>
        {t.municipality && (
          <span className="rounded-full bg-sun/20 px-2 py-0.5 text-[10px] font-medium text-fjord">
            {t.municipality}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-ink/5 pt-3 text-xs text-muted">
        <span>Publisert {formatDate(t.publicationDate)}</span>
        {t.deadline ? (
          <span className="flex items-center gap-1.5">
            <span className="font-medium text-ink">Frist:</span>
            {formatDate(t.deadline)}
            {deadlineBadge(t.deadline)}
          </span>
        ) : (
          <span className="italic">Ingen frist oppgitt</span>
        )}
      </div>
    </a>
  )
}

export default async function AnbudPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const kommune = params.kommune ?? ''
  const side = Math.max(1, parseInt(params.side ?? '1', 10))
  const pageSize = 20

  const payload = await getPayloadClient()

  const where: any = { status: { equals: 'ACTIVE' } }
  if (kommune) where.municipality = { equals: kommune }

  const result = await payload.find({
    collection: 'tenders' as any,
    where,
    sort: 'deadline',
    limit: pageSize,
    page: side,
    overrideAccess: true,
  })

  const totalPages = result.totalPages ?? 1
  const tenders = result.docs

  // Total aktive (for «Alle»-telleren uavhengig av kommunefilter)
  const totalActiveRes = await payload.find({
    collection: 'tenders' as any,
    where: { status: { equals: 'ACTIVE' } },
    limit: 1,
    overrideAccess: true,
  })
  const totalActiveCount = totalActiveRes.totalDocs

  // Tell per kommune for kommunesidemenyen
  const kommuneCounts: Record<string, number> = {}
  const allWithKommune = await payload.find({
    collection: 'tenders' as any,
    where: { status: { equals: 'ACTIVE' }, municipality: { exists: true } },
    limit: 1000,
    overrideAccess: true,
  })
  for (const t of allWithKommune.docs as any[]) {
    if (t.municipality) kommuneCounts[t.municipality] = (kommuneCounts[t.municipality] ?? 0) + 1
  }

  const makeHref = (p: Record<string, string>) => {
    const sp = new URLSearchParams({ ...params, ...p })
    // fjern tomme verdier
    for (const k of [...sp.keys()]) if (!sp.get(k)) sp.delete(k)
    const q = sp.toString()
    return q ? `/anbud?${q}` : '/anbud'
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-ink sm:text-4xl">
          Offentlige anbud
        </h1>
        <p className="mt-2 text-sm text-muted">
          Aktuelle anskaffelseskonkurranser fra Nordland. Kilde:{' '}
          <a
            href="https://doffin.no"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sea underline underline-offset-2"
          >
            Doffin
          </a>
          . Oppdateres daglig.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Filter-sidebar */}
        <aside className="w-full shrink-0 lg:w-56">
          <div className="rounded-2xl bg-paper p-4 ring-1 ring-ink/5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">
              Kommune
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href={makeHref({ kommune: '', side: '' })}
                  className={`block rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-fog ${!kommune ? 'bg-fog font-semibold text-fjord' : 'text-ink'}`}
                >
                  Alle ({totalActiveCount})
                </Link>
              </li>
              {HELGELAND_KOMMUNER.filter(k => kommuneCounts[k]).map(k => (
                <li key={k}>
                  <Link
                    href={makeHref({ kommune: k, side: '' })}
                    className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm transition hover:bg-fog ${kommune === k ? 'bg-fog font-semibold text-fjord' : 'text-ink'}`}
                  >
                    <span>{k}</span>
                    <span className="text-xs text-muted">{kommuneCounts[k]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Resultatliste */}
        <div className="min-w-0 flex-1">
          {tenders.length === 0 ? (
            <div className="rounded-2xl bg-paper p-8 text-center ring-1 ring-ink/5">
              <p className="text-muted">
                {kommune
                  ? `Ingen aktive anbud fra ${kommune} akkurat nå.`
                  : 'Ingen aktive anbud akkurat nå.'}
              </p>
              {kommune && (
                <Link href="/anbud" className="mt-3 inline-block text-sm text-sea underline">
                  Vis alle kommuner
                </Link>
              )}
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-muted">
                {result.totalDocs} {result.totalDocs === 1 ? 'anbud' : 'anbud'}
                {kommune ? ` fra ${kommune}` : ''}
                {totalPages > 1 ? ` — side ${side} av ${totalPages}` : ''}
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {tenders.map((t: any) => (
                  <TenderCard key={t.id} t={t} />
                ))}
              </div>

              {/* Paginering */}
              {totalPages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-1">
                  {side > 1 && (
                    <Link
                      href={makeHref({ side: String(side - 1) })}
                      className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-fog"
                    >
                      ← Forrige
                    </Link>
                  )}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    const p = i + 1
                    return (
                      <Link
                        key={p}
                        href={makeHref({ side: String(p) })}
                        className={`rounded-lg px-3 py-2 text-sm transition ${side === p ? 'bg-fjord font-semibold text-paper' : 'text-ink hover:bg-fog'}`}
                      >
                        {p}
                      </Link>
                    )
                  })}
                  {side < totalPages && (
                    <Link
                      href={makeHref({ side: String(side + 1) })}
                      className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-fog"
                    >
                      Neste →
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  )
}
