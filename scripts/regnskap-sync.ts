/**
 * Regnskapstall-synkskript — henter siste årsregnskap fra Regnskapsregisteret
 * og upsert-er nøkkeltall i 'regnskap'-collection.
 *
 * Kjøring (lokal test — én kommune):
 *   npx tsx scripts/regnskap-sync.ts --kommune 1833
 *
 * Kjøring (begrenset antall for rask smoke-test):
 *   npx tsx scripts/regnskap-sync.ts --kommune 1833 --limit 50
 *
 * Kjøring (full synk av alle Helgeland-bedrifter):
 *   npx tsx scripts/regnskap-sync.ts
 *
 * Cron (månedlig — kjøres første søndag i måneden kl. 06:00):
 *   0 6 1-7 * 0  docker compose exec -T app sh -c \
 *     "cp -r /host/scripts /app/scripts && npx tsx /app/scripts/regnskap-sync.ts" \
 *     >> /var/log/regnskap-sync.log 2>&1
 *
 * Merk: scripts/ er ikke med i prod-imaget — kopier manuelt FØR exec (regel 13).
 */

import 'dotenv/config'

import { getPayload } from 'payload'
import config from '../payload.config'

const API_BASE = 'https://data.brreg.no/regnskapsregisteret/regnskap'
const USER_AGENT = 'Helgelandsia/1.0 (helgelandsia.no; kontakt: smartehoder@gmail.com)'
const SLEEP_MS = 150  // politt mot det offentlige API-et

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Trekker ut et beløp — API returnerer direkte tall (float).
// Beholder obj-sjekk som fallback, men normalt er verdier flat i strukturen.
function extractAmount(obj: unknown): number | null {
  if (obj == null) return null
  if (typeof obj === 'number') return isNaN(obj) ? null : obj
  const o = obj as Record<string, unknown>
  if (typeof o.value === 'number') return isNaN(o.value) ? null : o.value
  if (typeof o.offentligVerdi === 'number') return isNaN(o.offentligVerdi) ? null : o.offentligVerdi
  return null
}

interface RegnskapData {
  aar: number
  omsetning: number | null
  driftsresultat: number | null
  aarsresultat: number | null
  egenkapital: number | null
  valuta: string
}

function parseRegnskapsApiResponse(data: unknown): RegnskapData | null {
  if (!Array.isArray(data) || data.length === 0) return null

  // Sorter på tilDato DESC og ta første (nyeste) — API gir oftest kun ett år, men defensivt
  const sorted = [...data].sort((a: any, b: any) => {
    const aDate = a.regnskapsperiode?.tilDato ?? ''
    const bDate = b.regnskapsperiode?.tilDato ?? ''
    return bDate.localeCompare(aDate)
  })
  const entry: any = sorted[0]

  const tilDato: string | undefined = entry.regnskapsperiode?.tilDato
  if (!tilDato) return null

  const aar = new Date(tilDato).getFullYear()
  if (isNaN(aar)) return null

  // Faktisk feltstruktur verifisert mot live API 2026-07-05:
  // - toppnøkkel: resultatregnskapResultat (ikke resultatregnskapet)
  // - aarsresultat: direkte tall på toppnivå i resultatregnskapResultat
  // - driftsresultat: nestet under resultatregnskapResultat.driftsresultat.driftsresultat
  // - omsetning (sumDriftsinntekter): under driftsresultat.driftsinntekter.sumDriftsinntekter
  // - egenkapital: under egenkapitalGjeld.egenkapital.sumEgenkapital (ikke direkte på gjeld-nivå)
  const r: any = entry.resultatregnskapResultat
  const eg: any = entry.egenkapitalGjeld

  const omsetning = extractAmount(r?.driftsresultat?.driftsinntekter?.sumDriftsinntekter)
  const driftsresultat = extractAmount(r?.driftsresultat?.driftsresultat)
  const aarsresultat = extractAmount(r?.aarsresultat)
  const egenkapital = extractAmount(eg?.egenkapital?.sumEgenkapital)

  return {
    aar,
    omsetning,
    driftsresultat,
    aarsresultat,
    egenkapital,
    valuta: typeof entry.valuta === 'string' ? entry.valuta : 'NOK',
  }
}

async function fetchRegnskap(orgnr: string): Promise<RegnskapData | null> {
  const res = await fetch(`${API_BASE}/${orgnr}`, {
    headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
  })
  if (res.status === 404) return null  // ENK eller ingen regnskap
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return parseRegnskapsApiResponse(data)
}

