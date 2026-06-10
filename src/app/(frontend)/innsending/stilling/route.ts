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
  const employer = String(fd.get('employer') || '').trim()
  if (!title || !employer) {
    return Response.json({ error: 'Stillingstittel og arbeidsgiver må fylles ut.' }, { status: 400 })
  }

  const desc = String(fd.get('description') || '').trim()
  const deadlineRaw = String(fd.get('deadline') || '')

  try {
    const doc = await payload.create({
      collection: 'jobs',
      draft: true,
      data: {
        title,
        employer,
        description: desc ? toLexical(desc) as any : undefined,
        jobType: (String(fd.get('jobType') || '') || undefined) as 'full-time' | 'part-time' | 'temp' | 'contract' | 'seasonal' | 'apprentice' | undefined,
        deadline: deadlineRaw ? new Date(deadlineRaw).toISOString() : undefined,
        locationName: String(fd.get('locationName') || '') || undefined,
        applicationUrl: String(fd.get('applicationUrl') || '') || undefined,
        applicationEmail: String(fd.get('applicationEmail') || '') || undefined,
        contactName: String(fd.get('contactName') || '') || undefined,
        contactPhone: String(fd.get('contactPhone') || '') || undefined,
        slug: `${slugify(title)}-${Date.now().toString(36)}`,
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
