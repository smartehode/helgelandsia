import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'
import { LogoutButton } from '@/components/LogoutButton'
import { SubmissionTabs } from '@/components/SubmissionTabs'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Min side' }

const statusBadge = (s?: string) =>
  s === 'published'
    ? <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">Publisert</span>
    : <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">Venter på godkjenning</span>

export default async function MinSide({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const redigert = sp.redigert === '1'

  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (!user || user.collection !== 'members') redirect('/logg-inn')

  const [eventsRes, postsRes, jobsRes, businessesRes, pressRes, newsletterRes, ownedVerifiedRes, ownedPendingRes]: any =
    await Promise.all([
      payload.find({ collection: 'events', where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
      payload.find({ collection: 'posts', where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
      payload.find({ collection: 'jobs', where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
      payload.find({ collection: 'businesses', where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
      payload.find({ collection: 'press-releases', where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
      payload.find({ collection: 'newsletters', where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
      payload.find({
        collection: 'businesses',
        where: { and: [{ owner: { equals: user.id } }, { claimStatus: { equals: 'verified' } }] },
        sort: 'name',
        limit: 50,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'businesses',
        where: { and: [{ owner: { equals: user.id } }, { claimStatus: { equals: 'pending' } }] },
        sort: 'name',
        limit: 50,
        depth: 0,
        overrideAccess: true,
      }),
    ])

  const submissions = [
    ...eventsRes.docs.map((d: any) => ({ ...d, kind: 'Arrangement' })),
    ...postsRes.docs.map((d: any) => ({ ...d, kind: 'Artikkel' })),
    ...jobsRes.docs.map((d: any) => ({ ...d, kind: 'Stilling' })),
    ...businessesRes.docs.map((d: any) => ({ ...d, title: d.name, kind: 'Bedrift' })),
    ...pressRes.docs.map((d: any) => ({ ...d, kind: 'Pressemelding' })),
    ...newsletterRes.docs.map((d: any) => ({ ...d, kind: 'Nyhetsbrev' })),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const verifiedBusinesses: any[] = ownedVerifiedRes.docs
  const pendingBusinesses: any[] = ownedPendingRes.docs

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-fjord">Min side</h1>
          <p className="mt-1 text-muted">Logget inn som {user.name || user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {redigert && (
        <div className="mt-6 rounded-2xl bg-emerald-50 px-5 py-4 text-sm text-emerald-800 ring-1 ring-emerald-200">
          Bedriftsprofilen er oppdatert og endringene er synlige på nettsiden.
        </div>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-fjord">Send inn innhold</h2>
        <div className="rounded-2xl bg-paper p-6 ring-1 ring-ink/5">
          <SubmissionTabs />
        </div>
      </section>

      {(verifiedBusinesses.length > 0 || pendingBusinesses.length > 0) && (
        <section className="mt-10">
          <h2 className="mb-4 font-serif text-xl font-semibold text-fjord">Mine bedrifter</h2>
          <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
            {verifiedBusinesses.map((b: any) => (
              <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-ink">{b.name}</p>
                  {b.orgnr && <p className="text-xs text-muted">Org.nr. {b.orgnr}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/bedrifter/${b.slug}`}
                    className="text-xs text-muted underline-offset-2 hover:text-sea hover:underline"
                  >
                    Se profil
                  </Link>
                  <Link
                    href={`/min-side/bedrift/${b.slug}/rediger`}
                    className="rounded-full bg-sea px-4 py-1.5 text-xs font-semibold text-white hover:bg-fjord transition"
                  >
                    Rediger
                  </Link>
                </div>
              </li>
            ))}
            {pendingBusinesses.map((b: any) => (
              <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-ink">{b.name}</p>
                  {b.orgnr && <p className="text-xs text-muted">Org.nr. {b.orgnr}</p>}
                </div>
                <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                  Venter på godkjenning
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-serif text-xl font-semibold text-fjord">Mine innsendinger</h2>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted">Du har ikke sendt inn noe ennå.</p>
        ) : (
          <ul className="divide-y divide-ink/5 rounded-2xl bg-paper ring-1 ring-ink/5">
            {submissions.map((s: any) => (
              <li key={`${s.kind}-${s.id}`} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium text-ink">{s.title}</p>
                  <p className="text-xs text-muted">{s.kind} · {format(new Date(s.createdAt), 'd. MMM yyyy', { locale: nb })}</p>
                </div>
                {statusBadge(s._status)}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
