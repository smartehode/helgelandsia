/**
 * Engangs-berikelse: henter vedtektsfestetFormaal (+ manglende aktivitet)
 * fra BRREG Enhetsregisteret for alle eksisterende bedrifter med orgnr.
 *
 * Kjøring (teste på 20 bedrifter):
 *   npx tsx scripts/brreg-formaal-backfill.ts --limit 20
 *
 * Kjøring (kun én bedrift):
 *   npx tsx scripts/brreg-formaal-backfill.ts --orgnr 999667015
 *
 * Kjøring (alle med orgnr — tar lang tid, ~7–8 t for 24000 bedrifter):
 *   npx tsx scripts/brreg-formaal-backfill.ts
 *
 * Kjøring (kun de som mangler formaal og aktivitet — anbefalt):
 *   npx tsx scripts/brreg-formaal-backfill.ts --only-missing
 *
 * Merk: respekterer BRREG-bruksreglene med 1100 ms pause mellom kall.
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'

const API_BASE = 'https://data.brreg.no/enhetsregisteret/api/enheter'
const USER_AGENT = 'Helgelandsia/1.0 (helgelandsia.no; kontakt: smartehoder@gmail.com)'
const SLEEP_MS = 1100

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const args = process.argv.slice(2)
const orgnrFlag: string | null =
  args.indexOf('--orgnr') >= 0 ? args[args.indexOf('--orgnr') + 1] : null
const limitFlag: number =
  args.indexOf('--limit') >= 0 ? parseInt(args[args.indexOf('--limit') + 1]) : Infinity
const onlyMissing: boolean = args.includes('--only-missing')

async function fetchEnhet(orgnr: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/${orgnr}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    })
    if (res.status === 410 || res.status === 404) return null
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    throw err
  }
}

async function main() {
  const payload = await getPayload({ config })

  // Hent bedrifter som skal behandles
  let page = 1
  let processed = 0
  let updatedFormaal = 0
  let updatedAktivitet = 0
  let skipped = 0
  let errors = 0

  const where: any = orgnrFlag
    ? { orgnr: { equals: orgnrFlag } }
    : onlyMissing
      ? {
          and: [
            { orgnr: { exists: true } },
            {
              or: [
                { formaal: { exists: false } },
                { aktivitet: { exists: false } },
              ],
            },
          ],
        }
      : { orgnr: { exists: true } }

  while (true) {
    const res = await payload.find({
      collection: 'businesses',
      where,
      limit: 200,
      page,
      depth: 0,
      overrideAccess: true,
      sort: 'orgnr',
    })

    if (res.docs.length === 0) break

    for (const biz of res.docs as any[]) {
      if (processed >= limitFlag) break

      // Hopp over underenheter (kun beriket fra BRREG Enhetsregisteret, ikke Underenhetsregisteret)
      if (biz.brregEntityType === 'underenhet') { skipped++; continue }

      processed++
      let enhet: any = null
      try {
        enhet = await fetchEnhet(biz.orgnr)
      } catch (err) {
        payload.logger.warn(`[Backfill] ${biz.orgnr} — BRREG-feil: ${err}`)
        errors++
        await sleep(SLEEP_MS)
        continue
      }

      if (!enhet) { skipped++; await sleep(SLEEP_MS); continue }

      const nyFormaal: string | null =
        Array.isArray(enhet.vedtektsfestetFormaal) && enhet.vedtektsfestetFormaal.length > 0
          ? enhet.vedtektsfestetFormaal.join(' ')
          : null
      const nyAktivitet: string | null =
        Array.isArray(enhet.aktivitet) && enhet.aktivitet.length > 0
          ? enhet.aktivitet.join('; ')
          : null

      const update: Record<string, any> = {}
      if (nyFormaal && !biz.formaal) update.formaal = nyFormaal
      if (nyAktivitet && !biz.aktivitet) update.aktivitet = nyAktivitet

      if (Object.keys(update).length > 0) {
        try {
          await payload.update({
            collection: 'businesses',
            id: biz.id,
            data: update as any,
            overrideAccess: true,
          })
          if (update.formaal) updatedFormaal++
          if (update.aktivitet) updatedAktivitet++
          payload.logger.info(
            `[Backfill] ${biz.orgnr} (${biz.name}) — ${Object.keys(update).join(', ')} oppdatert`,
          )
        } catch (err) {
          payload.logger.warn(`[Backfill] ${biz.orgnr} — lagring feilet: ${err}`)
          errors++
        }
      } else {
        payload.logger.info(`[Backfill] ${biz.orgnr} — ingen nye data`)
      }

      await sleep(SLEEP_MS)
    }

    if (processed >= limitFlag || res.docs.length < 200) break
    page++
  }

  payload.logger.info(
    `[Backfill] Ferdig — behandlet: ${processed}, formaal: +${updatedFormaal}, aktivitet: +${updatedAktivitet}, hoppet over: ${skipped}, feil: ${errors}`,
  )

  try { await (payload.db as any).pool?.end() } catch { /* ignorert */ }
  process.exit(errors > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('[Backfill] Krasjet under oppstart:', err)
  process.exit(1)
})
