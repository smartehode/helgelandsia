export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Bekreft e-post · Helgelandsia',
}

export default async function VerifiserPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="font-serif text-2xl font-bold text-fjord">Ugyldig lenke</h1>
        <p className="mt-3 text-ink/60">Lenken mangler bekreftelsestoken.</p>
        <Link href="/logg-inn" className="mt-6 inline-block rounded-full bg-sea px-8 py-3 text-sm font-medium text-white hover:bg-fjord">
          Tilbake til innlogging
        </Link>
      </div>
    )
  }

  let success = false
  try {
    const payload = await getPayload({ config })
    await payload.verifyEmail({ collection: 'members', token })
    success = true
  } catch {
    // token ugyldig eller utløpt
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      {success ? (
        <>
          <div className="mb-5 text-5xl" aria-hidden>🎉</div>
          <h1 className="font-serif text-2xl font-bold text-fjord">E-posten din er bekreftet</h1>
          <p className="mt-3 text-ink/60">Du kan nå logge inn på Min side.</p>
          <Link
            href="/logg-inn"
            className="mt-6 inline-block rounded-full bg-sea px-8 py-3 font-medium text-white hover:bg-fjord"
          >
            Gå til innlogging
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-serif text-2xl font-bold text-red-600">Bekreftelse mislyktes</h1>
          <p className="mt-3 text-ink/60">Lenken er ugyldig eller utløpt. Prøv å registrere deg på nytt.</p>
          <Link
            href="/logg-inn"
            className="mt-6 inline-block rounded-full bg-sea px-8 py-3 font-medium text-white hover:bg-fjord"
          >
            Tilbake til innlogging
          </Link>
        </>
      )}
    </div>
  )
}
