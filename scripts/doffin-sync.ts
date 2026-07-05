/**
 * Doffin-synkskript — henter aktive offentlige anskaffelser fra Nordland (NO082/NO072)
 * og legger dem inn i Payload-databasen.
 *
 * Kjøring:
 *   npx tsx scripts/doffin-sync.ts
 *
 * Cron (daglig kl. 05:30 — etter BRREG-synk kl. 04:30):
 *   30 5 * * * docker compose exec -T app sh -c "npx tsx scripts/doffin-sync.ts" \
 *     >> /var/log/doffin-sync.log 2>&1
 *
 * I prod-container: scripts/ er ikke med i imaget — kopier manuelt FØR exec:
 *   docker compose cp scripts app:/app/scripts
 *   docker compose exec -T app npx tsx scripts/doffin-sync.ts
 */

import 'dotenv/config'

import { getPayload } from 'payload'
import config from '../payload.config'
import { runDoffinSync } from '../src/lib/doffin/sync'

async function main() {
  const REQUIRED_ENV = ['DATABASE_URI', 'PAYLOAD_SECRET']
  const missing = REQUIRED_ENV.filter(k => !process.env[k])
  if (missing.length) {
    console.error(`[Doffin-synk] MANGLENDE env-variabler: ${missing.join(', ')}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })

  try {
    const result = await runDoffinSync(payload)
    payload.logger.info(
      `[Doffin-synk] Ferdig — opprettet: ${result.created}, oppdatert: ${result.updated}, utgått: ${result.expired}, feil: ${result.errors}, totalt sett: ${result.total}`,
    )
    process.exit(result.errors > 0 ? 1 : 0)
  } catch (err) {
    payload.logger.error(`[Doffin-synk] Fatal feil: ${err}`)
    process.exit(1)
  }
}

main()
