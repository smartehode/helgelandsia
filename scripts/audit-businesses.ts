/**
 * READ-ONLY revisjonsskript for Businesses-collection.
 * Ingen skriving, ingen migrasjon, ingen sideeffekter — kun SELECT/telling.
 *
 * Kjøring:
 *   npx tsx scripts/audit-businesses.ts
 */

// Laster .env FØR Payload initialiseres (trenger DATABASE_URI og PAYLOAD_SECRET)
import 'dotenv/config'

import { getPayload } from 'payload'
import config from '../payload.config'

type Row = Record<string, unknown>

async function q(pool: any, sql: string, params: unknown[] = []): Promise<Row[]> {
  const result = await pool.query(sql, params)
  return result.rows
}

const LINE = '─'.repeat(64)
const THIN = '·'.repeat(64)

function section(title: string) {
  console.log('\n' + LINE)
  console.log(`  ${title}`)
  console.log(LINE)
}

function kv(label: string, value: unknown, pad = 44) {
  console.log(`  ${label.padEnd(pad)}${value}`)
}

async function main() {
  const payload = await getPayload({ config })
  const pool = (payload.db as any).pool

  // ──────────────────────────────────────────────────────────────
  section('BUSINESSES — REVISJONSRAPPORT')
  console.log(`  Tidspunkt: ${new Date().toLocaleString('nb-NO')}`)

  // ──────────────────────────────────────────────────────────────
  section('1. TABELLNAVN OG FELTOVERSIKT')

  // Bekreft at tabellen finnes og hent alle kolonner
  const cols = await q(
    pool,
    `SELECT column_name, data_type, udt_name, is_nullable, column_default
     FROM information_schema.columns
     WHERE table_schema = 'public' AND table_name = 'businesses'
     ORDER BY ordinal_position`,
  )

  if (cols.length === 0) {
    console.log('  FEIL: Fant ingen tabell "businesses" i public-skjema.')
    process.exit(1)
  }

  console.log(`\n  Tabell: public.businesses — ${cols.length} kolonner\n`)
  console.log(
    '  ' +
      'Kolonne'.padEnd(34) +
      'Type'.padEnd(20) +
      'Nullable'.padEnd(10) +
      'Default',
  )
  console.log('  ' + THIN)
  for (const c of cols) {
    const type =
      c.udt_name && (c.udt_name as string).startsWith('enum_')
        ? `ENUM(${(c.udt_name as string).replace('enum_businesses_', '')})`
        : String(c.data_type)
    const def = c.column_default
      ? String(c.column_default).substring(0, 24)
      : ''
    console.log(
      '  ' +
        String(c.column_name).padEnd(34) +
        type.padEnd(20) +
        String(c.is_nullable).padEnd(10) +
        def,
    )
  }

  // ──────────────────────────────────────────────────────────────
  section('2. RADTELLING — TOTALOVERSIKT')

  const [{ total }] = await q(pool, 'SELECT COUNT(*) AS total FROM businesses')
  const [{ med_orgnr }] = await q(
    pool,
    `SELECT COUNT(*) AS med_orgnr FROM businesses WHERE orgnr IS NOT NULL AND orgnr <> ''`,
  )
  const [{ uten_orgnr }] = await q(
    pool,
    `SELECT COUNT(*) AS uten_orgnr FROM businesses WHERE orgnr IS NULL OR orgnr = ''`,
  )
  const [{ unike_orgnr }] = await q(
    pool,
    `SELECT COUNT(DISTINCT orgnr) AS unike_orgnr FROM businesses WHERE orgnr IS NOT NULL AND orgnr <> ''`,
  )

  kv('Totalt antall rader', total)
  kv('Rader med orgnr', med_orgnr)
  kv('Rader uten orgnr (null/tom)', uten_orgnr)
  kv('Unike orgnr-verdier', unike_orgnr)

  // ──────────────────────────────────────────────────────────────
  section('3. DUPLIKATSJEKK PÅ ORGNR')

  const [{ dup_orgnr_count }] = await q(
    pool,
    `SELECT COUNT(*) AS dup_orgnr_count
     FROM (
       SELECT orgnr FROM businesses
       WHERE orgnr IS NOT NULL AND orgnr <> ''
       GROUP BY orgnr HAVING COUNT(*) > 1
     ) sub`,
  )

  const [{ overflodige_rader }] = await q(
    pool,
    `SELECT COALESCE(SUM(cnt - 1), 0) AS overflodige_rader
     FROM (
       SELECT COUNT(*) AS cnt FROM businesses
       WHERE orgnr IS NOT NULL AND orgnr <> ''
       GROUP BY orgnr HAVING COUNT(*) > 1
     ) sub`,
  )

  kv('Orgnr med mer enn én rad (duplikater)', dup_orgnr_count)
  kv('Overflødige rader totalt (sum(antall-1))', overflodige_rader)

  if (Number(dup_orgnr_count) > 0) {
    console.log('\n  De 20 verste duplikatene:\n')
    console.log(
      '  ' + 'orgnr'.padEnd(14) + 'ant'.padEnd(6) + 'navn (første rad)',
    )
    console.log('  ' + THIN)

    const dups = await q(
      pool,
      `SELECT d.orgnr, d.cnt, b.name
       FROM (
         SELECT orgnr, COUNT(*) AS cnt FROM businesses
         WHERE orgnr IS NOT NULL AND orgnr <> ''
         GROUP BY orgnr HAVING COUNT(*) > 1
         ORDER BY COUNT(*) DESC
         LIMIT 20
       ) d
       JOIN businesses b ON b.orgnr = d.orgnr
       WHERE b.id = (SELECT id FROM businesses b2 WHERE b2.orgnr = d.orgnr LIMIT 1)`,
    )
    for (const r of dups) {
      console.log(
        '  ' +
          String(r.orgnr).padEnd(14) +
          String(r.cnt).padEnd(6) +
          String(r.name).substring(0, 44),
      )
    }
  } else {
    console.log('\n  Ingen duplikater på orgnr — databasen er konsistent.')
  }

  // ──────────────────────────────────────────────────────────────
  section('4. ENHETSTYPE OG STATUS')

  const entityTypes = await q(
    pool,
    `SELECT brreg_entity_type::text AS type, COUNT(*) AS ant
     FROM businesses
     GROUP BY brreg_entity_type::text
     ORDER BY ant DESC`,
  )
  console.log('\n  Enhetstype:')
  for (const r of entityTypes) {
    kv(`    ${r.type ?? '(null)'}`, r.ant)
  }

  const statuses = await q(
    pool,
    `SELECT brreg_status, COUNT(*) AS ant
     FROM businesses
     GROUP BY brreg_status
     ORDER BY ant DESC`,
  )
  console.log('\n  BRREG-status:')
  for (const r of statuses) {
    kv(`    ${r.brreg_status ?? '(null)'}`, r.ant)
  }

  const publishedStatus = await q(
    pool,
    `SELECT _status, COUNT(*) AS ant FROM businesses GROUP BY _status ORDER BY ant DESC`,
  )
  console.log('\n  Payload-status (_status):')
  for (const r of publishedStatus) {
    kv(`    ${r._status ?? '(null)'}`, r.ant)
  }

  // ──────────────────────────────────────────────────────────────
  section('5. KILDE OG BERIKING')

  const sources = await q(
    pool,
    `SELECT source, COUNT(*) AS ant FROM businesses GROUP BY source ORDER BY ant DESC`,
  )
  console.log('\n  Kilde (source):')
  for (const r of sources) {
    kv(`    ${r.source ?? '(null)'}`, r.ant)
  }

  const [{ med_logo }] = await q(
    pool,
    `SELECT COUNT(*) AS med_logo FROM businesses WHERE logo_id IS NOT NULL`,
  )
  const [{ med_beskrivelse }] = await q(
    pool,
    `SELECT COUNT(*) AS med_beskrivelse FROM businesses WHERE description IS NOT NULL`,
  )
  const [{ med_nettside }] = await q(
    pool,
    `SELECT COUNT(*) AS med_nettside FROM businesses WHERE website IS NOT NULL AND website <> ''`,
  )
  const [{ med_lat }] = await q(
    pool,
    `SELECT COUNT(*) AS med_lat FROM businesses WHERE lat IS NOT NULL`,
  )
  const [{ claimed_count }] = await q(
    pool,
    `SELECT COUNT(*) AS claimed_count FROM businesses WHERE claimed = true`,
  )

  console.log('\n  Berikingsstatus:')
  kv('    Med logo', med_logo)
  kv('    Med beskrivelse (richtext)', med_beskrivelse)
  kv('    Med nettside', med_nettside)
  kv('    Med koordinater (lat/lng)', med_lat)
  kv('    Krevd av eier (claimed)', claimed_count)

  // ──────────────────────────────────────────────────────────────
  section('6. KATEGORIER (naceCategory) — PUBLISERTE IKKE-ENK')

  const catCounts = await q(
    pool,
    `SELECT COALESCE(nace_category::text, '(ingen)') AS kat, COUNT(*) AS ant
     FROM businesses
     WHERE _status = 'published'
       AND (organisasjonsform != 'Enkeltpersonforetak' OR organisasjonsform IS NULL)
     GROUP BY nace_category::text
     ORDER BY ant DESC`,
  )
  console.log()
  let catTotal = 0
  for (const r of catCounts) {
    kv(`    ${String(r.kat).padEnd(30)}`, r.ant)
    catTotal += Number(r.ant)
  }
  console.log('  ' + THIN)
  kv('    TOTAL (publiserte, ikke ENK)', catTotal)

  // ──────────────────────────────────────────────────────────────
  section('7. KOMMUNEFORDELING — TOPP 20')

  const kommuner = await q(
    pool,
    `SELECT COALESCE(kommunenavn, '(ukjent)') AS kommune,
            kommunenummer,
            COUNT(*) AS ant
     FROM businesses
     WHERE source = 'brreg'
     GROUP BY kommunenavn, kommunenummer
     ORDER BY ant DESC
     LIMIT 20`,
  )
  console.log('\n  ' + 'Kommune'.padEnd(22) + 'Nr'.padEnd(8) + 'Antall')
  console.log('  ' + THIN)
  for (const r of kommuner) {
    console.log(
      '  ' +
        String(r.kommune).padEnd(22) +
        String(r.kommunenummer ?? '').padEnd(8) +
        String(r.ant),
    )
  }

  // ──────────────────────────────────────────────────────────────
  section('FERDIG')
  console.log()

  try { await pool.end() } catch { /* ignorert */ }
  process.exit(0)
}

main().catch(err => {
  console.error('Skript krasjet:', err)
  process.exit(1)
})
