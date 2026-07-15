import { permanentRedirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function HistorierSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  permanentRedirect(`/leserinnlegg/${slug}`)
}
