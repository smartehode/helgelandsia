/**
 * BRREG-importskript — kjøres som frittstående Node-prosess.
 *
 * Manuell kjøring:
 *   npx tsx scripts/brreg-sync.ts                          # auto: full om ingen suksess, ellers inkrementell
 *   npx tsx scripts/brreg-sync.ts --full                   # tving full nedlasting
 *   npx tsx scripts/brreg-sync.ts --incremental 2026-06-01 # inkrementell fra dato
 *   npx tsx scripts/brreg-sync.ts --kommune 1833           # importer én kommune (f.eks. Rana)
 *
 * Cron (daglig kl. 03:00 på serveren):
 *   0 3 * * * cd /root/helgelandsia && npx tsx scripts/brreg-sync.ts >> /var/log/brreg-sync.log 2>&1
 */

// Laster .env FØR Payload initialiseres (trenger DATABASE_URI og PAYLOAD_SECRET)
import 'dotenv/config'

import { getPayload } from 'payload'
import config from '../payload.config'
import { runFullSync, runIncrementalSync, syncKommune } from '../src/lib/brreg/sync'

async function main() {
  const payload = await getPayload({ config })

  const args = process.argv.slice(2)
  const forceFullFlag = args.includes('--full')
  const forceIncrementalFlag = args.includes('--incremental')
  const kommuneFlag = args.includes('--kommune')

  const sinceArg = args.find(a => /^\d{4}-\d{2}-\d{2}$/.test(a))
  const kommuneArg = kommuneFlag ? args[args.indexOf('--kommune') + 1] : undefined

  // --- Per-kommune-import (f.eks. --kommune 1833 for Rana) ---
  if (kommuneFlag && kommuneArg) {
    payload.logger.info(`Starter per-kommune BRREG-synk for kommunenummer ${kommuneArg}`)
    let result
    try {
      result = await syncKommune(payload, kommuneArg)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      payload.logger.error(`Kommune-synk krasjet: ${errorMessage}`)
      try {
        await payload.create({
          collection: 'brreg-sync-jobs',
          data: { syncType: 'full', status: 'failed', created: 0, updated: 0, skipped: 0, errors: 1, errorMessage } as any,
          overrideAccess: true,
        })
      } catch { /* ignorert */ }
      try { await (payload.db as any).pool?.end() } catch { /* ignorert */ }
      process.exit(1)
    }
    payload.logger.info(`Kommune ${kommuneArg}: ${result.created} nye, ${result.updated} oppdatert, ${result.skipped} hoppet over, ${result.errors} feil`)
    try { await (payload.db as any).pool?.end() } catch { /* ignorert */ }
    process.exit(result.errors > 0 ? 1 : 0)
    return
  }

  // --- Bestem synktype FØR vi kjører, slik at vi kan logge riktig type på feil ---
  let syncType: 'full' | 'incremental' = 'full'
  let since: string | undefined

  if (forceIncrementalFlag && sinceArg) {
    syncType = 'incremental'
    since = sinceArg
  } else if (!forceFullFlag) {
    const lastJob = await payload.find({
      collection: 'brreg-sync-jobs',
      where: { status: { equals: 'success' } },
      sort: '-createdAt',
      limit: 1,
      overrideAccess: true,
    })
    if (lastJob.docs.length > 0) {
      syncType = 'incremental'
      since = (lastJob.docs[0].createdAt as string).split('T')[0]
    }
  }

  payload.logger.info(
    syncType === 'full'
      ? 'Starter full BRREG-synk'
      : `Starter inkrementell BRREG-synk fra ${since}`,
  )

  let result
  try {
    result = syncType === 'incremental' && since
      ? await runIncrementalSync(payload, since)
      : await runFullSync(payload)
  } catch (err: unknown) {
    // Uventet unntak utenfor synk-funksjonenes eget try/catch —
    // log eksplisitt som 'failed' slik at vi ser det i admin, ikke stille 0/0/0
    const errorMessage = err instanceof Error ? err.message : String(err)
    payload.logger.error(`BRREG-synk krasjet: ${errorMessage}`)
    try {
      await payload.create({
        collection: 'brreg-sync-jobs',
        data: {
          syncType,
          status: 'failed',
          created: 0,
          updated: 0,
          skipped: 0,
          errors: 1,
          errorMessage,
        } as any,
        overrideAccess: true,
      })
    } catch { /* DB kan selv være nede */ }
    try { await (payload.db as any).pool?.end() } catch { /* ignorert */ }
    process.exit(1)
  }

  payload.logger.info(
    `BRREG-synk fullført: ${result.created} nye, ${result.updated} oppdatert, ` +
    `${result.skipped} hoppet over, ${result.errors} feil`,
  )

  try { await (payload.db as any).pool?.end() } catch { /* ignorert */ }
  process.exit(result.errors > 0 ? 1 : 0)
}

main().catch(err => {
  // getPayload() eller annen setup feilet — ingen payload-instans tilgjengelig
  console.error('BRREG-synk krasjet under oppstart:', err)
  process.exit(1)
})
