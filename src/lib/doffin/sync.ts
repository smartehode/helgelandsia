import type { Payload } from 'payload'
import type { DoffinSearchHit, DoffinSearchResponse, DoffinNoticeDetail, SyncResult } from './types'
import { sendTenderDigests } from '../email/tender-digest'

const API_BASE = 'https://api.doffin.no/webclient/api/v2'
const USER_AGENT = 'Helgelandsia/1.0 (helgelandsia.no)'
const PAGE_SIZE = 100

// Riktig body-format for Doffin webclient-API — avledet fra JS-bundle (index-iNEpnWfA.js).
// «facets» er et navngitt objekt (ikke array), «page» er 1-indeksert.
// Lokasjonsfilteret heter «location» i requesten; i responsens hits heter feltet «locationId».
// NO071 = Nordland. (NO082=Viken, NO072=Troms — verifisert 2026-07-05.)
function buildSearchBody(page: number): string {
  return JSON.stringify({
    numHitsPerPage: PAGE_SIZE,
    page,
    searchString: '',
    sortBy: 'RELEVANCE',
    facets: {
      cpvCodesLabel:             { checkedItems: [] },
      cpvCodesId:                { checkedItems: [] },
      type:                      { checkedItems: [] },
      status:                    { checkedItems: ['ACTIVE'] },
      contractNature:            { checkedItems: [] },
      procurementStrategicLabels:{ checkedItems: [] },
      publicationDate:           { from: null, to: null },
      location:                  { checkedItems: ['NO071'] },   // NO071 = Nordland
      buyer:                     { checkedItems: [] },
      winner:                    { checkedItems: [] },
    },
  })
}

