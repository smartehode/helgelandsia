import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayload'
import { AuthForm } from '@/components/AuthForm'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Logg inn' }

export default async function LoginPage() {
  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (user && user.collection === 'members') redirect('/min-side')

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="mb-2 text-center font-serif text-3xl font-semibold text-fjord">Velkommen</h1>
      <p className="mb-8 text-center text-muted">Logg inn for å bidra med innhold på Helgelandsia.</p>
      <AuthForm />
    </div>
  )
}
