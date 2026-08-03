import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'
import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'
import { checkRateLimit, getClientIp, LIMITS, rateLimitResponse } from '@/lib/rate-limit'

// ── SSRF protection ──────────────────────────────────────────────────────────

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number)
    if (a === 127) return true
    if (a === 10) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true
    if (a === 0) return true
  }
  if (isIP(ip) === 6) {
    const low = ip.toLowerCase()
    if (low === '::1') return true
    if (low.startsWith('fc') || low.startsWith('fd')) return true
    if (low.startsWith('fe80')) return true
  }
  return false
}

async function assertSafe(urlStr: string): Promise<void> {
  let url: URL
  try { url = new URL(urlStr) } catch { throw new Error('Ugyldig URL.') }
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Kun HTTP/HTTPS er tillatt.')
  const host = url.hostname
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error('Private/interne adresser er ikke tillatt.')
    return
  }
  let addrs: { address: string }[]
  try { addrs = await lookup(host, { all: true }) } catch { throw new Error('Kunne ikke slå opp adressen.') }
  for (const { address } of addrs) {
    if (isPrivateIp(address)) throw new Error('Private/interne adresser er ikke tillatt.')
  }
}

async function safeFetchHtml(startUrl: string, maxRedirects = 3): Promise<{ html: string; finalUrl: string }> {
  let current = startUrl
  for (let i = 0; i <= maxRedirects; i++) {
    await assertSafe(current)
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    let res: Response
    try {
      res = await fetch(current, {
        redirect: 'manual',
        signal: ctrl.signal,
        headers: { 'User-Agent': 'helgelandsia.no' },
      })
    } finally {
      clearTimeout(timer)
    }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc || i === maxRedirects) throw new Error('For mange omdirigeringer.')
      current = new URL(loc, current).href
      continue
    }
    if (!res.ok) throw new Error(`Kunne ikke hente siden (HTTP ${res.status}).`)
    let html = await res.text()
    if (html.length > 3 * 1024 * 1024) html = html.slice(0, 3 * 1024 * 1024)
    return { html, finalUrl: current }
  }
  throw new Error('For mange omdirigeringer.')
}

// ── HTML parsing ─────────────────────────────────────────────────────────────

function htmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#039;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
}

function extractMeta(html: string, attr: 'property' | 'name', key: string): string | undefined {
  const patterns = [
    new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${key}["']`, 'i'),
  ]
  for (const re of patterns) {
    const m = html.match(re)
    if (m) return htmlEntities(m[1].trim())
  }
  return undefined
}

function extractTitle(html: string): string | undefined {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return m ? htmlEntities(m[1].trim()) : undefined
}

function extractJsonLdEvents(html: string): any[] {
  const events: any[] = []
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1])
      const items: any[] = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item['@type'] === 'Event') events.push(item)
        if (Array.isArray(item['@graph'])) {
          for (const g of item['@graph']) {
            if (g['@type'] === 'Event') events.push(g)
          }
        }
      }
    } catch {}
  }
  return events
}

function toDatetimeLocal(s: string | undefined): string | undefined {
  if (!s) return undefined
  const m = s.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (m) return `${m[1]}T${m[2]}`
  const d = s.match(/^(\d{4}-\d{2}-\d{2})$/)
  if (d) return `${d[1]}T00:00`
  return undefined
}

// ── Image download → Payload media ──────────────────────────────────────────

async function downloadImage(
  imageUrl: string,
  title: string,
  payload: any,
): Promise<{ id: number; url: string } | null> {
  try { await assertSafe(imageUrl) } catch { return null }
  try {
    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    let res: Response
    try {
      res = await fetch(imageUrl, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'helgelandsia.no' },
      })
    } finally { clearTimeout(timer) }
    if (!res.ok) return null
    const ct = res.headers.get('content-type') ?? 'image/jpeg'
    if (!ct.startsWith('image/')) return null

    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > 8 * 1024 * 1024) return null

    const ext = ct.includes('png') ? 'png' : ct.includes('gif') ? 'gif' : ct.includes('webp') ? 'webp' : 'jpg'
    const name = `import-${Date.now()}.${ext}`
    const media: any = await payload.create({
      collection: 'media',
      data: { alt: title || 'Importert bilde' },
      file: { data: buf, name, mimetype: ct, size: buf.length },
    })
    return { id: media.id, url: media.url }
  } catch { return null }
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`arrangement-import:${ip}`, LIMITS.IMPORT)
  if (!rl.ok) return rateLimitResponse('/api/arrangement-import', ip, rl.retryAfter!)

  const payload = await getPayloadClient()
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (!user || user.collection !== 'members') {
    return Response.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  let body: { url?: string }
  try { body = await req.json() } catch { return Response.json({ error: 'Ugyldig forespørsel.' }, { status: 400 }) }

  const rawUrl = typeof body.url === 'string' ? body.url.trim() : ''
  if (!rawUrl) return Response.json({ error: 'URL mangler.' }, { status: 400 })
  try { new URL(rawUrl) } catch { return Response.json({ error: 'Ugyldig URL.' }, { status: 400 }) }

  let html: string, finalUrl: string
  try {
    ;({ html, finalUrl } = await safeFetchHtml(rawUrl))
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 422 })
  }

  const ogTitle = extractMeta(html, 'property', 'og:title')
  const ogDescription = extractMeta(html, 'property', 'og:description')
  const metaDescription = extractMeta(html, 'name', 'description')
  const rawOgImage = extractMeta(html, 'property', 'og:image')
  const ogImage = rawOgImage ? (() => { try { return new URL(rawOgImage, finalUrl).href } catch { return undefined } })() : undefined

  const ldEvents = extractJsonLdEvents(html)
  const ld = ldEvents[0]

  const tittel = ogTitle || ld?.name || extractTitle(html)
  const beskrivelse = ogDescription || metaDescription || ld?.description
  const startdato = toDatetimeLocal(ld?.startDate)
  const sluttdato = toDatetimeLocal(ld?.endDate)
  const sted = ld?.location?.name || ld?.location?.address?.streetAddress

  let bildeId: number | undefined
  let bildeUrl: string | undefined
  if (ogImage) {
    const saved = await downloadImage(ogImage, tittel ?? '', payload)
    if (saved) { bildeId = saved.id; bildeUrl = saved.url }
  }

  const hints: string[] = []
  if (!startdato) hints.push('Dato ble ikke funnet — fyll ut manuelt')
  if (!sted) hints.push('Sted ble ikke funnet — fyll ut manuelt')
  if (ogImage && !bildeId) hints.push('Bilde kunne ikke hentes — last opp manuelt')

  return Response.json({ tittel, beskrivelse, startdato, sluttdato, sted, bildeId, bildeUrl, hints })
}
