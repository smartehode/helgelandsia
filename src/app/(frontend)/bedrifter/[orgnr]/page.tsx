import { notFound, permanentRedirect } from 'next/navigation'
import { getPayloadClient } from '@/lib/getPayload'
import { nameToSlug } from '@/lib/slug'

export const dynamic = 'force-dynamic'

// Gammel URL-form: /bedrifter/{orgnr} (uten navneslug).
// 301-redirect til ny kanonisk form: /bedrifter/{orgnr}/{navneslug}.
export default async function BedriftRedirectPage({
  params,
}: {
  params: Promise<{ orgnr: string }>
}) {
  const { orgnr } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'businesses',
    where: {
      and: [
        { or: [{ orgnr: { equals: orgnr } }, { slug: { equals: orgnr } }] },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const b = docs[0] as any
  if (!b) notFound()

  const canonicalOrgnr = b.orgnr ?? orgnr
  permanentRedirect(`/bedrifter/${canonicalOrgnr}/${nameToSlug(b.name)}`)
}
