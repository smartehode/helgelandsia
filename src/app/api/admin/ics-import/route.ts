import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'
import { assertSafe, safeFetch } from '@/lib/ssrf'
import { parseIcs } from '@/lib/ics/parse'

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

// ── Image helpers ─────────────────────────────────────────────────────────────

const FB_EXT_UA = 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'

function extractFacebookEventId(url: string): string | null {
  try {
    const u = new URL(url)
    if (!u.hostname.includes('facebook.com') && !u.hostname.includes('fb.com')) return null
    // Handles /events/{id}/ and /events/slug-text/{id}/ formats
    const m = u.pathname.match(/\/events\/.*?(\d{10,})\/?$/)
    return m ? m[1] : null
  } catch { return null }
}

async function tryFetchImage(url: string, title: string, payload: any, ua?: string): Promise<number | null> {
  try {
    await assertSafe(url)
    const { buffer, contentType } = await safeFetch(url, {
      maxBytes: 8 * 1024 * 1024,
      ...(ua ? { headers: { 'User-Agent': ua } } : {}),
    })
    if (!contentType.startsWith('image/')) return null
    const ext = contentType.includes('png') ? 'png' : contentType.includes('gif') ? 'gif' : contentType.includes('webp') ? 'webp' : 'jpg'
    const media: any = await payload.create({
      collection: 'media',
      data: { alt: title || 'ICS-bilde' },
      file: { data: buffer, name: `ics-${Date.now()}.${ext}`, mimetype: contentType, size: buffer.length },
      overrideAccess: true,
    })
    return media.id ?? null
  } catch { return null }
}

async function fetchFacebookEventCover(eventId: string, title: string, payload: any): Promise<number | null> {
  // lookaside.fbsbx.com (IP 148.122.16.252 — offentlig Facebook CDN) krever
  // facebookexternalhit-UA for å returnere image/jpeg direkte.
  // Med vår default-UA svarer Facebook med en HTML-JS-redirect i stedet.
  const url = `https://lookaside.fbsbx.com/lookaside/crawler/media/?media_id=${eventId}`
  return tryFetchImage(url, title, payload, FB_EXT_UA)
}

async function fetchOgImageUrl(pageUrl: string): Promise<string | null> {
  try {
    await assertSafe(pageUrl)
    const { buffer } = await safeFetch(pageUrl, { maxBytes: 3 * 1024 * 1024 })
    const html = buffer.toString('utf-8').slice(0, 200_000)
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    return m ? m[1] : null
  } catch { return null }
}

async function resolveImage(
  attachUrl: string | undefined,
  sourceUrl: string | undefined,
  title: string,
  payload: any,
): Promise<number | null> {
  // Prioritet: a) ATTACH i ICS → b) Facebook lookaside → c) og:image fra sourceUrl
  if (attachUrl) {
    const id = await tryFetchImage(attachUrl, title, payload)
    if (id) {
      console.log(`[ICS-bilde] «${title.slice(0, 60)}» → ATTACH`)
      return id
    }
  }
  if (sourceUrl) {
    const fbEventId = extractFacebookEventId(sourceUrl)
    if (fbEventId) {
      const id = await fetchFacebookEventCover(fbEventId, title, payload)
      if (id) {
        console.log(`[ICS-bilde] «${title.slice(0, 60)}» → FB_LOOKASIDE (event_id=${fbEventId})`)
        return id
      }
    }
    const ogImg = await fetchOgImageUrl(sourceUrl)
    if (ogImg) {
      const abs = (() => { try { return new URL(ogImg, sourceUrl).href } catch { return null } })()
      if (abs) {
        // Facebook-eventer returnerer lookaside-URL som og:image — det er allerede prøvd over
        const isFbLookaside = abs.includes('lookaside.fbsbx.com')
        if (!isFbLookaside) {
          const id = await tryFetchImage(abs, title, payload)
          if (id) {
            console.log(`[ICS-bilde] «${title.slice(0, 60)}» → OG_IMAGE`)
            return id
          }
        }
      }
    }
  }
  console.log(`[ICS-bilde] «${title.slice(0, 60)}» → ingen bilde`)
  return null
}

