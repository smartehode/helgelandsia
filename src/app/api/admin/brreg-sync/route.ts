import { NextRequest, NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/getPayload'
import { runFullSync, runIncrementalSync } from '@/lib/brreg/sync'

export async function POST(req: NextRequest) {
  const payload = await getPayloadClient()

  // Kun admin-brukere (staff, ikke members) kan starte synk
  const { user } = await payload.auth({ headers: req.headers })
  if (!user || !('roles' in user) || !(user as any).roles?.includes('admin')) {
    return NextResponse.json({ error: 'Ikke tilgang — kun admin' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const syncType: string = body.type === 'incremental' ? 'incremental' : 'full'
  const since: string | undefined = body.since

  try {
    const result =
      syncType === 'incremental' && since
        ? await runIncrementalSync(payload, since)
        : await runFullSync(payload)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
