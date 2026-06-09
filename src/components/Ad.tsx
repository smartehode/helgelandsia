import { getPayloadClient } from '@/lib/getPayload'

const mediaUrl = (m: any) => (m && typeof m === 'object' ? m.url : null)

export async function Ad({ placement, className = '' }: { placement: string; className?: string }) {
  const payload = await getPayloadClient()
  const now = new Date().toISOString()
  const { docs } = await payload.find({
    collection: 'ads',
    where: {
      and: [
        { placement: { equals: placement } },
        { active: { equals: true } },
        { or: [{ startDate: { less_than_equal: now } }, { startDate: { exists: false } }] },
        { or: [{ endDate: { greater_than_equal: now } }, { endDate: { exists: false } }] },
      ],
    },
    limit: 1, depth: 1, sort: '-createdAt',
  })
  const ad: any = docs[0]
  const url = ad ? mediaUrl(ad.image) : null
  if (!ad || !url) return null
  void payload.update({ collection: 'ads', id: ad.id, data: { impressions: (ad.impressions ?? 0) + 1 } }).catch(() => {})
  return (
    <a href={`/ut/${ad.id}`} target="_blank" rel="noopener sponsored"
       className={`relative block overflow-hidden rounded-xl ring-1 ring-black/5 ${className}`}>
      <img src={url} alt={ad.title ?? 'Annonse'} className="block h-auto w-full" />
      <span className="absolute right-2 top-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-white">Annonse</span>
    </a>
  )
}
