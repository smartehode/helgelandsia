import { getPayloadClient } from '@/lib/getPayload'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any
}

const COLLECTIONS = [
  { slug: 'posts' as const, label: 'artikler', adminSlug: 'posts' },
  { slug: 'events' as const, label: 'arrangementer', adminSlug: 'events' },
  { slug: 'jobs' as const, label: 'stillinger', adminSlug: 'jobs' },
  { slug: 'press-releases' as const, label: 'pressemeldinger', adminSlug: 'press-releases' },
  { slug: 'newsletters' as const, label: 'nyhetsbrev', adminSlug: 'newsletters' },
  { slug: 'oppdrag' as const, label: 'oppdrag', adminSlug: 'oppdrag' },
]

export default async function PendingOverview({ payload: payloadProp }: Props) {
  let claimsCount = 0
  const draftCounts: { slug: string; label: string; count: number }[] = []

  try {
    const payload = payloadProp ?? (await getPayloadClient())

    const [claimsRes, postsRes, eventsRes, jobsRes, pressRes, newsletterRes, oppdragRes] = await Promise.all([
      payload.find({
        collection: 'businesses',
        where: { claimStatus: { equals: 'pending' } },
        limit: 1,
        draft: true,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'posts',
        where: { and: [{ _status: { equals: 'draft' } }, { submittedBy: { exists: true } }] },
        limit: 1,
        draft: true,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'events',
        where: { and: [{ _status: { equals: 'draft' } }, { submittedBy: { exists: true } }] },
        limit: 1,
        draft: true,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'jobs',
        where: { and: [{ _status: { equals: 'draft' } }, { submittedBy: { exists: true } }] },
        limit: 1,
        draft: true,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'press-releases',
        where: { and: [{ _status: { equals: 'draft' } }, { submittedBy: { exists: true } }] },
        limit: 1,
        draft: true,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'newsletters',
        where: { and: [{ _status: { equals: 'draft' } }, { submittedBy: { exists: true } }] },
        limit: 1,
        draft: true,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'oppdrag',
        where: { and: [{ _status: { equals: 'draft' } }, { submittedBy: { exists: true } }] },
        limit: 1,
        draft: true,
        overrideAccess: true,
      }),
    ])

    claimsCount = claimsRes.totalDocs

    const rawCounts = [postsRes, eventsRes, jobsRes, pressRes, newsletterRes, oppdragRes]
    COLLECTIONS.forEach((c, i) => {
      if (rawCounts[i].totalDocs > 0) {
        draftCounts.push({ slug: c.adminSlug, label: c.label, count: rawCounts[i].totalDocs })
      }
    })
  } catch {
    return null
  }

  const hasPending = claimsCount > 0 || draftCounts.length > 0

  return (
    <>
      {hasPending && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem 1.25rem',
          border: '1px solid #fbbf24',
          borderRadius: '0.75rem',
          background: '#fffbeb',
        }}>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.875rem', fontWeight: 600, color: '#92400e' }}>
            Venter på behandling ({claimsCount + draftCounts.reduce((s, d) => s + d.count, 0)})
          </p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {claimsCount > 0 && (
              <li>
                <a
                  href="/admin/collections/businesses?where[claimStatus][equals]=pending"
                  style={{ color: '#b45309', fontSize: '0.875rem', textDecoration: 'none' }}
                >
                  {claimsCount} ventende krav (bedriftsovertakelse) →
                </a>
              </li>
            )}
            {draftCounts.map(({ slug, label, count }) => (
              <li key={slug}>
                <a
                  href={`/admin/collections/${slug}?where[_status][equals]=draft`}
                  style={{ color: '#b45309', fontSize: '0.875rem', textDecoration: 'none' }}
                >
                  {count} {label} venter på godkjenning →
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{
        marginBottom: '2rem',
        padding: '0.875rem 1.25rem',
        border: '1px solid #e5e7eb',
        borderRadius: '0.75rem',
        background: '#f9fafb',
      }}>
        <p style={{ margin: '0 0 0.6rem', fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Verktøy
        </p>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          <li>
            <a
              href="/admin-verktoy/ics-import"
              style={{ color: '#0369a1', fontSize: '0.875rem', textDecoration: 'none' }}
            >
              Importer arrangementer (ICS) →
            </a>
          </li>
        </ul>
      </div>
    </>
  )
}