// ── Preview ───────────────────────────────────────────────────────────────────

async function handlePreview(req: Request, payload: any): Promise<Response> {
  const fd = await req.formData()
  const file = fd.get('file') as File | null
  const content = fd.get('content') as string | null

  let icsContent = ''
  if (file && file.size > 0) {
    icsContent = await file.text()
  } else if (content && content.trim()) {
    icsContent = content.trim()
  } else {
    return Response.json({ error: 'Last opp en .ics-fil eller lim inn ICS-innhold.' }, { status: 400 })
  }

  const now = new Date()
  let parsed
  try { parsed = parseIcs(icsContent, now) } catch {
    return Response.json({ error: 'Kunne ikke lese ICS-innholdet — er det gyldig iCalendar-format?' }, { status: 422 })
  }

  // Limit to events from last 30 days to avoid huge result sets from old RRULE series
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400_000)
  const relevant = parsed.filter(e => e.start >= thirtyDaysAgo)

  if (relevant.length === 0) {
    return Response.json({ error: 'Ingen arrangementer funnet (sjekk at .ics-filen er gyldig og at arrangementene er innen de neste 3 månedene).' }, { status: 422 })
  }

  // Batch check for existing icsUid
  const occurrenceIds = relevant.map(e => e.occurrenceId)
  let existingSet = new Set<string>()
  try {
    const existing = await payload.find({
      collection: 'events',
      where: { icsUid: { in: occurrenceIds } },
      limit: occurrenceIds.length,
      depth: 0,
      overrideAccess: true,
    })
    existingSet = new Set(existing.docs.map((d: any) => String(d.icsUid)))
  } catch {}

  const events = relevant.map(e => ({
    uid: e.uid,
    occurrenceId: e.occurrenceId,
    summary: e.summary,
    start: e.start.toISOString(),
    end: e.end.toISOString(),
    location: e.location,
    description: e.description,
    url: e.url,
    attachUrl: e.attachUrl,
    isAllDay: e.isAllDay,
    existing: existingSet.has(e.occurrenceId),
    past: e.end < now,
    hasImage: !!(e.attachUrl || e.url),
  }))

  return Response.json({ events })
}

// ── Import ────────────────────────────────────────────────────────────────────

interface ImportEvent {
  occurrenceId: string
  summary: string
  start: string
  end: string
  location?: string
  description?: string
  url?: string
  attachUrl?: string
  isAllDay?: boolean
  existing: boolean
  past: boolean
}

interface ImportBody {
  events: ImportEvent[]
  status: 'draft' | 'published'
  skipPast: boolean
  update: boolean
  fetchImages: boolean
}

type ResultStatus = 'created' | 'updated' | 'skipped_past' | 'skipped_duplicate' | 'error'

interface EventResult {
  occurrenceId: string
  summary: string
  status: ResultStatus
  error?: string
}

