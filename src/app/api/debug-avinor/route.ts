export const dynamic = 'force-dynamic'

export async function GET() {
  const urls = [
    'https://asrv.avinor.no/XmlFeed/v1.0?airport=BNN&TimeFrom=6&TimeTo=24&direction=D',
    'https://asrv.avinor.no/XmlFeed/v1.0?airport=BNN&TimeFrom=6&TimeTo=6&direction=A',
    'https://asrv.avinor.no/XmlFeed/v1.0?airport=OSL&TimeFrom=1&TimeTo=3&direction=D',
  ]

  const results: Record<string, unknown> = {}

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Helgelandsia/1.0)',
          'Accept': 'application/xml, text/xml, */*',
        },
      })
      const text = await res.text()
      results[url] = { status: res.status, ok: res.ok, length: text.length, preview: text.slice(0, 500) }
    } catch (e: unknown) {
      results[url] = { error: e instanceof Error ? e.message : String(e) }
    }
  }

  return Response.json(results, { headers: { 'Content-Type': 'application/json' } })
}
