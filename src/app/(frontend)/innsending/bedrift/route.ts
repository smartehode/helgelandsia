import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'
import { checkRateLimit, getClientIp, LIMITS, rateLimitResponse } from '@/lib/rate-limit'

const slugify = (s: string) =>
  s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
   .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const toLexical = (text: string) => ({
  root: {
    type: 'root', format: '', indent: 0, version: 1, direction: null,
    children: text.split(/\n+/).filter(Boolean).map((line) => ({
      type: 'paragraph', format: '', indent: 0, version: 1, direction: null,
      children: [{ type: 'text', text: line, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
    })),
  },
})

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
  const name = String(fd.get('name') || '').trim()
  if (!name) {
    return Response.json({ error: 'Bedriftsnavn må fylles ut.' }, { status: 400 })
  }

  let logoId: number | undefined
  const file = fd.get('logo') as File | null
  if (file && typeof file === 'object' && file.size > 0) {
    if (!file.type.startsWith('image/')) return Response.json({ error: 'Filen må være et bilde.' }, { status: 400 })
    if (file.size > 8 * 1024 * 1024) return Response.json({ error: 'Bildet er for stort (maks 8 MB).' }, { status: 400 })
    const media: any = await payload.create({
      collection: 'media',
      data: { alt: name },
      file: { data: Buffer.from(await file.arrayBuffer()), name: file.name, mimetype: file.type, size: file.size },
    })
    logoId = media.id
  }

  const desc = String(fd.get('description') || '').trim()
  try {
    const doc = await payload.create({
      collection: 'businesses',
      draft: true,
      data: {
        name,
        tagline: String(fd.get('tagline') || '') || undefined,
        description: desc ? toLexical(desc) as any : undefined,
        phone: String(fd.get('phone') || '') || undefined,
        email: String(fd.get('email') || '') || undefined,
        website: String(fd.get('website') || '') || undefined,
        address: String(fd.get('address') || '') || undefined,
        logo: logoId,
        slug: `${slugify(name)}-${Date.now().toString(36)}`,
        submittedBy: user.id,
        _status: 'draft',
      },
    })
    return Response.json({ ok: true, id: doc.id })
  } catch (err: any) {
    payload.logger.error(err)
    return Response.json({ error: 'Kunne ikke lagre innsendingen.' }, { status: 500 })
  }
}
