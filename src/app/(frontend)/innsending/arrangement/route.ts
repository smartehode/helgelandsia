import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'

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
  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (!user || user.collection !== 'members') {
    return Response.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  const fd = await req.formData()
  const title = String(fd.get('title') || '').trim()
  const startDate = String(fd.get('startDate') || '')
  if (!title || !startDate) {
    return Response.json({ error: 'Tittel og starttidspunkt må fylles ut.' }, { status: 400 })
  }

  // Image: prefer uploaded file, fall back to imported image id
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
  } else {
    const importedId = parseInt(String(fd.get('importedImageId') || ''), 10)
    if (!isNaN(importedId)) imageId = importedId
  }

  const desc = String(fd.get('description') || '').trim()
  const sourceUrl = String(fd.get('sourceUrl') || '').trim() || undefined

  try {
    const doc = await payload.create({
      collection: 'events',
      draft: true,
      data: {
        title,
        slug: `${slugify(title)}-${Date.now().toString(36)}`,
        startDate: new Date(startDate).toISOString(),
        endDate: fd.get('endDate') ? new Date(String(fd.get('endDate'))).toISOString() : undefined,
        locationName: String(fd.get('locationName') || '') || undefined,
        ticketUrl: String(fd.get('ticketUrl') || '') || undefined,
        free: fd.get('free') === 'on',
        price: String(fd.get('price') || '') || undefined,
        description: desc ? toLexical(desc) : undefined,
        image: imageId,
        sourceUrl,
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
