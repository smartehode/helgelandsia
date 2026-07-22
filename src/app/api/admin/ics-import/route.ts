import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'
import { assertSafe, safeFetch } from '@/lib/ssrf'
import { parseIcs, type ParsedIcsEvent } from '@/lib/ics/parse'

export const dynamic = 'force-dynamic'

const toLexical = (text: string) => ({
  root: {
    type: 'root', format: '', indent: 0, version: 1, direction: null,
    children: text.split(/\n+/).filter(Boolean).map((line) => ({
      type: 'paragraph', format: '', indent: 0, version: 1, direction: null,
      children: [{ type: 'text', text: line, format: 0, style: '', mode: 'normal', detail: 0, version: 1 }],
    })),
  },
})

const slugify = (s: string) =>
  s.toLowerCase().replace(/æ/g, 'ae').replace(/ø/g, 'o').replace(/å/g, 'a')
   .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// ── Preview action ─────────────────────────────────────────────────────────────

async function handlePreview(req: Request, payload: any): Promise<Response> {
  const ct = req.headers.get('content-type') ?? ''
  let icsContent = ''

  if (ct.includes('multipart/form-data') || ct.includes('application/x-www-form-urlencoded')) {
    const fd = await req.formData()
    const url = fd.get('url') as string | null
    const file = fd.get('file') as File | null

    if (url && url.trim()) {
      try {
        await assertSafe(url.trim())
        const { buffer } = await safeFetch(url.trim(), { maxBytes: 5 * 1024 * 1024 })
        icsContent = buffer.toString('utf-8')
      } catch (err: any) {
        return Response.json({ error: err.message }, { status: 422 })
      }
    } else if (file && file.size > 0) {
      icsContent = await file.text()
    } else {
      return Response.json({ error: 'URL eller fil kreves.' }, { status: 400 })
    }
  } else {
    return Response.json({ error: 'Ugyldig forespørsel.' }, { status: 400 })
  }

  const now = new Date()
  let parsed: ParsedIcsEvent[]
  try {
    parsed = parseIcs(icsContent, now)
  } catch (err: any) {
    return Response.json({ error: 'Kunne ikke lese ICS-filen.' }, { status: 422 })
  }

  if (parsed.length === 0) {
    return Response.json({ error: 'Ingen arrangementer funnet i filen (sjekk at det er en gyldig .ics-fil, og at arrangementene er innen de neste 3 månedene).' }, { status: 422 })
  }

  // Check for existing icsUid entries (batch)
  const occurrenceIds = parsed.map(e => e.occurrenceId)
  let existingSet = new Set<string>()
  try {
    const existing = await payload.find({
      collection: 'events',
      where: { icsUid: { in: occurrenceIds } },
      limit: occurrenceIds.length,
      depth: 0,
      overrideAccess: true,
    })
    existingSet = new Set(existing.docs.map((d: any) => d.icsUid as string))
  } catch {}

  const events = parsed.map(e => ({
    uid: e.uid,
    occurrenceId: e.occurrenceId,
    summary: e.summary,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    location: e.location,
    description: e.description,
    url: e.url,
    isAllDay: e.isAllDay,
    existing: existingSet.has(e.occurrenceId),
    past: e.start < now,
  }))

  return Response.json({ events })
}

// ── Import action ─────────────────────────────────────────────────────────────

interface ImportEvent {
  occurrenceId: string
  summary: string
  start: string
  end: string
  location?: string
  description?: string
  url?: string
  isAllDay?: boolean
}

async function handleImport(req: Request, payload: any): Promise<Response> {
  let body: { events: ImportEvent[]; status: 'draft' | 'published' }
  try { body = await req.json() } catch { return Response.json({ error: 'Ugyldig JSON.' }, { status: 400 }) }

  const { events, status } = body
  if (!Array.isArray(events) || events.length === 0) {
    return Response.json({ error: 'Ingen arrangementer valgt.' }, { status: 400 })
  }
  if (!['draft', 'published'].includes(status)) {
    return Response.json({ error: 'Ugyldig status.' }, { status: 400 })
  }

  let imported = 0
  let skipped = 0
  const errors: string[] = []

  for (const event of events) {
    if (!event.occurrenceId || !event.summary || !event.start) continue

    // Check duplicate
    try {
      const existing = await payload.find({
        collection: 'events',
        where: { icsUid: { equals: event.occurrenceId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (existing.totalDocs > 0) { skipped++; continue }
    } catch {}

    try {
      const startDate = new Date(event.start)
      const endDate = new Date(event.end)
      const titleSlug = `${slugify(event.summary)}-${Date.now().toString(36)}`

      await payload.create({
        collection: 'events',
        draft: status === 'draft',
        data: {
          title: event.summary,
          slug: titleSlug,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          locationName: event.location || undefined,
          description: event.description ? toLexical(event.description) : undefined,
          sourceUrl: event.url || undefined,
          icsUid: event.occurrenceId,
          _status: status,
        },
        overrideAccess: true,
      })
      imported++
    } catch (err: any) {
      errors.push(`«${event.summary}»: ${err.message}`)
    }
  }

  return Response.json({ imported, skipped, errors })
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (!user || user.collection !== 'users') {
    return Response.json({ error: 'Kun administratorer har tilgang.' }, { status: 403 })
  }

  const ct = req.headers.get('content-type') ?? ''
  if (ct.includes('application/json')) {
    return handleImport(req, payload)
  }
  return handlePreview(req, payload)
}
