import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayload'
import { AuthForm } from '@/components/AuthForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Logg inn' }

function safeFra(raw: string | undefined): string | undefined {
  if (typeof raw !== 'string') return undefined
  if (!raw.startsWith('/') || raw.startsWith('//')) return undefined
  return raw
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const fra = safeFra(sp.fra)

  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (user && user.collection === 'members') redirect(fra ?? '/min-side')

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="mb-2 text-center font-serif text-3xl font-semibold text-fjord">Velkommen</h1>
      <p className="mb-8 text-center text-muted">Logg inn for å bidra med innhold på Helgelandsia.</p>
      <AuthForm fra={fra} />
    </div>
  )
}
