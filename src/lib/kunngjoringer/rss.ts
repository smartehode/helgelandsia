// Delt RSS-parselogikk for kunngjørings-hentere.

export function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .trim()
}

export function extractText(xml: string, tag: string): string {
  const cdata = xml.match(new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`))
  if (cdata) return decodeEntities(cdata[1])
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`))
  return plain ? decodeEntities(plain[1]) : ''
}

export function extractLink(item: string): string {
  const std = item.match(/<link>\s*(https?:[^\s<]+)\s*<\/link>/)
  if (std) return std[1]
  const cdata = item.match(/<link>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/link>/)
  if (cdata) return cdata[1].trim()
  const guid = item.match(/<guid[^>]*>\s*(https?:[^\s<]+)\s*<\/guid>/)
  if (guid) return guid[1]
  return ''
}

export function splitItems(xml: string): string[] {
  return xml.split(/<item[\s>]/).slice(1).map(s => s.split('</item>')[0])
}
