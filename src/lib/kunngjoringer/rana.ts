import type { Kunngjoring } from './types'
import { extractText, extractLink, splitItems } from './rss'

const RSS_URL =
  'https://www.rana.kommune.no/ArtikkelRSS.ashx?NyhetsKategoriId=2998&Spraak=Norsk'

// Feeden blander sakstyper — filtrer til relevante kunngjøringer/høringer.
const KEYWORDS =
  /høring|offentlig ettersyn|planoppstart|planarbeid|planforslag|reguleringsplan|kunngjøring|kunngjøres|innspill|forskrift/i

export async function fetchRana(): Promise<Kunngjoring[]> {
  try {
    const res = await fetch(RSS_URL, {
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 3600 },
    })
    if (!res.ok) return []
    const xml = await res.text()
    const items = splitItems(xml)
    const result: Kunngjoring[] = []
    for (const item of items) {
      const tittel = extractText(item, 'title')
      if (!tittel || !KEYWORDS.test(tittel)) continue
      const url = extractLink(item)
      if (!url) continue
      const pubDate = extractText(item, 'pubDate')
      const dato = pubDate ? new Date(pubDate) : new Date(0)
      result.push({ kommune: 'Rana', tittel, dato, url, kilde: 'Rana kommune' })
    }
    return result
  } catch {
    return []
  }
}
