import { hentKalenderData } from '@/lib/kalender'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const maned = searchParams.get('maned')

  if (!maned || !/^\d{4}-\d{2}$/.test(maned)) {
    return Response.json({ error: 'Bruk ?maned=YYYY-MM' }, { status: 400 })
  }

  try {
    const data = await hentKalenderData(maned)
    return Response.json(data)
  } catch (err: any) {
    console.error('[/api/kalender]', err?.message)
    return Response.json({ error: 'Kunne ikke hente kalenderdata.' }, { status: 500 })
  }
}
