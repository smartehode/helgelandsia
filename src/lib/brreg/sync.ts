import type { Payload } from 'payload'
import type { BrregEnhet, BrregUnderenhet, BrregOppdatering, BrregStatus, SyncResult } from './types'
import { mapNaceToCategory } from '../businesses/categories'

const USER_AGENT = 'Helgelandsia/1.0 (helgelandsia.no)'
const BRREG_API = 'https://data.brreg.no/enhetsregisteret/api'

// Énkildes sannhet for kommunenumre bor i src/lib/helgeland/kommuner.ts.
// 1837 = Meløy (Salten) — IKKE Helgeland, aldri legg til.
import { KOMMUNENUMRE as HELGELAND_KOMMUNENUMRE } from '../helgeland/kommuner'
export { HELGELAND_KOMMUNENUMRE }

// ---------------------------------------------------------------------------
// Hjelpefunksjoner
// ---------------------------------------------------------------------------

function titleCase(s?: string): string {
  if (!s) return ''
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function deriveBrregStatus(enhet: BrregEnhet | BrregUnderenhet): BrregStatus {
  const e = enhet as BrregEnhet
  if (e.konkurs) return 'konkurs'
  if (e.underAvvikling || e.underTvangsavviklingEllerTvangsopplosning) return 'underAvvikling'
  if (e.slettedato) return 'slettet'
  return 'aktiv'
}

// showOnPublicListing bestemmes av kalleren basert på enhetstype og kommunesammenligning:
//   hovedenhet                                   → true (alltid synlig)
//   underenhet med ANNEN kommune enn parent      → true (reell filial)
//   underenhet i SAMME kommune som parent        → false (samlokalisert tvilling)
//   (null-kommuner = ukjent → vis for sikkerhets skyld)
function toBrregUpdateFields(
  enhet: BrregEnhet | BrregUnderenhet,
  entityType: 'hovedenhet' | 'underenhet',
  showOnPublicListing: boolean,
): Record<string, unknown> {
  const isHoved = entityType === 'hovedenhet'
  // Primæradresse: forretningsadresse for hovedenhet, beliggenhetsadresse for underenhet
  const addr = isHoved
    ? (enhet as BrregEnhet).forretningsadresse
    : (enhet as BrregUnderenhet).beliggenhetsadresse
  // Postadresse: finnes for begge enhetstyper
  const post = isHoved
    ? (enhet as BrregEnhet).postadresse
    : (enhet as BrregUnderenhet).postadresse
  // Felt som kun finnes på BrregEnhet (ikke underenhet)
  const hoved = isHoved ? (enhet as BrregEnhet) : null

  // BRREG-autoritative felt — synken skriver KUN til disse.
  // Hviteliste — berikelsesfelt som ALDRI skrives av synken:
  //   name, slug, tagline, description, logo, gallery, video
  //   phone, email, website, address, city, county, country, lat, lng
  //   openingHours, social.*, owner, claimStatus, claimedAt, claimed
  //   featured, submittedBy, source, category, place
  return {
    showOnPublicListing,
    brregLastSynced: new Date().toISOString(),
    brregStatus: deriveBrregStatus(enhet),
    brregEntityType: entityType,
    parentOrgnr: !isHoved ? ((enhet as BrregUnderenhet).overordnetEnhet ?? null) : null,
    // NACE-koder
    naceKode: enhet.naeringskode1?.kode ?? null,
    naceBeskrivelse: enhet.naeringskode1?.beskrivelse ?? null,
    naceCategory: mapNaceToCategory(enhet.naeringskode1?.kode),
    sekundaerNaceKode: enhet.naeringskode2?.kode ?? null,
    sekundaerNaceBeskrivelse: enhet.naeringskode2?.beskrivelse ?? null,
    // Organisasjonsform — lagrer beskrivelse (f.eks. «Enkeltpersonforetak») slik at
    // ENK-filteret i publicListingWhere fortsatt virker mot klartekst-verdien.
    organisasjonsform: enhet.organisasjonsform?.beskrivelse ?? null,
    organisasjonsformBeskrivelse: enhet.organisasjonsform?.beskrivelse ?? null,
    // Geografi
    kommunenummer: addr?.kommunenummer ?? null,
    kommunenavn: addr?.kommune ? titleCase(addr.kommune) : null,
    // Datoer
    registreringsdato: enhet.registreringsdatoEnhetsregisteret ?? null,
    avregistreringsdato: enhet.slettedato ?? null,
    stiftelsesdato: hoved?.stiftelsesdato ?? null,
    // Størrelse og beskrivelse
    // antallAnsatte finnes på begge enhetstyper i BRREG — for underenheter er dette
    // gjerne mer nøyaktig enn på hovedenheten, som kan ha 0 eller null.
    antallAnsatte: enhet.antallAnsatte ?? null,
    aktivitet: hoved?.aktivitet?.join('; ') || null,
    formaal: hoved?.vedtektsfestetFormaal?.join(' ') || null,
    brregHjemmeside: hoved?.hjemmeside ?? null,
    // Registermedlemskap (kun tilgjengelig for BrregEnhet, ikke underenhet)
    registrertIMvaregisteret: hoved?.registrertIMvaregisteret ?? false,
    registrertIForetaksregisteret: hoved?.registrertIForetaksregisteret ?? false,
    registrertIFrivillighetsregisteret: hoved?.registrertIFrivillighetsregisteret ?? false,
    // Forretningsadresse (primæradresse) — adresse[] joins for flerlinjet gateadresse
    forretningsadresse: {
      gate: addr?.adresse?.join(', ') ?? null,
      postnummer: addr?.postnummer ?? null,
      poststed: addr?.poststed ? titleCase(addr.poststed) : null,
    },
    // Postadresse (separat fra leveringsadresse)
    postadresse: {
      gate: post?.adresse?.join(', ') ?? null,
      postnummer: post?.postnummer ?? null,
      poststed: post?.poststed ? titleCase(post.poststed) : null,
    },
  }
}

// Paginerer gjennom BRREG-enheter for én kommune og kaller onEntity for hvert treff.
// Returnerer { count, httpError } — httpError=true betyr at minst én side-request feilet.
async function paginateKommune(
  endpoint: 'enheter' | 'underenheter',
  kommunenummer: string,
  onEntity: (entity: any) => Promise<void>,
  logger?: { error(msg: string): void },
): Promise<{ count: number; httpError: boolean }> {
  let page = 0
  let total = 0

  for (;;) {
    const url = `${BRREG_API}/${endpoint}?kommunenummer=${kommunenummer}&size=200&page=${page}`
    const res = await fetch(url, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      logger?.error(
        `BRREG API feilet: ${endpoint} kommune ${kommunenummer} side ${page} → HTTP ${res.status}`,
      )
      return { count: total, httpError: true }
    }

    const data = await res.json()
    const items: any[] = data._embedded?.[endpoint] ?? []

    for (const item of items) {
      await onEntity(item)
      total++
    }

    const totalPages: number = data.page?.totalPages ?? 1
    if (page >= totalPages - 1 || items.length === 0) break
    page++
  }

  return { count: total, httpError: false }
}

// Oppretter eller oppdaterer én bedrift i Payload basert på orgnr.
// Beriker aldri feltene name, slug, description, logo, gallery, contact-info etc.
// ved oppdatering — kun BRREG-autoritative felt.
async function upsertBusiness(
  payload: Payload,
  orgnr: string,
  name: string,
  brregFields: Record<string, unknown>,
): Promise<{ created: boolean }> {
  const existing = await payload.find({
    collection: 'businesses',
    where: { orgnr: { equals: orgnr } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  if (existing.docs.length > 0) {
    await payload.update({
      collection: 'businesses',
      id: existing.docs[0].id,
      data: { ...(brregFields as any), _status: 'published' },
      overrideAccess: true,
    })
    return { created: false }
  }

  // Ny bedrift — bruk orgnr som slug (9 sifre, alltid unik)
  await payload.create({
    collection: 'businesses',
    data: {
      name,
      slug: orgnr,
      orgnr,
      source: 'brreg',
      ...(brregFields as any),
      _status: 'published',
    },
    overrideAccess: true,
  })
  return { created: true }
}

async function markBrregStatus(
  payload: Payload,
  orgnr: string,
  status: BrregStatus,
): Promise<void> {
  const existing = await payload.find({
    collection: 'businesses',
    where: { orgnr: { equals: orgnr } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  if (!existing.docs.length) return
  await payload.update({
    collection: 'businesses',
    id: existing.docs[0].id,
    data: { brregStatus: status, brregLastSynced: new Date().toISOString() } as any,
    overrideAccess: true,
  })
}

async function logSyncJob(payload: Payload, result: SyncResult, errorMessage?: string): Promise<void> {
  const totalWork = result.created + result.updated
  let status: 'success' | 'partial' | 'failed'
  let msg = errorMessage

  if (result.errors > 0 && totalWork === 0) {
    status = 'failed'
  } else if (result.syncType === 'full' && totalWork === 0 && result.errors === 0) {
    // Full synk som finner 0 enheter — alltid en API-feil, aldri normalt
    status = 'failed'
    msg = msg ?? 'Full synk fant 0 enheter — sjekk API-tilkobling og kommunenumre'
  } else if (result.errors > 0) {
    status = 'partial'
  } else {
    status = 'success'
  }

  try {
    await payload.create({
      collection: 'brreg-sync-jobs',
      data: {
        syncType: result.syncType,
        status,
        created: result.created,
        updated: result.updated,
        skipped: result.skipped,
        errors: result.errors,
        errorMessage: msg ?? null,
      } as any,
      overrideAccess: true,
    })
  } catch {
    // Logging er ikke kritisk
  }
}

// Laster alle kjente Helgeland-hovedenheter inn i en Map: orgnr → kommunenummer.
// Brukes til (1) parent-sjekk av underenheter og (2) kommunesammenligning for dedup-regelen.
async function loadHelgelandParentMap(payload: Payload): Promise<Map<string, string | null>> {
  const map = new Map<string, string | null>()
  let page = 1

  for (;;) {
    const batch = await payload.find({
      collection: 'businesses',
      where: {
        and: [
          { source: { equals: 'brreg' } },
          { brregEntityType: { equals: 'hovedenhet' } },
        ],
      },
      limit: 2000,
      page,
      depth: 0,
      overrideAccess: true,
    })
    for (const doc of batch.docs) {
      if (doc.orgnr) {
        map.set(doc.orgnr as string, (doc.kommunenummer as string) ?? null)
      }
    }
    if (!batch.hasNextPage) break
    page++
  }

  return map
}

// Bestemmer showOnPublicListing for en underenhet.
// Regel: underenhet i SAMME kommune som sin hovedenhet = samlokalisert tvilling → false.
// Anderenhet i ANNEN kommune = reell filial → true.
// Manglende kommuneinfo = vis for sikkerhets skyld → true.
function resolveUnderShowOnPublicListing(
  parentKommune: string | null | undefined,
  underKommune: string | null | undefined,
): boolean {
  if (!parentKommune || !underKommune) return true
  return parentKommune !== underKommune
}

// ---------------------------------------------------------------------------
// Inkrementell synk — oppdateringer siden sist (brukes daglig)
// ---------------------------------------------------------------------------

async function processOppdateringer(
  baseUrl: string,
  entityType: 'hovedenhet' | 'underenhet',
  payload: Payload,
  result: SyncResult,
  parentMap?: Map<string, string | null>,
): Promise<void> {
  let nextUrl: string | null = baseUrl
  payload.logger.info(`BRREG oppdateringer — starter: ${baseUrl}`)

  while (nextUrl) {
    payload.logger.info(`BRREG oppdateringer — henter: ${nextUrl}`)
    const res: Response = await fetch(nextUrl, {
      headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
    })
    if (!res.ok) {
      payload.logger.error(`BRREG oppdateringer feilet: HTTP ${res.status} — URL: ${nextUrl}`)
      result.errors++
      break
    }

    const data: any = await res.json()
    const oppdateringer: BrregOppdatering[] =
      data._embedded?.oppdaterteEnheter ??
      data._embedded?.oppdaterteUnderenheter ??
      []

    for (const op of oppdateringer) {
      try {
        if (op.endringstype === 'Sletting') {
          await markBrregStatus(payload, op.organisasjonsnummer, 'slettet')
          result.updated++
          continue
        }
        if (op.endringstype === 'Fjernet') {
          await markBrregStatus(payload, op.organisasjonsnummer, 'fjernet')
          result.updated++
          continue
        }

        // Endring eller Ny — hent full enhet og upsert
        const isUnder = entityType === 'underenhet'
        const entityUrl = isUnder
          ? `${BRREG_API}/underenheter/${op.organisasjonsnummer}`
          : `${BRREG_API}/enheter/${op.organisasjonsnummer}`

        const entityRes = await fetch(entityUrl, {
          headers: { Accept: 'application/json', 'User-Agent': USER_AGENT },
        })
        if (entityRes.status === 410) {
          await markBrregStatus(payload, op.organisasjonsnummer, 'fjernet')
          result.updated++
          continue
        }
        if (!entityRes.ok) { result.errors++; continue }

        const enhet: BrregEnhet | BrregUnderenhet = await entityRes.json()

        let showOnPublicListing: boolean

        if (isUnder) {
          // Onderenhet: sjekk at moderselskapet er en Helgeland-bedrift
          const parent = (enhet as BrregUnderenhet).overordnetEnhet
          if (!parent) { result.skipped++; continue }

          let parentKommune: string | null = null
          if (parentMap) {
            if (!parentMap.has(parent)) { result.skipped++; continue }
            parentKommune = parentMap.get(parent) ?? null
          } else {
            // Slå opp i DB hvis parentMap ikke er tilgjengelig
            const found = await payload.find({
              collection: 'businesses',
              where: {
                and: [
                  { orgnr: { equals: parent } },
                  { source: { equals: 'brreg' } },
                  { brregEntityType: { equals: 'hovedenhet' } },
                ],
              },
              limit: 1,
              depth: 0,
              overrideAccess: true,
            })
            if (!found.docs.length) { result.skipped++; continue }
            parentKommune = (found.docs[0].kommunenummer as string) ?? null
          }

          const underKommune = (enhet as BrregUnderenhet).beliggenhetsadresse?.kommunenummer ?? null
          showOnPublicListing = resolveUnderShowOnPublicListing(parentKommune, underKommune)
        } else {
          // Hoofdenhet: sjekk at den er i en Helgeland-kommune
          const addr = (enhet as BrregEnhet).forretningsadresse
          if (!addr?.kommunenummer || !HELGELAND_KOMMUNENUMRE.has(addr.kommunenummer)) {
            result.skipped++
            continue
          }
          showOnPublicListing = true
        }

        const fields = toBrregUpdateFields(enhet, entityType, showOnPublicListing)
        const { created } = await upsertBusiness(payload, enhet.organisasjonsnummer, enhet.navn, fields)
        if (created) result.created++
        else result.updated++
      } catch (e) {
        payload.logger.error(`Feil ved oppdatering ${op.organisasjonsnummer}: ${String(e)}`)
        result.errors++
      }
    }

    // Følg neste side hvis finnes
    const nextLink: string | undefined = data._links?.next?.href
    nextUrl = nextLink && nextLink !== nextUrl ? nextLink : null
  }
}

// ---------------------------------------------------------------------------
// Eksporterte synk-funksjoner
// ---------------------------------------------------------------------------

export async function runFullSync(payload: Payload): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0, syncType: 'full' }
  let topError: string | undefined

  try {
    // --- Oppstartsdiagnostikk: DB-tilkobling ---
    try {
      const dbCheck = await payload.count({ collection: 'businesses', overrideAccess: true })
      payload.logger.info(
        `BRREG full synk starter — DB OK, ${dbCheck.totalDocs} bedrifter i DB, ` +
        `${HELGELAND_KOMMUNENUMRE.size} kommuner skal hentes`,
      )
    } catch (e) {
      payload.logger.error(`BRREG full synk — DB-tilkobling feilet: ${String(e)}`)
      throw e
    }

    // --- Pass 1: Alle HOOFDENHETER for alle kommuner ---
    payload.logger.info('BRREG full synk — pass 1: hovedenheter')
    let pass1Total = 0
    for (const kommunenummer of HELGELAND_KOMMUNENUMRE) {
      const { count, httpError } = await paginateKommune(
        'enheter',
        kommunenummer,
        async (enhet: BrregEnhet) => {
          try {
            const fields = toBrregUpdateFields(enhet, 'hovedenhet', true)
            const { created } = await upsertBusiness(payload, enhet.organisasjonsnummer, enhet.navn, fields)
            if (created) result.created++
            else result.updated++
          } catch (e) {
            payload.logger.error(`Upsert feilet for ${enhet.organisasjonsnummer}: ${String(e)}`)
            result.errors++
          }
        },
        payload.logger,
      )
      if (httpError) result.errors++
      if (count > 0) payload.logger.info(`  Pass 1 — kommune ${kommunenummer}: ${count} enheter hentet`)
      pass1Total += count
    }
    payload.logger.info(`Pass 1 ferdig — totalt ${pass1Total} enheter hentet fra BRREG`)

    // --- Bygg parentMap: orgnr → kommunenummer for alle Helgeland-hovedenheter ---
    payload.logger.info('BRREG full synk — laster parentMap')
    const parentMap = await loadHelgelandParentMap(payload)
    payload.logger.info(`${parentMap.size} hovedenheter funnet i Helgeland`)

    // --- Pass 2: ONDERENHETER — kun der overordnetEnhet er i Helgeland ---
    // Dedup-regel: underenhet i SAMME kommune som sin hovedenhet → showOnPublicListing=false
    // (samlokalisert tvilling). Onderenhet i ANNEN kommune → true (reell filial).
    payload.logger.info('BRREG full synk — pass 2: underenheter')
    let pass2Total = 0
    for (const kommunenummer of HELGELAND_KOMMUNENUMRE) {
      const { count, httpError } = await paginateKommune(
        'underenheter',
        kommunenummer,
        async (enhet: BrregUnderenhet) => {
          try {
            const parent = enhet.overordnetEnhet
            if (!parent || !parentMap.has(parent)) {
              result.skipped++
              return
            }
            const parentKommune = parentMap.get(parent) ?? null
            const underKommune = enhet.beliggenhetsadresse?.kommunenummer ?? null
            const showOnPublicListing = resolveUnderShowOnPublicListing(parentKommune, underKommune)
            const fields = toBrregUpdateFields(enhet, 'underenhet', showOnPublicListing)
            const { created } = await upsertBusiness(payload, enhet.organisasjonsnummer, enhet.navn, fields)
            if (created) result.created++
            else result.updated++
          } catch (e) {
            payload.logger.error(`Upsert underenhet feilet for ${enhet.organisasjonsnummer}: ${String(e)}`)
            result.errors++
          }
        },
        payload.logger,
      )
      if (httpError) result.errors++
      if (count > 0) payload.logger.info(`  Pass 2 — kommune ${kommunenummer}: ${count} underenheter hentet`)
      pass2Total += count
    }
    payload.logger.info(`Pass 2 ferdig — totalt ${pass2Total} underenheter hentet fra BRREG`)
  } catch (e) {
    topError = String(e)
    payload.logger.error(`Full BRREG-synk avbrutt: ${topError}`)
    result.errors++
  }

  await logSyncJob(payload, result, topError)
  return result
}

// Importerer én kommune (enheter + underenheter). Brukes for å tette hull
// etter feil, f.eks. 1833 (Rana) som manglet i den første full synken.
export async function syncKommune(payload: Payload, kommunenummer: string): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0, syncType: 'full' }
  let topError: string | undefined

  try {
    // Enheter for denne kommunen
    const { count: enhetCount, httpError: enhetErr } = await paginateKommune(
      'enheter',
      kommunenummer,
      async (enhet: BrregEnhet) => {
        try {
          const fields = toBrregUpdateFields(enhet, 'hovedenhet', true)
          const { created } = await upsertBusiness(payload, enhet.organisasjonsnummer, enhet.navn, fields)
          if (created) result.created++
          else result.updated++
        } catch (e) {
          payload.logger.error(`Upsert feilet for ${enhet.organisasjonsnummer}: ${String(e)}`)
          result.errors++
        }
      },
      payload.logger,
    )
    payload.logger.info(`Kommune ${kommunenummer}: ${enhetCount} enheter hentet fra BRREG`)
    if (enhetErr) result.errors++

    // Last parentMap (alle kjente Helgeland-hovedenheter, inkl. det vi nettopp importerte)
    const parentMap = await loadHelgelandParentMap(payload)

    // Onderenheter for denne kommunen (filter på parent + dedup-regel)
    const { count: underCount, httpError: underErr } = await paginateKommune(
      'underenheter',
      kommunenummer,
      async (enhet: BrregUnderenhet) => {
        try {
          const parent = enhet.overordnetEnhet
          if (!parent || !parentMap.has(parent)) {
            result.skipped++
            return
          }
          const parentKommune = parentMap.get(parent) ?? null
          const underKommune = enhet.beliggenhetsadresse?.kommunenummer ?? null
          const showOnPublicListing = resolveUnderShowOnPublicListing(parentKommune, underKommune)
          const fields = toBrregUpdateFields(enhet, 'underenhet', showOnPublicListing)
          const { created } = await upsertBusiness(payload, enhet.organisasjonsnummer, enhet.navn, fields)
          if (created) result.created++
          else result.updated++
        } catch (e) {
          payload.logger.error(`Upsert underenhet feilet for ${enhet.organisasjonsnummer}: ${String(e)}`)
          result.errors++
        }
      },
      payload.logger,
    )
    payload.logger.info(`Kommune ${kommunenummer}: ${underCount} underenheter hentet fra BRREG`)
    if (underErr) result.errors++
  } catch (e) {
    topError = String(e)
    payload.logger.error(`Kommune-synk ${kommunenummer} avbrutt: ${topError}`)
    result.errors++
  }

  await logSyncJob(payload, result, topError)
  return result
}

export async function runIncrementalSync(payload: Payload, since: string): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, skipped: 0, errors: 0, syncType: 'incremental' }

  // BRREG krever full ISO-timestamp på dato-parameteret.
  // Normaliser: "2026-06-13" → "2026-06-13T00:00:00.000Z"
  const isoSince = /^\d{4}-\d{2}-\d{2}$/.test(since)
    ? `${since}T00:00:00.000Z`
    : since
  payload.logger.info(`BRREG inkrementell synk — dato: ${isoSince}`)

  // Last parentMap for parent-sjekk og dedup-regel
  const parentMap = await loadHelgelandParentMap(payload)

  await processOppdateringer(
    `${BRREG_API}/oppdateringer/enheter?dato=${encodeURIComponent(isoSince)}&size=100`,
    'hovedenhet',
    payload,
    result,
    parentMap,
  )
  await processOppdateringer(
    `${BRREG_API}/oppdateringer/underenheter?dato=${encodeURIComponent(isoSince)}&size=100`,
    'underenhet',
    payload,
    result,
    parentMap,
  )

  await logSyncJob(payload, result)
  return result
}
