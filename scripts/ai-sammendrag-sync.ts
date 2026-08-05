/**
 * KI-sammendrag-synk — genererer og lagrer AI-baserte bedriftssammendrag
 * ved hjelp av Anthropic API + offentlige regnskapstall.
 *
 * Kjøring (én bedrift for testing):
 *   npx tsx scripts/ai-sammendrag-sync.ts --orgnr 987654321
 *
 * Kjøring (begrenset antall for røyktest):
 *   npx tsx scripts/ai-sammendrag-sync.ts --limit 10
 *
 * Kjøring (alle bedrifter som mangler oppdatert sammendrag):
 *   npx tsx scripts/ai-sammendrag-sync.ts
 *
 * Tving regenerering selv om år allerede matcher (f.eks. etter prompt-endring):
 *   npx tsx scripts/ai-sammendrag-sync.ts --force
 *   npx tsx scripts/ai-sammendrag-sync.ts --force --limit 11
 *
 * FORUTSETNING: ANTHROPIC_API_KEY og DATABASE_URI må være satt i .env
 * (kjør aldri mot API uten at eieren har lagt inn nøkkel og sagt gå).
 *
 * IKKE koblet til cron ennå — bevisst manuell aktivering (regel 17).
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../payload.config'
import { genererSammendrag } from '../src/lib/ai/sammendrag'
import { getPercentilerForBusiness } from '../src/lib/regnskap/percentiler'
import { getCategoryById } from '../src/lib/businesses/categories'

const SLEEP_MS = 500

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

const args = process.argv.slice(2)
const orgnrFlag: string | null =
  args.indexOf('--orgnr') >= 0 ? args[args.indexOf('--orgnr') + 1] : null
const limitFlag: number =
  args.indexOf('--limit') >= 0 ? parseInt(args[args.indexOf('--limit') + 1]) : Infinity
const forceFlag: boolean = args.includes('--force')

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[AI-synk] ANTHROPIC_API_KEY mangler i .env — avbryter.')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  // 1. Finn siste regnskapsår per orgnr
  const allRegnskap = await payload.find({
    collection: 'regnskap' as any,
    sort: '-aar',
    limit: 10000,
    depth: 0,
    overrideAccess: true,
  })

  const latestAarByOrgnr = new Map<string, number>()
  const regnskapCountByOrgnr = new Map<string, number>()
  // orgnr:aar -> omsetning — brukes til å slå opp forrige år for vekst-beregning
  const omsetningByOrgnrYear = new Map<string, number | null>()
  for (const r of allRegnskap.docs as any[]) {
    if (r.orgnr && !latestAarByOrgnr.has(r.orgnr)) {
      latestAarByOrgnr.set(r.orgnr, r.aar)
    }
    if (r.orgnr) {
      regnskapCountByOrgnr.set(r.orgnr, (regnskapCountByOrgnr.get(r.orgnr) ?? 0) + 1)
      omsetningByOrgnrYear.set(`${r.orgnr}:${r.aar}`, r.omsetning ?? null)
    }
  }

  // 2. Finn bedrifter som trenger oppdatering
  const orgnrList = orgnrFlag
    ? [orgnrFlag]
    : [...latestAarByOrgnr.keys()]

  let processed = 0
  let generated = 0
  let skipped = 0
  let errors = 0
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (const orgnr of orgnrList) {
    if (processed >= limitFlag) break

    const latestAar = latestAarByOrgnr.get(orgnr)
    if (!latestAar) { skipped++; continue }

    // Hent bedriften
    const bizRes = await payload.find({
      collection: 'businesses',
      where: { orgnr: { equals: orgnr } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    })
    const biz = (bizRes.docs as any[])[0]
    if (!biz) { skipped++; continue }

    // Hopp over om aiSammendragAar allerede er lik siste regnskapsår (med mindre --force)
    if (!forceFlag && biz.aiSammendragAar === latestAar && biz.aiSammendrag) {
      skipped++
      payload.logger.info(`[AI-synk] ${orgnr} — hoppet over (oppdatert: ${latestAar})`)
      continue
    }

    processed++

    // Hent siste regnskap
    const regRes = await payload.find({
      collection: 'regnskap' as any,
      where: {
        and: [
          { orgnr: { equals: orgnr } },
          { aar: { equals: latestAar } },
        ],
      },
      limit: 1,
      overrideAccess: true,
    })
    const regnskap = (regRes.docs as any[])[0]
    if (!regnskap) { errors++; continue }

    // Hent percentiler (gjenbruker loadCategoryStats-cachen)
    const cat = biz.naceCategory ? getCategoryById(biz.naceCategory) : null
    let percentilData = null
    if (biz.naceCategory && cat) {
      try {
        percentilData = await getPercentilerForBusiness(payload, orgnr, biz.naceCategory, cat.label)
      } catch {
        // percentil er valgfri — fortsett uten
      }
    }

    // Slå opp forrige år fra kartet (ingen ekstra DB-kall)
    const forrigeAarOmsetning = omsetningByOrgnrYear.get(`${orgnr}:${latestAar - 1}`) ?? null

    // Bygg input og generer
    const input = {
      navn: biz.name,
      kommune: biz.kommunenavn ?? null,
      kategori: cat?.label ?? null,
      organisasjonsform: biz.organisasjonsform ?? null,
      ansatte: biz.antallAnsatte ?? null,
      regnskapsaar: latestAar,
      omsetning: regnskap.omsetning ?? null,
      driftsresultat: regnskap.driftsresultat ?? null,
      aarsresultat: regnskap.aarsresultat ?? null,
      egenkapital: regnskap.egenkapital ?? null,
      antallAarMedRegnskap: regnskapCountByOrgnr.get(orgnr) ?? 1,
      forrigeAarOmsetning,
      aktivitet: biz.aktivitet ?? null,
      formaal: biz.formaal ?? null,
      omsetningPercentil: percentilData?.omsetningLabel ?? null,
      driftsmarginPercentil: percentilData?.driftsmarginLabel ?? null,
      antallSammenlignede: percentilData?.groupSize ?? null,
    }

    const result = await genererSammendrag(input)
    if (!result) {
      errors++
      payload.logger.warn(`[AI-synk] ${orgnr} (${biz.name}) — generering feilet`)
      await sleep(SLEEP_MS)
      continue
    }

    // Estimert tokenforbruk (grovt: 4 tegn per token)
    const promptLen = Math.ceil(JSON.stringify(input).length / 4)
    const outputLen = Math.ceil(result.tekst.length / 4)
    totalInputTokens += promptLen
    totalOutputTokens += outputLen

    // Lagre i Businesses
    try {
      await payload.update({
        collection: 'businesses',
        id: biz.id,
        data: {
          aiSammendrag: result.tekst,
          aiSammendragAar: result.aar,
          aiGenerertDato: new Date().toISOString(),
        } as any,
        overrideAccess: true,
      })
      generated++
      payload.logger.info(`[AI-synk] ${orgnr} (${biz.name}) — generert (${result.aar})`)
    } catch (err) {
      errors++
      payload.logger.warn(`[AI-synk] ${orgnr} — lagring feilet: ${err}`)
    }

    await sleep(SLEEP_MS)
  }

  const estKr = ((totalInputTokens * 0.25 + totalOutputTokens * 1.25) / 1_000_000).toFixed(4)
  payload.logger.info(
    `[AI-synk] Ferdig — behandlet: ${processed}, generert: ${generated}, hoppet over: ${skipped}, feil: ${errors}`,
  )
  payload.logger.info(
    `[AI-synk] Estimert tokenforbruk: ~${totalInputTokens} inn / ~${totalOutputTokens} ut (~$${estKr} USD ved Haiku-priser)`,
  )

  try { await (payload.db as any).pool?.end() } catch { /* ignorert */ }
  process.exit(errors > 0 ? 1 : 0)
}

main().catch(err => {
  console.error('[AI-synk] Krasjet under oppstart:', err)
  process.exit(1)
})
