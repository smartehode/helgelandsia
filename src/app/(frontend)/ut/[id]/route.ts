import { getPayloadClient } from '@/lib/getPayload'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()
  let target = process.env.NEXT_PUBLIC_SERVER_URL || '/'
  try {
    const ad: any = await payload.findByID({ collection: 'ads', id })
    if (ad?.linkUrl) target = ad.linkUrl
    if (ad) await payload.update({ collection: 'ads', id, data: { clicks: (ad.clicks ?? 0) + 1 } })
  } catch {}
  return Response.redirect(target, 302)
}
