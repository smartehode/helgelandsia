import { headers as getHeaders } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getPayloadClient } from '@/lib/getPayload'
import { nameToSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Ta over bedriftsoppføring',
  robots: { index: false },
}

export default async function OvertaPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgnr: string }>
  searchParams: Promise<Record<string, string>>
}) {
  const { orgnr } = await params
  const sp = await searchParams
  const sendt = sp.sendt === '1'

  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'businesses',
    where: {
      and: [
        { orgnr: { equals: orgnr } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 0,
  })
  const b: any = docs[0]
  if (!b) notFound()

  const bizDetailUrl = `/bedrifter/${orgnr}/${nameToSlug(b.name)}`

  const { user }: any = await payload.auth({ headers: await getHeaders() })
  const member = user?.collection === 'members' ? user : null

  const claimStatus: string = b.claimStatus ?? 'unclaimed'

  async function submitClaim() {
    'use server'
    const pl = await getPayloadClient()
    const { user: u }: any = await pl.auth({ headers: await getHeaders() })
    if (!u || u.collection !== 'members') return

    const { docs: fresh } = await pl.find({
      collection: 'businesses',
      where: { orgnr: { equals: orgnr } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const doc: any = fresh[0]
    if (!doc || (doc.claimStatus ?? 'unclaimed') !== 'unclaimed') return

    await pl.update({
      collection: 'businesses',
      id: doc.id,
      data: { owner: u.id, claimStatus: 'pending' } as any,
      overrideAccess: true,
    })
    redirect(`/bedrifter/${orgnr}/overta?sendt=1`)
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      <Link href={bizDetailUrl} className="text-sm text-muted hover:text-sea">
        ← {b.name}
      </Link>

      <h1 className="mt-4 font-serif text-2xl font-bold text-sea">Ta over oppføringen</h1>

      {/* Bekreftelse etter innsending */}
      {sendt && (
        <div className="mt-6 rounded-2xl bg-emerald-50 p-6 text-center ring-1 ring-emerald-200">
          <p className="text-3xl">✓</p>
          <p className="mt-2 font-semibold text-emerald-800">Forespørselen er sendt.</p>
          <p className="mt-1 text-sm text-emerald-700">
            Redaksjonen godkjenner den snart — du får beskjed når det er gjort.
          </p>
          <Link
            href={bizDetailUrl}
            className="mt-4 inline-block text-sm text-sea hover:underline"
          >
            Tilbake til oppføringen
          </Link>
        </div>
      )}

      {/* Ikke innlogget */}
      {!member && !sendt && (
        <div className="mt-6 rounded-2xl bg-fog p-6 text-center">
          <p className="text-muted">
            Du må være innlogget som medlem for å ta over en oppføring.
          </p>
          <Link
            href={`/logg-inn?returnTo=/bedrifter/${orgnr}/overta`}
            className="mt-4 inline-block rounded-xl bg-sea px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-fjord"
          >
            Logg inn
          </Link>
        </div>
      )}

      {/* Allerede overtatt eller til behandling */}
      {member && !sendt && claimStatus !== 'unclaimed' && (
        <div className="mt-6 rounded-2xl bg-fog p-6 text-center">
          <p className="font-semibold text-sea">
            {claimStatus === 'verified'
              ? 'Denne oppføringen er allerede overtatt av en bekreftet eier.'
              : 'Kravforespørselen er allerede til behandling hos redaksjonen.'}
          </p>
        </div>
      )}

      {/* Kravskjema */}
      {member && !sendt && claimStatus === 'unclaimed' && (
        <>
          <p className="mt-3 text-muted">
            Er du eier eller representant for <strong>{b.name}</strong>? Send inn en
            forespørsel — redaksjonen bekrefter og aktiverer tilgangen din.
          </p>

          <form action={submitClaim} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-xl bg-sea px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-fjord"
            >
              Bekreft at jeg representerer denne bedriften
            </button>
          </form>
        </>
      )}

      {/* Fordeler-liste */}
      {!sendt && (
        <div className="mt-8 rounded-2xl bg-paper p-5 ring-1 ring-ink/5 text-sm">
          <p className="font-semibold text-ink">Hva får du som bekreftet eier?</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li>✓ Verifisert-merke på oppføringen</li>
            <li>✓ Mulighet til å legge til logo, bilder og beskrivelse</li>
            <li>✓ Oppdatert kontaktinformasjon og åpningstider</li>
            <li>✓ Direktelenke fra Helgelandsia til nettsiden din</li>
          </ul>
        </div>
      )}
    </div>
  )
}