async function handleImport(body: ImportBody, payload: any): Promise<Response> {
  const { events, status, skipPast, update, fetchImages } = body
  if (!Array.isArray(events) || events.length === 0) {
    return Response.json({ error: 'Ingen arrangementer valgt.' }, { status: 400 })
  }
  if (!['draft', 'published'].includes(status)) {
    return Response.json({ error: 'Ugyldig status.' }, { status: 400 })
  }

  const now = new Date()
  const results: EventResult[] = []

  for (const ev of events) {
    if (!ev.occurrenceId || !ev.summary || !ev.start) continue

    // Skip past events if requested
    if (skipPast && new Date(ev.end) < now) {
      results.push({ occurrenceId: ev.occurrenceId, summary: ev.summary, status: 'skipped_past' })
      continue
    }

    // Check for existing event with same icsUid
    let existingDoc: any = null
    try {
      const found = await payload.find({
        collection: 'events',
        where: { icsUid: { equals: ev.occurrenceId } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      })
      if (found.totalDocs > 0) existingDoc = found.docs[0]
    } catch {}

    if (existingDoc && !update) {
      results.push({ occurrenceId: ev.occurrenceId, summary: ev.summary, status: 'skipped_duplicate' })
      continue
    }

    try {
      const startDate = new Date(ev.start).toISOString()
      const endDate = new Date(ev.end).toISOString()
      const descLexical = ev.description ? toLexical(ev.description) : undefined
      const sourceUrl = ev.url || undefined

      let imageId: number | undefined
      if (fetchImages) {
        // Only fetch if creating or if existing event has no image
        if (!existingDoc || !existingDoc.image) {
          const id = await resolveImage(ev.attachUrl, ev.url, ev.summary, payload)
          if (id) imageId = id
        }
      }

      if (existingDoc) {
        // Update
        const updateData: any = {
          title: ev.summary,
          startDate,
          endDate,
          locationName: ev.location || undefined,
          description: descLexical,
          sourceUrl,
        }
        if (imageId) updateData.image = imageId
        await payload.update({
          collection: 'events',
          id: existingDoc.id,
          data: updateData,
          overrideAccess: true,
        })
        results.push({ occurrenceId: ev.occurrenceId, summary: ev.summary, status: 'updated' })
      } else {
        // Create
        const createData: any = {
          title: ev.summary,
          slug: `${slugify(ev.summary)}-${Date.now().toString(36)}`,
          startDate,
          endDate,
          locationName: ev.location || undefined,
          description: descLexical,
          sourceUrl,
          icsUid: ev.occurrenceId,
          _status: status,
        }
        if (imageId) createData.image = imageId
        await payload.create({
          collection: 'events',
          draft: status === 'draft',
          data: createData,
          overrideAccess: true,
        })
        results.push({ occurrenceId: ev.occurrenceId, summary: ev.summary, status: 'created' })
      }
    } catch (err: any) {
      results.push({ occurrenceId: ev.occurrenceId, summary: ev.summary, status: 'error', error: err.message })
    }
  }

  const counts = results.reduce(
    (acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc },
    {} as Record<ResultStatus, number>,
  )

  return Response.json({ results, counts })
}

// ── Fetch missing images ──────────────────────────────────────────────────────

async function handleFetchImages(payload: any): Promise<Response> {
  let eventsWithUrl: any[] = []
  try {
    const found = await payload.find({
      collection: 'events',
      where: {
        and: [
          { sourceUrl: { exists: true } },
          { image: { exists: false } },
        ],
      },
      limit: 20,
      depth: 0,
      overrideAccess: true,
    })
    eventsWithUrl = found.docs
  } catch (err: any) {
    return Response.json({ error: `Kunne ikke hente arrangementer: ${err.message}` }, { status: 500 })
  }

  let found = 0
  let failed = 0
  const errors: string[] = []

  for (const ev of eventsWithUrl) {
    if (!ev.sourceUrl) continue
    const imageId = await resolveImage(undefined, ev.sourceUrl, ev.title, payload)
    if (!imageId) { failed++; continue }
    try {
      await payload.update({
        collection: 'events',
        id: ev.id,
        data: { image: imageId },
        overrideAccess: true,
      })
      found++
    } catch (err: any) {
      errors.push(`«${ev.title}»: ${err.message}`)
      failed++
    }
  }

  return Response.json({ found, failed, total: eventsWithUrl.length, errors })
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
    let body: any
    try { body = await req.json() } catch { return Response.json({ error: 'Ugyldig JSON.' }, { status: 400 }) }
    if (body.action === 'fetch-images') return handleFetchImages(payload)
    if (body.action === 'import') return handleImport(body as ImportBody, payload)
    return Response.json({ error: 'Ukjent handling.' }, { status: 400 })
  }

  // FormData → preview
  return handlePreview(req, payload)
}
