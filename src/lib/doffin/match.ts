import { CPV_TO_NACE_SECTION } from './cpv'
import { NACE_PREFIX_MAP } from '../businesses/categories'

// SN2007 / NACE Rev.2: NACE-divisjon (heltall) → seksjonsbokstav (A–U).
// Fullstendig tabell — dekker alle gyldige divisjoner.
const NACE_DIVISJON_TIL_SEKSJON: Record<number, string> = {
  // A – Jordbruk, skogbruk og fiske
  1: 'A', 2: 'A', 3: 'A',
  // B – Bergverksdrift og utvinning
  5: 'B', 6: 'B', 7: 'B', 8: 'B', 9: 'B',
  // C – Industri
  10: 'C', 11: 'C', 12: 'C', 13: 'C', 14: 'C', 15: 'C', 16: 'C', 17: 'C',
  18: 'C', 19: 'C', 20: 'C', 21: 'C', 22: 'C', 23: 'C', 24: 'C', 25: 'C',
  26: 'C', 27: 'C', 28: 'C', 29: 'C', 30: 'C', 31: 'C', 32: 'C', 33: 'C',
  // D – Elektrisitets-, gass-, damp- og varmtvannsforsyning
  35: 'D',
  // E – Vannforsyning, avløps- og renovasjonsvirksomhet
  36: 'E', 37: 'E', 38: 'E', 39: 'E',
  // F – Bygge- og anleggsvirksomhet
  41: 'F', 42: 'F', 43: 'F',
  // G – Varehandel, reparasjon av motorvogner
  45: 'G', 46: 'G', 47: 'G',
  // H – Transport og lagring
  49: 'H', 50: 'H', 51: 'H', 52: 'H', 53: 'H',
  // I – Overnattings- og serveringsvirksomhet
  55: 'I', 56: 'I',
  // J – Informasjon og kommunikasjon
  58: 'J', 59: 'J', 60: 'J', 61: 'J', 62: 'J', 63: 'J',
  // K – Finansierings- og forsikringsvirksomhet
  64: 'K', 65: 'K', 66: 'K',
  // L – Omsetning og drift av fast eiendom
  68: 'L',
  // M – Faglig, vitenskapelig og teknisk virksomhet
  69: 'M', 70: 'M', 71: 'M', 72: 'M', 73: 'M', 74: 'M', 75: 'M',
  // N – Forretningsmessig tjenesteyting
  77: 'N', 78: 'N', 79: 'N', 80: 'N', 81: 'N', 82: 'N',
  // O – Offentlig administrasjon og forsvar
  84: 'O',
  // P – Undervisning
  85: 'P',
  // Q – Helse- og sosialtjenester
  86: 'Q', 87: 'Q', 88: 'Q',
  // R – Kultur, underholdning og fritid
  90: 'R', 91: 'R', 92: 'R', 93: 'R',
  // S – Annen tjenesteyting
  94: 'S', 95: 'S', 96: 'S',
  // T – Lønnet arbeid i private husholdninger
  97: 'T', 98: 'T',
  // U – Internasjonale organisasjoner og organer
  99: 'U',
}

/**
 * Utleder NACE-seksjonsbokstav (A–U) fra en NACE-kode (SN2007-format).
 * Eksempler: "45.200" → 'F', "72.10" → 'M', "01.110" → 'A'.
 * Returnerer null ved ugyldig/manglende kode — NaN-safe.
 */
export function naceSeksjonFraKode(naceKode: string | null | undefined): string | null {
  if (!naceKode) return null
  // Fjern punktum og ikke-sifre; ta de to første sifrene
  const sifre = naceKode.replace(/\./g, '').replace(/\D/g, '')
  if (sifre.length < 2) return null
  const div = parseInt(sifre.slice(0, 2), 10)
  if (isNaN(div)) return null
  return NACE_DIVISJON_TIL_SEKSJON[div] ?? null
}

/**
 * Returnerer true hvis et Doffin-anbud er aktuelt for en bedrift
 * med den gitte NACE-seksjonen. Sjekker hoved-CPV og alle tilleggs-CPV-er.
 */
export function erAktueltAnbud(tender: any, naceSeksjon: string): boolean {
  const cpvHoved: string | null = tender.cpvHovedkode ?? null
  const cpvEkstra: string[] = Array.isArray(tender.cpvTilleggskoder) ? tender.cpvTilleggskoder : []
  const allCpv = [...(cpvHoved ? [cpvHoved] : []), ...cpvEkstra]
  if (allCpv.length === 0) return false

  for (const cpv of allCpv) {
    if (typeof cpv !== 'string' || cpv.length < 2) continue
    const cpvDiv = cpv.slice(0, 2)
    if (CPV_TO_NACE_SECTION[cpvDiv] === naceSeksjon) return true
  }
  return false
}

/**
 * Filtrerer en liste over aktive anbud mot en bedrifts naceKode.
 * Alle argumenter er NaN-safe: returnerer [] ved manglende/ugyldig data.
 * Tenders bør forhåndsfiltreres (status=ACTIVE, deadline > now) av kalleren.
 */
export function filtrerAktuelleAnbud(tenders: any[], naceKode: string | null | undefined, limit = 10): any[] {
  if (!naceKode) return []
  const seksjon = naceSeksjonFraKode(naceKode)
  if (!seksjon) return []
  return tenders.filter(t => erAktueltAnbud(t, seksjon)).slice(0, limit)
}

// Forhåndsberegnet: NACE-seksjon → unike kategori-id-er (fra NACE_PREFIX_MAP + NACE_DIVISJON_TIL_SEKSJON).
// Brukes til å mappe CPV-divisjon → kategori-id via seksjonsbokstaven som bro.
const SEKSJON_TO_CAT_IDS = new Map<string, string[]>()
for (const [divStr, catId] of NACE_PREFIX_MAP) {
  const div = parseInt(divStr, 10)
  const seksjon = NACE_DIVISJON_TIL_SEKSJON[div]
  if (!seksjon) continue
  const list = SEKSJON_TO_CAT_IDS.get(seksjon) ?? []
  if (!list.includes(catId)) list.push(catId)
  SEKSJON_TO_CAT_IDS.set(seksjon, list)
}

/**
 * Returnerer alle naceCategory-id-er som et anbud treffer.
 * Kjede: CPV-divisjon (2 første sifre) → CPV_TO_NACE_SECTION → seksjonsbokstav
 * → NACE-divisjoner i den seksjonen → kategori-id (via NACE_PREFIX_MAP).
 * Ett anbud kan treffe flere kategorier (flere CPV-koder er tillatt).
 * Returnerer aldri duplikater.
 */
export function kategorierForAnbud(tender: { cpvHovedkode?: string | null; cpvTilleggskoder?: unknown }): string[] {
  const cpvCodes: string[] = [
    ...(typeof tender.cpvHovedkode === 'string' ? [tender.cpvHovedkode] : []),
    ...(Array.isArray(tender.cpvTilleggskoder)
      ? (tender.cpvTilleggskoder as unknown[]).filter((c): c is string => typeof c === 'string')
      : []),
  ]
  const result = new Set<string>()
  for (const cpv of cpvCodes) {
    if (cpv.length < 2) continue
    const seksjon = CPV_TO_NACE_SECTION[cpv.slice(0, 2)]
    if (!seksjon) continue
    for (const catId of SEKSJON_TO_CAT_IDS.get(seksjon) ?? []) {
      result.add(catId)
    }
  }
  return Array.from(result)
}
