import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayload'
import { checkRateLimit, getClientIp, LIMITS, rateLimitResponse } from '@/lib/rate-limit'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`kontakt:${ip}`, LIMITS.CONTACT_REVEAL)
  if (!rl.ok) return rateLimitResponse('/api/bedrift/kontakt', ip, rl.retryAfter!) as any

  const { slug } = await params
  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'businesses',
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
      ],
    },
    limit: 1,
    depth: 0,
  })

  const b = docs[0] as any
  if (!b) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Returner KUN kontaktfeltene — ingenting annet fra dokumentet
  return NextResponse.json({
    phone: (b.phone as string) || null,
    email: (b.email as string) || null,
  })
}
