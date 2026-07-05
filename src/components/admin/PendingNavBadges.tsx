// beforeNavLinks: viser ventende saker øverst i admin-navigasjonen.
// Mottar `payload` direkte fra Payload 3 sin RenderServerComponent (serverProps).
// Bruker Payloads CSS-klasser (.nav__link, .nav__link-label) for nativt utseende.

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any
}

const SUBMISSION_COLLECTIONS = [
  { slug: 'posts', label: 'Artikler' },
  { slug: 'events', label: 'Arrangementer' },
  { slug: 'jobs', label: 'Stillinger' },
  { slug: 'press-releases', label: 'Pressemeldinger' },
  { slug: 'newsletters', label: 'Nyhetsbrev' },
] as const

const badge = (n: number) => (
  <span style={{
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '1.1rem',
    height: '1.1rem',
    padding: '0 0.3rem',
    borderRadius: '0.6rem',
    background: '#f59e0b',
    color: '#1c1917',
    fontSize: '0.65rem',
    fontWeight: 700,
    lineHeight: 1,
    marginLeft: 'auto',
    flexShrink: 0,
  }}>
    {n}
  </span>
)

export default async function PendingNavBadges({ payload }: Props) {
  if (!payload) return null

  type PendingItem = { slug: string; label: string; count: number; href: string }
  const items: PendingItem[] = []

  try {
    const [claimsRes, postsRes, eventsRes, jobsRes, pressRes, newsletterRes] = await Promise.all([
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
    ])

    if (claimsRes.totalDocs > 0) {
      items.push({
        slug: 'businesses',
        label: 'Bedrifter',
        count: claimsRes.totalDocs,
        href: '/admin/collections/businesses?where[claimStatus][equals]=pending',
      })
    }

    const rawCounts = [postsRes, eventsRes, jobsRes, pressRes, newsletterRes]
    SUBMISSION_COLLECTIONS.forEach((c, i) => {
      if (rawCounts[i].totalDocs > 0) {
        items.push({
          slug: c.slug,
          label: c.label,
          count: rawCounts[i].totalDocs,
          href: `/admin/collections/${c.slug}?where[_status][equals]=draft`,
        })
      }
    })
  } catch {
    return null
  }

  if (items.length === 0) return null

  return (
    <div style={{ marginBottom: '0.25rem' }}>
      {/* Seksjonsheader — matcher Payloads NavGroup-labelstil */}
      <div style={{
        padding: '0.4rem var(--gutter-h, 20px) 0.25rem',
        fontSize: '0.6rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        color: 'var(--theme-text)',
        opacity: 0.45,
      }}>
        Venter på behandling
      </div>

      {items.map(({ slug, label, count, href }) => (
        <a
          key={slug}
          href={href}
          className="nav__link"
          style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}
        >
          <span className="nav__link-label" style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '0.25rem' }}>
            {label}
            {badge(count)}
          </span>
        </a>
      ))}

      {/* Skillelinje mellom pending-seksjonen og vanlig navmenyen */}
      <div style={{
        margin: '0.4rem var(--gutter-h, 20px) 0.1rem',
        borderTop: '1px solid var(--theme-border-color)',
        opacity: 0.4,
      }} />
    </div>
  )
}
