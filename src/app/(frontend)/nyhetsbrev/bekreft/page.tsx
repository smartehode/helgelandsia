import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'

export const dynamic = 'force-dynamic'

export default async function BekreftPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token || typeof token !== 'string' || token.length < 32) {
    return <StatusPage type="ugyldig" />
  }

  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'abonnenter',
    where: { bekreftToken: { equals: token } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const abonnent = docs[0] as any

  if (!abonnent) {
    return <StatusPage type="ugyldig" />
  }

  if (abonnent.status === 'aktiv') {
    return <StatusPage type="allerede_aktiv" />
  }

  // Aktiver abonnementet og sett samtykkeTidspunkt (dobbel opt-in fullført)
  await payload.update({
    collection: 'abonnenter',
    id: abonnent.id,
    data: {
      status: 'aktiv',
      samtykkeTidspunkt: new Date().toISOString(),
    } as any,
    overrideAccess: true,
  })

  return <StatusPage type="suksess" />
}

function StatusPage({ type }: { type: 'suksess' | 'allerede_aktiv' | 'ugyldig' }) {
  if (type === 'suksess') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mb-6 text-5xl">✓</div>
        <h1 className="mb-3 font-serif text-3xl font-semibold text-fjord">
          Du er påmeldt!
        </h1>
        <p className="mb-8 text-ink/70">
          Velkommen til «Uka på Helgeland». Du vil motta ukentlige oppdateringer
          om det som skjer i regionen. Avmelding finner du i bunnen av hvert brev.
        </p>
        <Link
          href="/"
          className="rounded-xl bg-fjord px-6 py-3 text-sm font-semibold text-white transition hover:bg-sea"
        >
          Til forsiden
        </Link>
      </div>
    )
  }

  if (type === 'allerede_aktiv') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="mb-3 font-serif text-3xl font-semibold text-fjord">
          Du er allerede påmeldt
        </h1>
        <p className="mb-8 text-ink/70">
          E-postadressen din er allerede registrert og aktiv.
        </p>
        <Link href="/" className="text-sm font-medium text-sea hover:underline">
          Til forsiden →
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="mb-3 font-serif text-3xl font-semibold text-fjord">
        Ugyldig lenke
      </h1>
      <p className="mb-8 text-ink/70">
        Lenken er ugyldig eller har utløpt. Meld deg på på nytt for å få en ny
        bekreftelses-e-post.
      </p>
      <Link
        href="/nyhetsbrev"
        className="rounded-xl bg-fjord px-6 py-3 text-sm font-semibold text-white transition hover:bg-sea"
      >
        Meld deg på
      </Link>
    </div>
  )
}
