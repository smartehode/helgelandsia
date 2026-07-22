import { headers as getHeaders } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayload'
import { IcsImportClient } from '@/components/admin/IcsImportClient'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'ICS-import',
  robots: { index: false, follow: false },
}

export default async function IcsImportPage() {
  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (!user || user.collection !== 'users') redirect('/admin')

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-semibold text-fjord">ICS-kalenderimport</h1>
        <p className="mt-2 text-sm text-muted">
          Importer arrangementer fra en iCalendar-feed (.ics) — f.eks. fra kulturhus, bibliotek eller idrettslag.
          Arrangementer innen de neste 3 månedene vises til forhåndsvisning. Allerede importerte arrangementer
          hoppes automatisk over.
        </p>
      </div>
      <IcsImportClient />
    </div>
  )
}
