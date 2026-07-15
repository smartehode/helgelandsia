import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { format } from 'date-fns'
import { nb } from 'date-fns/locale'
import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'
import { LogoutButton } from '@/components/LogoutButton'
import { SubmissionTabs } from '@/components/SubmissionTabs'
import { filtrerAktuelleAnbud } from '@/lib/doffin/match'
import { bizUrl } from '@/lib/slug'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Min side' }

const StatusBadge = ({ status }: { status?: string }) =>
  status === 'published' ? (
    <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800">
      Publisert
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
      Venter
    </span>
  )

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

  const [
    eventsRes, postsRes, jobsRes, businessesRes, pressRes, newsletterRes,
    ownedVerifiedRes, ownedPendingRes,
  ]: any = await Promise.all([
    payload.find({ collection: 'events',          where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
    payload.find({ collection: 'posts',           where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
    payload.find({ collection: 'jobs',            where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
    payload.find({ collection: 'businesses',      where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
    payload.find({ collection: 'press-releases',  where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
    payload.find({ collection: 'newsletters',     where: { submittedBy: { equals: user.id } }, sort: '-createdAt', draft: true, limit: 50, depth: 0 }),
    payload.find({
      collection: 'businesses',
      where: { and: [{ owner: { equals: user.id } }, { claimStatus: { equals: 'verified' } }] },
      sort: 'name', limit: 50, depth: 0, overrideAccess: true,
    }),
    payload.find({
      collection: 'businesses',
      where: { and: [{ owner: { equals: user.id } }, { claimStatus: { equals: 'pending' } }] },
      sort: 'name', limit: 50, depth: 0, overrideAccess: true,
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
  const hasBusinesses = verifiedBusinesses.length > 0 || pendingBusinesses.length > 0

  const toggleAnbudsvarsling = async () => {
    'use server'
    const p = await getPayloadClient()
    await p.update({
      collection: 'members',
      id: user.id,
      data: { anbudsvarsling: user.anbudsvarsling === false } as any,
      overrideAccess: true,
    })
    revalidatePath('/min-side')
    redirect('/min-side')
  }

  // Kombiner anbud-matcher fra alle verifiserte bedrifter, dedup på tender-ID
  let matchedAnbud: any[] = []
  if (verifiedBusinesses.length > 0) {
    const now = new Date()
    const tendersRes: any = await payload.find({
      collection: 'tenders' as any,
      where: { status: { equals: 'ACTIVE' } },
      limit: 200,
      sort: 'deadline',
      overrideAccess: true,
    })
    const activeTenders = (tendersRes.docs as any[]).filter(
      (t: any) => !t.deadline || new Date(t.deadline) > now,
    )
    const seen = new Set<string>()
    for (const b of verifiedBusinesses) {
      for (const t of filtrerAktuelleAnbud(activeTenders, b.naceKode, 10)) {
        if (!seen.has(t.id)) { seen.add(t.id); matchedAnbud.push(t) }
      }
    }
    matchedAnbud.sort((a, b) => {
      if (!a.deadline) return 1
      if (!b.deadline) return -1
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
    })
    matchedAnbud = matchedAnbud.slice(0, 10)
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">

      {/* Topptekst */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-fjord">Min side</h1>
          <p className="mt-0.5 text-sm text-muted">{user.name || user.email}</p>
        </div>
        <LogoutButton />
      </div>

      {redigert && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Bedriftsprofilen er oppdatert.
        </div>
      )}

      {/* To-kolonne grid */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">

        {/* ── VENSTRE: Send inn innhold ── */}
        <section>
          <div className="rounded-xl border border-ink/10 bg-white">
            <div className="border-b border-ink/5 px-4 py-3">
              <h2 className="text-sm font-semibold text-fjord">Send inn innhold</h2>
            </div>
            <div className="p-5">
              <SubmissionTabs />
            </div>
          </div>
        </section>

        {/* ── HØYRE: sidepanel ── */}
        <aside className="space-y-5">

          {/* 1. Mine bedrifter */}
          {hasBusinesses && (
            <div className="rounded-xl border border-ink/10 bg-white">
              <div className="border-b border-ink/5 px-4 py-3">
                <h2 className="text-sm font-semibold text-fjord">Mine bedrifter</h2>
              </div>
              <ul className="divide-y divide-ink/5">
                {verifiedBusinesses.map((b: any) => (
                  <li key={b.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-ink">{b.name}</p>
                    {b.orgnr && (
                      <p className="mb-2 mt-0.5 text-[11px] text-muted">Org.nr. {b.orgnr}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <Link
                        href={bizUrl(b)}
                        className="rounded border border-ink/15 px-3 py-1 text-xs text-ink/70 transition hover:border-sea hover:text-sea"
                      >
                        Se profil
                      </Link>
                      <Link
                        href={`/min-side/bedrift/${b.slug}/rediger`}
                        className="rounded bg-fjord px-3 py-1 text-xs font-semibold text-white transition hover:bg-sea"
                      >
                        Rediger
                      </Link>
                    </div>
                  </li>
                ))}
                {pendingBusinesses.map((b: any) => (
                  <li key={b.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{b.name}</p>
                      {b.orgnr && (
                        <p className="mt-0.5 text-[11px] text-muted">Org.nr. {b.orgnr}</p>
                      )}
                    </div>
                    <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800">
                      Venter på godkjenning
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Varsler */}
          {verifiedBusinesses.length > 0 && (
            <div className="rounded-xl border border-ink/10 bg-white">
              <div className="border-b border-ink/5 px-4 py-3">
                <h2 className="text-sm font-semibold text-fjord">Varsler</h2>
              </div>
              <div className="px-4 py-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-ink">Anbudsvarsling</p>
                    <p className="mt-0.5 text-xs text-muted">
                      Motta e-post ved nye offentlige anbud som kan passe bedriften din.
                    </p>
                  </div>
                  <form action={toggleAnbudsvarsling} className="shrink-0">
                    <button
                      type="submit"
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                        user.anbudsvarsling !== false
                          ? 'bg-sea text-white hover:bg-fjord'
                          : 'bg-fog text-ink/50 hover:bg-ink/10'
                      }`}
                    >
                      {user.anbudsvarsling !== false ? 'På' : 'Av'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}

          {/* 3. Aktuelle anbud */}
          {verifiedBusinesses.length > 0 && (
            <div className="rounded-xl border border-ink/10 bg-white">
              <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
                <h2 className="text-sm font-semibold text-fjord">Aktuelle anbud</h2>
                <Link
                  href="/anbud"
                  className="text-[11px] text-muted transition hover:text-sea"
                >
                  Se alle Nordland-anbud →
                </Link>
              </div>
              {matchedAnbud.length === 0 ? (
                <p className="px-4 py-4 text-xs text-muted">Ingen aktuelle anbud akkurat nå.</p>
              ) : (
                <ul className="divide-y divide-ink/5">
                  {matchedAnbud.map((t: any) => {
                    const days = t.deadline
                      ? Math.ceil((new Date(t.deadline).getTime() - Date.now()) / 86_400_000)
                      : null
                    return (
                      <li key={t.id}>
                        <a
                          href={t.doffinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-start justify-between gap-3 px-4 py-3 transition hover:bg-fog/50"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-ink">{t.title}</p>
                            <p className="truncate text-[11px] text-muted">{t.buyerName}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            {t.deadline ? (
                              <>
                                <p className="text-[11px] text-muted">
                                  {format(new Date(t.deadline), 'd. MMM', { locale: nb })}
                                </p>
                                {days !== null && days <= 14 && (
                                  <p className={`text-[10px] font-semibold ${days <= 7 ? 'text-red-600' : 'text-amber-600'}`}>
                                    {days === 0 ? 'I dag' : days === 1 ? '1 d' : `${days} d`}
                                  </p>
                                )}
                              </>
                            ) : (
                              <p className="text-[11px] italic text-muted">Ingen frist</p>
                            )}
                          </div>
                        </a>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )}

          {/* 4. Mine innsendinger */}
          <div className="rounded-xl border border-ink/10 bg-white">
            <div className="border-b border-ink/5 px-4 py-3">
              <h2 className="text-sm font-semibold text-fjord">Mine innsendinger</h2>
            </div>
            {submissions.length === 0 ? (
              <p className="px-4 py-4 text-xs text-muted">Du har ikke sendt inn noe ennå.</p>
            ) : (
              <ul className="divide-y divide-ink/5">
                {submissions.slice(0, 20).map((s: any) => (
                  <li
                    key={`${s.kind}-${s.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{s.title}</p>
                      <p className="text-[11px] text-muted">
                        {s.kind} · {format(new Date(s.createdAt), 'd. MMM yyyy', { locale: nb })}
                      </p>
                    </div>
                    <StatusBadge status={s._status} />
                  </li>
                ))}
              </ul>
            )}
          </div>

        </aside>
      </div>
    </div>
  )
}
