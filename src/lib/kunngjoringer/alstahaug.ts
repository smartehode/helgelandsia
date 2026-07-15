import type { Kunngjoring } from './types'

const BASE = 'https://alstahaug.kommune.no'
const LIST_URL = `${BASE}/tjenester/plan-bygg-og-eiendom/planer/horinger-og-kunngjoringer`

// Arkiv-lenkene har alltid YYYY-MM-DD i slug-starten — datoen hentes derfra.
const HREF_RE =
  /href="(\/tjenester\/[^"]*arkiv[^"]*\/(\d{4}-\d{2}-\d{2})-[^"]+)"/gi

// Norsk datoprefix i lenketeksten (f.eks. "10. juli 2026") — strippes fra tittel.
const DATE_PREFIX_RE = /^\d{1,2}\.\s+\S+\s+\d{4}\s*/u

// Siden er allerede en høringer/kunngjøringer-side, men filtrer bort evt. støy.
const KEYWORDS =
  /høring|offentlig ettersyn|planoppstart|planarbeid|planforslag|reguleringsplan|kunngjøring|kunngjøres|innspill|forskrift/i

function extractLinkText(html: string, href: string): string {
  // Finn <a href="...HREF...">...</a> og hent innholdet som ren tekst.
  const escaped = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const m = html.match(new RegExp(`href="${escaped}"[^>]*>([\\s\\S]*?)<\\/a>`))
  if (!m) return ''
  // Strip HTML-tagger, normalisér mellomrom
  return m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

export async function fetchAlstahaug(): Promise<Kunngjoring[]> {
  try {
    const res = await fetch(LIST_URL, {
      headers: { 'User-Agent': 'helgelandsia.no' },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const html = await res.text()

    const result: Kunngjoring[] = []
    const seen = new Set<string>()
    let m: RegExpExecArray | null

    HREF_RE.lastIndex = 0
    while ((m = HREF_RE.exec(html)) !== null) {
      const path = m[1]
      const dateStr = m[2]
      if (seen.has(path)) continue
      seen.add(path)

      const rawText = extractLinkText(html, path)
      const tittel = rawText.replace(DATE_PREFIX_RE, '').trim()
      if (!tittel) continue
      if (!KEYWORDS.test(tittel)) continue

      const dato = new Date(dateStr)
      if (isNaN(dato.getTime())) continue

      const url = path.startsWith('http') ? path : `${BASE}${path}`
      result.push({ kommune: 'Alstahaug', tittel, dato, url, kilde: 'Alstahaug kommune' })
    }

    return result
  } catch {
    return []
  }
}