async function main() {
  const REQUIRED_ENV = ['DATABASE_URI', 'PAYLOAD_SECRET']
  const missing = REQUIRED_ENV.filter(k => !process.env[k])
  if (missing.length) {
    console.error(`[Regnskap-synk] MANGLENDE env-variabler: ${missing.join(', ')}`)
    process.exit(1)
  }

  const payload = await getPayload({ config })

  const args = process.argv.slice(2)
  const kommuneArg = args.includes('--kommune') ? args[args.indexOf('--kommune') + 1] : undefined
  const limitArg = args.includes('--limit') ? parseInt(args[args.indexOf('--limit') + 1], 10) : undefined

  payload.logger.info(
    kommuneArg
      ? `[Regnskap-synk] Starter — kommune: ${kommuneArg}${limitArg ? `, limit: ${limitArg}` : ''}`
      : `[Regnskap-synk] Starter — alle Helgeland-bedrifter${limitArg ? `, limit: ${limitArg}` : ''}`,
  )

  const hentetDato = new Date().toISOString()
  let processed = 0
  let upserted = 0
  let skipped = 0
  let errors = 0

  const PAGE_SIZE = 200
  let page = 1
  let hasMore = true

  outer: while (hasMore) {
    // Hent side med bedrifter: kun BRREG-kilde, kun hovedenheter, ikke ENK
    const where: any = {
      and: [
        { source: { equals: 'brreg' } },
        { brregEntityType: { equals: 'hovedenhet' } },
        { orgnr: { exists: true } },
        // ENK registrerer typisk ikke i Regnskapsregisteret — hopper over
        {
          or: [
            { organisasjonsform: { not_equals: 'Enkeltpersonforetak' } },
            { organisasjonsform: { exists: false } },
          ],
        },
      ],
    }
    if (kommuneArg) {
      where.and.push({ kommunenummer: { equals: kommuneArg } })
    }

    let bizRes: any
    try {
      bizRes = await payload.find({
        collection: 'businesses',
        where,
        sort: 'orgnr',
        limit: PAGE_SIZE,
        page,
        depth: 0,
        overrideAccess: true,
      })
    } catch (err) {
      payload.logger.error(`[Regnskap-synk] Feil ved henting av bedrifter (side ${page}): ${err}`)
      errors++
      break
    }

    const businesses: any[] = bizRes.docs
    hasMore = page < bizRes.totalPages

    for (const biz of businesses) {
      if (limitArg && processed >= limitArg) {
        hasMore = false
        break outer
      }

      const orgnr: string = biz.orgnr
      processed++

      await sleep(SLEEP_MS)

      let regnskapData: RegnskapData | null = null
      try {
        regnskapData = await fetchRegnskap(orgnr)
      } catch (err) {
        payload.logger.warn(`[Regnskap-synk] Feil for ${orgnr}: ${err}`)
        errors++
        continue
      }

      if (!regnskapData) {
        skipped++
        continue
      }

      // Upsert på (orgnr, aar)
      try {
        const existing = await payload.find({
          collection: 'regnskap' as any,
          where: {
            and: [
              { orgnr: { equals: orgnr } },
              { aar: { equals: regnskapData.aar } },
            ],
          },
          limit: 1,
          overrideAccess: true,
        })

        const data = {
          orgnr,
          aar: regnskapData.aar,
          omsetning: regnskapData.omsetning,
          driftsresultat: regnskapData.driftsresultat,
          aarsresultat: regnskapData.aarsresultat,
          egenkapital: regnskapData.egenkapital,
          valuta: regnskapData.valuta,
          hentetDato,
        }

        if (existing.totalDocs > 0) {
          await payload.update({
            collection: 'regnskap' as any,
            id: existing.docs[0].id,
            data: data as any,
            overrideAccess: true,
          })
        } else {
          await payload.create({
            collection: 'regnskap' as any,
            data: data as any,
            overrideAccess: true,
          })
        }
        upserted++
      } catch (err) {
        payload.logger.warn(`[Regnskap-synk] Upsert feilet for ${orgnr}: ${err}`)
        errors++
      }

      if (processed % 100 === 0) {
        payload.logger.info(
          `[Regnskap-synk] Fremgang: ${processed} behandlet, ${upserted} upsert, ${skipped} hoppet over, ${errors} feil`,
        )
      }
    }

    page++
  }

  payload.logger.info(
    `[Regnskap-synk] Ferdig — behandlet: ${processed}, upsert: ${upserted}, hoppet over (ingen data): ${skipped}, feil: ${errors}`,
  )

  try { await (payload.db as any).pool?.end() } catch { /* ignorert */ }
  process.exit(errors > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('[Regnskap-synk] Krasjet under oppstart:', err)
  process.exit(1)
})
