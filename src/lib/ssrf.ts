import { lookup } from 'node:dns/promises'
import { isIP } from 'node:net'

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

export async function assertSafe(urlStr: string): Promise<void> {
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

// Fetch with SSRF guard, manual redirect following, timeout and size limit.
export async function safeFetch(
  startUrl: string,
  opts: { maxRedirects?: number; maxBytes?: number; headers?: Record<string, string> } = {},
): Promise<{ buffer: Buffer; contentType: string; finalUrl: string }> {
  const maxRedirects = opts.maxRedirects ?? 3
  const maxBytes = opts.maxBytes ?? 10 * 1024 * 1024
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
        headers: { 'User-Agent': 'helgelandsia.no', ...(opts.headers ?? {}) },
      })
    } finally { clearTimeout(timer) }
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location')
      if (!loc || i === maxRedirects) throw new Error('For mange omdirigeringer.')
      current = new URL(loc, current).href
      continue
    }
    if (!res.ok) throw new Error(`HTTP ${res.status} fra kilden.`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > maxBytes) throw new Error('Ressursen er for stor.')
    return { buffer: buf, contentType: res.headers.get('content-type') ?? '', finalUrl: current }
  }
  throw new Error('For mange omdirigeringer.')
}
