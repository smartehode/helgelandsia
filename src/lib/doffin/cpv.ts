// CPV-koder (Common Procurement Vocabulary) brukt i offentlig anskaffelse i EU/EØS.
// Divisjoner er de to første sifrene i en 8-sifret CPV-kode.
// Kilde: EU-forordning 213/2008 (CPV 2008-revisjon).

export const CPV_DIVISIONS: Record<string, string> = {
  '03': 'Landbruk, skogbruk og fiske',
  '09': 'Petroleumsprodukter',
  '14': 'Gruvedrift og steinbrudd',
  '15': 'Næringsmidler',
  '16': 'Landbruksmaskiner',
  '18': 'Klær og tekstiler',
  '19': 'Lær og tekstilmaterialer',
  '22': 'Trykksaker og trykkeriartikler',
  '24': 'Kjemiske produkter',
  '30': 'Kontorutstyr og -rekvisita',
  '31': 'Elektrisk utstyr',
  '32': 'Radio- og telekommunikasjonsutstyr',
  '33': 'Medisinsk utstyr og forbruksartikler',
  '34': 'Transportutstyr og -hjelpemidler',
  '35': 'Sikkerhets- og beredskapsmateriell',
  '37': 'Sport, fritid og musikk',
  '38': 'Laboratorie- og optisk utstyr',
  '39': 'Møbler, innredning og utstyr',
  '41': 'Vann',
  '42': 'Industriell maskineri',
  '43': 'Anleggs- og gruvedriftsmaskiner',
  '44': 'Konstruksjoner og byggematerialer',
  '45': 'Bygge- og anleggsarbeid',
  '48': 'Programvare og IT-systemer',
  '50': 'Reparasjon og vedlikehold',
  '51': 'Installasjonstjenester',
  '55': 'Overnatting, mat og servering',
  '60': 'Transporttjenester',
  '63': 'Støtte til transport og logistikk',
  '64': 'Post og telekommunikasjon',
  '65': 'Offentlige forsyningstjenester',
  '66': 'Finansielle tjenester og forsikring',
  '70': 'Eiendomstjenester',
  '71': 'Arkitektur, ingeniør og rådgivning',
  '72': 'IT-tjenester',
  '73': 'Forskning og utvikling',
  '75': 'Offentlig forvaltning og forsvar',
  '76': 'Tjenester knyttet til olje og gass',
  '77': 'Landbruk, skogbruk og hagebrukstjenester',
  '79': 'Næringstjenester og ledelsestjenester',
  '80': 'Opplæring og utdanning',
  '85': 'Helse- og sosialtjenester',
  '90': 'Kloakk, søppel og miljø',
  '92': 'Kultur, fritid og sport',
  '98': 'Andre fellesskapstjenester',
}

// Tilnærmet mapping fra CPV-divisjon til NACE-seksjon (enkeltbokstav).
// Basert på EU-forordning 213/2008, vedlegg II.
// Merk: mapping er approksimativ på divisjonsnivå — én CPV-divisjon kan
// dekke aktiviteter i flere NACE-seksjoner.
export const CPV_TO_NACE_SECTION: Record<string, string> = {
  '03': 'A', // Jordbruk, skogbruk og fiske
  '09': 'B', // Bergverksdrift og utvinning
  '14': 'B',
  '15': 'C', // Industri (næringsmidler)
  '16': 'C',
  '18': 'C',
  '19': 'C',
  '22': 'C',
  '24': 'C',
  '30': 'C',
  '31': 'C',
  '32': 'C',
  '33': 'C',
  '34': 'C',
  '35': 'C',
  '37': 'C',
  '38': 'C',
  '39': 'C',
  '41': 'E', // Vann, avløp, renovasjon
  '42': 'C',
  '43': 'C',
  '44': 'C',
  '45': 'F', // Bygge- og anleggsvirksomhet
  '48': 'J', // Informasjon og kommunikasjon (IT)
  '50': 'G', // Handel, reparasjon
  '51': 'F',
  '55': 'I', // Overnattings- og serveringsvirksomhet
  '60': 'H', // Transport og lagring
  '63': 'H',
  '64': 'J',
  '65': 'E',
  '66': 'K', // Finansierings- og forsikringsvirksomhet
  '70': 'L', // Omsetning og drift av fast eiendom
  '71': 'M', // Faglig, vitenskapelig og teknisk virksomhet
  '72': 'M',
  '73': 'M',
  '75': 'O', // Offentlig administrasjon og forsvar
  '76': 'B',
  '77': 'A',
  '79': 'N', // Forretningsmessig tjenesteyting
  '80': 'P', // Undervisning
  '85': 'Q', // Helse- og sosialtjenester
  '90': 'E',
  '92': 'R', // Kultur, underholdning og fritid
  '98': 'S', // Annen tjenesteyting
}

// Norske kunngjøringstyper fra Doffin.
// Kilde: DFØ-terminologi og EU-direktiv 2014/24 (norsk offentlig anskaffelse).
// Bekreftet mot Nordland-data 2026-07-05: kun ANNOUNCEMENT_OF_COMPETITION og
// DYNAMIC_PURCHASING_SCHEME forekommer aktivt, men alle kjente typer er med.
export const NOTICE_TYPE_LABELS: Record<string, string> = {
  ANNOUNCEMENT_OF_COMPETITION:          'Anbudskonkurranse',
  DYNAMIC_PURCHASING_SCHEME:            'Dynamisk innkjøpsordning',
  AWARD_NOTICE:                         'Tildelingskunngjøring',
  PRIOR_INFORMATION_NOTICE:             'Veiledende kunngjøring',
  PRE_ANNOUNCEMENT:                     'Veiledende kunngjøring',
  CONTRACT_NOTICE:                      'Kontraktkunngjøring',
  INVITATION_TO_TENDER:                 'Anbudsinnbydelse',
  VOLUNTARY_PRIOR_INFORMATION_NOTICE:   'Frivillig forhåndsvarsel',
  TRANSPARENCY_NOTICE:                  'Transparenskunngjøring',
  QUALIFICATION_SYSTEM:                 'Kvalifikasjonssystem',
  DESIGN_CONTEST:                       'Designkonkurranse',
  CONCESSION_AWARD_NOTICE:              'Konsesjonstildeling',
  SOCIAL_AND_OTHER_SPECIFIC_SERVICES:   'Sosiale og særlige tjenester',
}

/** Returnerer divisjonsbeskrivelse for en 8-sifret CPV-kode. */
export function getCpvLabel(cpv: string | null | undefined): string | null {
  if (!cpv) return null
  const div = cpv.slice(0, 2)
  return CPV_DIVISIONS[div] ?? null
}

/** Returnerer norsk label for en Doffin-kunngjøringstype — aldri rå API-verdi. */
export function getNoticeTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Ukjent type'
  return NOTICE_TYPE_LABELS[type] ?? 'Annen kunngjøring'
}
