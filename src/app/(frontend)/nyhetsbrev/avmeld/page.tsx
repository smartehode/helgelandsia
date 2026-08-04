import Link from 'next/link'
import { getPayloadClient } from '@/lib/getPayload'

export const dynamic = 'force-dynamic'

export default async function AvmeldPage({
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
    where: { avmeldToken: { equals: token } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const abonnent = docs[0] as any

  if (!abonnent) {
    return <StatusPage type="ugyldig" />
  }

  if (abonnent.status === 'avmeldt') {
    return <StatusPage type="allerede_avmeldt" />
  }

  await payload.update({
    collection: 'abonnenter',
    id: abonnent.id,
    data: { status: 'avmeldt' } as any,
    overrideAccess: true,
  })

  return <StatusPage type="suksess" />
}

function StatusPage({ type }: { type: 'suksess' | 'allerede_avmeldt' | 'ugyldig' }) {
  if (type === 'suksess') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="mb-3 font-serif text-3xl font-semibold text-fjord">
          Du er avmeldt
        </h1>
        <p className="mb-8 text-ink/70">
          Du vil ikke lenger motta «Uka på Helgeland». Du kan melde deg på igjen
          når som helst.
        </p>
        <Link href="/nyhetsbrev" className="text-sm font-medium text-sea hover:underline">
          Meld deg på igjen →
        </Link>
      </div>
    )
  }

  if (type === 'allerede_avmeldt') {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="mb-3 font-serif text-3xl font-semibold text-fjord">
          Allerede avmeldt
        </h1>
        <p className="mb-4 text-ink/70">Du er ikke lenger abonnent.</p>
        <Link href="/nyhetsbrev" className="text-sm font-medium text-sea hover:underline">
          Meld deg på igjen →
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <h1 className="mb-3 font-serif text-3xl font-semibold text-fjord">
        Ugyldig lenke
      </h1>
      <p className="text-ink/70">
        Lenken er ugyldig. Kontakt oss hvis du ønsker å melde deg av.
      </p>
    </div>
  )
}
