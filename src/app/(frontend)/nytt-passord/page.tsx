import type { Metadata } from 'next'
import NyttPassordClient from './NyttPassordClient'

export const metadata: Metadata = {
  title: 'Glemt passord · Helgelandsia',
}

export default async function NyttPassordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="mb-2 font-serif text-2xl font-bold text-fjord">
        {token ? 'Velg nytt passord' : 'Glemt passord?'}
      </h1>
      {!token && (
        <p className="mb-6 text-sm text-ink/60">
          Skriv inn e-postadressen din, så sender vi deg en lenke for å tilbakestille passordet.
        </p>
      )}
      <NyttPassordClient token={token} />
    </div>
  )
}
