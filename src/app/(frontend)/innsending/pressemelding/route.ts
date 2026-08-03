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
  const title = String(fd.get('title') || '').trim()
  const content = String(fd.get('content') || '').trim()
  if (!title || !content) {
    return Response.json({ error: 'Tittel og innhold må fylles ut.' }, { status: 400 })
  }

  // Valider bedrift-kobling: aldri stol på klientverdien (regel 10)
  let validatedBedriftId: number | undefined
  const bedriftIdRaw = fd.get('bedriftId')
  if (bedriftIdRaw && String(bedriftIdRaw).trim() !== '') {
    const parsed = Number(bedriftIdRaw)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return Response.json({ error: 'Ugyldig bedrift-ID.' }, { status: 400 })
    }
    // Sjekk at innlogget member faktisk eier og er verifisert på bedriften
    const { docs } = await payload.find({
      collection: 'businesses',
      where: {
        and: [
          { id: { equals: parsed } },
          { owner: { equals: user.id } },
          { claimStatus: { equals: 'verified' } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    if (docs.length === 0) {
      return Response.json({ error: 'Du har ikke tilgang til denne bedriften.' }, { status: 403 })
    }
    validatedBedriftId = parsed
  }

  let imageId: number | undefined
  const file = fd.get('image') as File | null
  if (file && typeof file === 'object' && file.size > 0) {
    if (!file.type.startsWith('image/')) return Response.json({ error: 'Filen må være et bilde.' }, { status: 400 })
    if (file.size > 8 * 1024 * 1024) return Response.json({ error: 'Bildet er for stort (maks 8 MB).' }, { status: 400 })
    const media: any = await payload.create({
      collection: 'media',
      data: { alt: title },
      file: { data: Buffer.from(await file.arrayBuffer()), name: file.name, mimetype: file.type, size: file.size },
    })
    imageId = media.id
  }

  try {
    const doc = await payload.create({
      collection: 'press-releases',
      draft: true,
      data: {
        title,
        organization: String(fd.get('organization') || '') || undefined,
        excerpt: String(fd.get('excerpt') || '') || undefined,
        content: toLexical(content) as any,
        contactName: String(fd.get('contactName') || '') || undefined,
        contactEmail: String(fd.get('contactEmail') || '') || undefined,
        contactPhone: String(fd.get('contactPhone') || '') || undefined,
        image: imageId,
        slug: `${slugify(title)}-${Date.now().toString(36)}`,
        submittedBy: user.id,
        bedrift: validatedBedriftId,
        _status: 'draft',
      },
    })
    return Response.json({ ok: true, id: doc.id })
  } catch (err: any) {
    payload.logger.error(err)
    return Response.json({ error: 'Kunne ikke lagre innsendingen.' }, { status: 500 })
  }
}