async function fetchPage(page: number): Promise<DoffinSearchResponse> {
  const body = buildSearchBody(page)
  const res = await fetch(`${API_BASE}/search-api/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': USER_AGENT,
    },
    body,
  })
  if (!res.ok) throw new Error(`Doffin søk HTTP ${res.status} (side ${page})`)
  return res.json() as Promise<DoffinSearchResponse>
}

// Henter detaljer for ett anbud (inkl. CPV-koder som ikke er i søkeresultatet).
async function fetchDetail(id: string): Promise<DoffinNoticeDetail> {
  const res = await fetch(`${API_BASE}/notices-api/notices/${id}`, {
    headers: { 'User-Agent': USER_AGENT },
  })
  if (!res.ok) throw new Error(`Doffin detalj HTTP ${res.status}`)
  return res.json() as Promise<DoffinNoticeDetail>
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// Helgeland-kommuner: nøkkelord → kanonisk kommunenavn.
// Rekkefølge: lengere/mer spesifikke nøkkelord FØR kortere for å unngå falske treff
// ('rana' ville matche 'leirfjord' om 'rana' kom sist — rekkefølge er sikker her).
const HELGELAND_KOMMUNER: [string, string][] = [
  ['hattfjelldal', 'Hattfjelldal'],
  ['vevelstad', 'Vevelstad'],
  ['sandnessjøen', 'Alstahaug'],
  ['alstahaug', 'Alstahaug'],
  ['brønnøysund', 'Brønnøy'],
  ['brønnøy', 'Brønnøy'],
  ['leirfjord', 'Leirfjord'],
  ['mosjøen', 'Vefsn'],
  ['lurøy', 'Lurøy'],
  ['træna', 'Træna'],
  ['rødøy', 'Rødøy'],
  ['hemnes', 'Hemnes'],
  ['nesna', 'Nesna'],
  ['dønna', 'Dønna'],
  ['sømna', 'Sømna'],
  ['bindal', 'Bindal'],
  ['vefsn', 'Vefsn'],
  ['grane', 'Grane'],
  ['herøy', 'Herøy'],
  ['vega', 'Vega'],
  ['rana', 'Rana'],
  ['helgeland', 'Helgeland'],
]

function deriveKommune(buyers: { name: string }[]): string | null {
  const names = buyers.map(b => b.name.toLowerCase()).join(' ')
  for (const [kw, kommune] of HELGELAND_KOMMUNER) {
    if (names.includes(kw)) return kommune
  }
  return null
}

export async function runDoffinSync(payload: Payload): Promise<SyncResult> {
  const result: SyncResult = { created: 0, updated: 0, expired: 0, errors: 0, total: 0, notified: 0 }
  const createdTenders: any[] = []

  // Hent alle aktive Nordland-kunngjøringer (paginert, 1-indeksert)
  const allHits = new Map<string, DoffinSearchHit>()
  let page = 1
  for (;;) {
    let resp: DoffinSearchResponse
    try {
      resp = await fetchPage(page)
    } catch (err) {
      payload.logger.error(`[Doffin] Side ${page} feiler: ${err}`)
      result.errors++
      break
    }
    for (const hit of resp.hits) allHits.set(hit.id, hit)
    payload.logger.info(`[Doffin] Side ${page}: ${resp.hits.length} kunngjøringer (totalt sett: ${allHits.size})`)
    if (resp.hits.length < PAGE_SIZE) break
    page++
  }
  result.total = allHits.size

  if (allHits.size === 0) {
    payload.logger.warn('[Doffin] Ingen kunngjøringer returnert — avbryter synk')
    return result
  }

  // Upsert hver kunngjøring
  for (const hit of allHits.values()) {
    try {
      const existing = await payload.find({
        collection: 'tenders' as any,
        where: { doffinId: { equals: hit.id } },
        limit: 1,
        overrideAccess: true,
      })

      if (existing.totalDocs === 0) {
        // Nytt anbud — hent detaljer for å få CPV-koder
        await sleep(200) // politt mot Doffin-API-et
        let cpvHovedkode: string | null = null
        let cpvTilleggskoder: string[] = []
        try {
          const detail = await fetchDetail(hit.id)
          cpvHovedkode = detail.directCpvCodes[0] ?? null
          cpvTilleggskoder = detail.directCpvCodes
        } catch (err) {
          payload.logger.warn(`[Doffin] Detalj feilet for ${hit.id}: ${err}`)
          result.errors++
        }

        const newDoc = await payload.create({
          collection: 'tenders' as any,
          data: {
            doffinId: hit.id,
            title: hit.heading,
            description: hit.description ?? null,
            buyerName: hit.buyer[0]?.name ?? 'Ukjent',
            buyerOrgNr: hit.buyer[0]?.organizationId ?? null,
            municipality: deriveKommune(hit.buyer),
            locationId: hit.locationId,
            placeOfPerformance: hit.placeOfPerformance,
            noticeType: hit.type,
            status: hit.status as 'ACTIVE',
            publicationDate: hit.publicationDate ?? null,
            deadline: hit.deadline ?? null,
            cpvHovedkode,
            cpvTilleggskoder,
            doffinUrl: `https://doffin.no/notices/${hit.id}`,
            lastSynced: new Date().toISOString(),
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          overrideAccess: true,
        })
        createdTenders.push(newDoc)
        result.created++
      } else {
        // Eksisterende — oppdater kun status/frist/synkdato
        await payload.update({
          collection: 'tenders' as any,
          id: existing.docs[0].id,
          data: {
            status: hit.status as 'ACTIVE',
            deadline: hit.deadline ?? null,
            lastSynced: new Date().toISOString(),
          } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          overrideAccess: true,
        })
        result.updated++
      }
    } catch (err) {
      payload.logger.error(`[Doffin] Feil ved upsert ${hit.id}: ${err}`)
      result.errors++
    }
  }

  // Send e-postvarsler om nye anbud — KUN når TENDER_DIGEST_ENABLED=true.
  // Standard er av, slik at koden kan deployes og testes uten utilsiktet utsending.
  // Aktiver bevisst i prod: sett TENDER_DIGEST_ENABLED=true i Docker Compose-env.
  if (createdTenders.length > 0 && process.env.TENDER_DIGEST_ENABLED === 'true') {
    try {
      const { notified } = await sendTenderDigests(payload, createdTenders)
      result.notified = notified
      payload.logger.info(`[Doffin] E-postvarsler sendt: ${notified}`)
    } catch (err) {
      payload.logger.error(`[Doffin] sendTenderDigests feilet: ${err}`)
    }
  } else if (createdTenders.length > 0) {
    payload.logger.info(`[Doffin] ${createdTenders.length} nye anbud — varsling deaktivert (TENDER_DIGEST_ENABLED ikke satt)`)
  }

  // Marker utgåtte: aktive i DB men ikke lenger i Doffin-resultatlisten
  try {
    const activeInDb = await payload.find({
      collection: 'tenders' as any,
      where: { status: { equals: 'ACTIVE' } },
      limit: 1000,
      overrideAccess: true,
    })
    for (const tender of activeInDb.docs) {
      const t = tender as any // eslint-disable-line @typescript-eslint/no-explicit-any
      if (!allHits.has(t.doffinId)) {
        await payload.update({
          collection: 'tenders' as any,
          id: t.id,
          data: { status: 'EXPIRED', lastSynced: new Date().toISOString() } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
          overrideAccess: true,
        })
        result.expired++
      }
    }
  } catch (err) {
    payload.logger.error(`[Doffin] Feil ved markering av utgåtte: ${err}`)
    result.errors++
  }

  return result
}
