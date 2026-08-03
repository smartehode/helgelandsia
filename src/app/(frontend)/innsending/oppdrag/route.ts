import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'
import { checkRateLimit, getClientIp, LIMITS, rateLimitResponse } from '@/lib/rate-limit'

const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`submission:${ip}`, LIMITS.SUBMISSION)
  if (!rl.ok) return rateLimitResponse('innsending', ip, rl.retryAfter!)

  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (!user || user.collection !== 'members') {
    return Response.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  const fd = await req.formData()
  const tittel = String(fd.get('tittel') || '').trim()
  const kategori = String(fd.get('kategori') || '').trim()
  const kommune = String(fd.get('kommune') || '').trim()

  if (!tittel || !kategori || !kommune) {
    return Response.json({ error: 'Tittel, kategori og kommune må fylles ut.' }, { status: 400 })
  }

  const beskrivelse = String(fd.get('beskrivelse') || '').trim()
  const onsketTidsrom = String(fd.get('onsketTidsrom') || '').trim() || undefined
  const kontaktEpost = String(fd.get('kontaktEpost') || '').trim() || undefined
  const kontaktTelefon = String(fd.get('kontaktTelefon') || '').trim() || undefined

  try {
    const doc = await payload.create({
      collection: 'oppdrag',
      draft: true,
      overrideAccess: true,
      data: {
        tittel,
        beskrivelse: beskrivelse || undefined,
        kategori,
        kommune,
        onsketTidsrom,
        kontaktEpost,
        kontaktTelefon,
        slug: `${slugify(tittel)}-${Date.now().toString(36)}`,
        submittedBy: user.id,
        _status: 'draft',
      } as any,
    })
    return Response.json({ ok: true, id: doc.id })
  } catch (err: any) {
    payload.logger.error(err)
    return Response.json({ error: 'Kunne ikke lagre innsendingen.' }, { status: 500 })
  }
}
