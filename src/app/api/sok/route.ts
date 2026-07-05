import { type NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayload'

export const dynamic = 'force-dynamic'

// Konverterer BRREG-navn i VERSALER til Title Case.
// Beholder juridiske suffikser (AS, ASA, …) i versaler.
// Konverterer kun hvis hele navnet ser ut til å være all-caps.
const LEGAL_SUFFIXES = new Set(['AS', 'ASA', 'ANS', 'DA', 'BA', 'NUF', 'SA', 'IKS', 'IS', 'ENK', 'KF', 'FKF', 'SE', 'STI', 'SF'])
const SMALL_WORDS_NO = new Set(['og', 'i', 'på', 'av', 'til', 'fra', 'for', 'ved', 'med', 'de'])

function normalizeBizName(name: string): string {
  const words = name.trim().split(/\s+/)
  const isAllCaps = words
    .filter(w => /[A-ZÆØÅ]/i.test(w))
    .every(w => w === w.toUpperCase() && w.length > 1)
  if (!isAllCaps) return name
  return words
    .map((w, i) => {
      if (LEGAL_SUFFIXES.has(w)) return w
      const lw = w.toLowerCase()
      if (i > 0 && SMALL_WORDS_NO.has(lw)) return lw
      return lw.charAt(0).toUpperCase() + lw.slice(1)
    })
    .join(' ')
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json({})

  const payload = await getPayloadClient()
  const now = new Date().toISOString()

  const [bizRes, eventsRes, jobsRes, postsRes, tendersRes] = await Promise.allSettled([
    payload.find({
      collection: 'businesses',
      where: {
        and: [
          { _status: { equals: 'published' } },
          // NULL-safe showOnPublicListing — matcher publicListingWhere
          {
            or: [
              { showOnPublicListing: { equals: true } },
              { showOnPublicListing: { exists: false } },
            ],
          },
          // Kun hovedenheter i søk — underenheter lager dubletter (samme navn)
          {
            or: [
              { brregEntityType: { not_equals: 'underenhet' } },
              { brregEntityType: { exists: false } },
            ],
          },
          // ENK-eksklusjon (samme som publicListingWhere)
          {
            or: [
              { organisasjonsform: { not_equals: 'Enkeltpersonforetak' } },
              { organisasjonsform: { exists: false } },
            ],
          },
          { or: [{ name: { like: q } }, { orgnr: { like: q } }] },
        ],
      },
      limit: 4,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'events',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { startDate: { greater_than_equal: now } },
          { title: { like: q } },
        ],
      },
      sort: 'startDate',
      limit: 4,
      depth: 0,
    }),
    payload.find({
      collection: 'jobs',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { title: { like: q } },
        ],
      },
      limit: 4,
      depth: 0,
    }),
    payload.find({
      collection: 'posts',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { title: { like: q } },
        ],
      },
      sort: '-publishedAt',
      limit: 4,
      depth: 0,
    }),
    payload.find({
      collection: 'tenders' as any,
      where: {
        and: [
          { status: { equals: 'ACTIVE' } },
          {
            or: [
              { deadline: { greater_than: now } },
              { deadline: { exists: false } },
            ],
          },
          { or: [{ title: { like: q } }, { buyerName: { like: q } }] },
        ],
      },
      limit: 4,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const ok = <T,>(r: PromiseSettledResult<T>): T | null =>
    r.status === 'fulfilled' ? r.value : null

  const biz = ok(bizRes)
  const events = ok(eventsRes)
  const jobs = ok(jobsRes)
  const posts = ok(postsRes)
  const tenders = ok(tendersRes)

  return NextResponse.json({
    businesses: (biz?.docs ?? []).map((b: any) => ({
      id: b.id,
      title: normalizeBizName(b.name),
      url: `/bedrifter/${b.slug}`,
      meta: b.kommunenavn ?? undefined,
    })),
    events: (events?.docs ?? []).map((e: any) => ({
      id: e.id,
      title: e.title,
      url: `/arrangementer/${e.slug}`,
      meta: e.startDate
        ? new Date(e.startDate).toLocaleDateString('nb-NO', { day: 'numeric', month: 'short' })
        : undefined,
    })),
    jobs: (jobs?.docs ?? []).map((j: any) => ({
      id: j.id,
      title: j.title,
      url: `/stillinger/${j.slug}`,
      meta: j.employer ?? undefined,
    })),
    posts: (posts?.docs ?? []).map((p: any) => ({
      id: p.id,
      title: p.title,
      url: `/historier/${p.slug}`,
      meta: undefined,
    })),
    tenders: (tenders?.docs ?? []).map((t: any) => ({
      id: t.id,
      title: t.title,
      url: t.doffinUrl,
      meta: t.buyerName ?? undefined,
      external: true,
    })),
  })
}
