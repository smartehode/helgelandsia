/**
 * Énkildes sannhet for Helgeland-geografi.
 *
 * 18 kommuner. Aldri endre uten bevisst beslutning.
 * 1837 = Meløy (Salten) — IKKE Helgeland, aldri legg til.
 */

// Kommunenumre for BRREG-synk og numeriske API-filtre.
export const KOMMUNENUMRE = new Set([
  '1811', // Bindal
  '1812', // Sømna
  '1813', // Brønnøy
  '1815', // Vega
  '1816', // Vevelstad
  '1818', // Herøy
  '1820', // Alstahaug
  '1822', // Leirfjord
  '1824', // Vefsn
  '1825', // Grane
  '1826', // Hattfjelldal
  '1827', // Dønna
  '1828', // Nesna
  '1832', // Hemnes
  '1833', // Rana (Mo i Rana)
  '1834', // Lurøy
  '1835', // Træna
  '1836', // Rødøy
])

// Kommaseparert — brukes i BRREG-API og BrregWidget (?kommunenummer=...).
export const KOMMUNENUMRE_STR = [...KOMMUNENUMRE].join(',')

// Norske navn, lowercase — for case-insensitiv match (f.eks. Politiloggen).
export const KOMMUNENAVN_LC = new Set([
  'brønnøy', 'sømna', 'bindal', 'vevelstad',
  'herøy', 'alstahaug', 'dønna', 'leirfjord',
  'vefsn', 'grane', 'hattfjelldal',
  'hemnes', 'rana', 'nesna',
  'lurøy', 'rødøy', 'træna', 'vega',
])

// Uppercase — NAV Arbeidsplassen returnerer kommunenavn i majuskler.
export const KOMMUNENAVN_UC = new Set([...KOMMUNENAVN_LC].map(n => n.toUpperCase()))

// Senterkoordinater per kommunenavn (lowercase) — brukt som fallback ved geokoding.
export const KOMMUNESENTRE: Record<string, { lat: number; lng: number }> = {
  bindal:       { lat: 65.331, lng: 12.876 }, // Terråk
  sømna:        { lat: 65.579, lng: 12.396 }, // Vik i Helgeland
  brønnøy:      { lat: 65.474, lng: 12.213 }, // Brønnøysund
  vega:         { lat: 65.668, lng: 11.921 }, // Gladstad
  vevelstad:    { lat: 65.712, lng: 12.373 }, // Forvik
  herøy:        { lat: 65.962, lng: 12.208 }, // Herøy
  alstahaug:    { lat: 66.021, lng: 12.643 }, // Sandnessjøen
  leirfjord:    { lat: 66.063, lng: 12.872 }, // Leland
  vefsn:        { lat: 65.840, lng: 13.192 }, // Mosjøen
  grane:        { lat: 65.498, lng: 13.461 }, // Trofors
  hattfjelldal: { lat: 65.592, lng: 13.973 },
  dønna:        { lat: 66.114, lng: 12.494 }, // Solfjellsjøen
  nesna:        { lat: 66.200, lng: 13.029 },
  hemnes:       { lat: 66.222, lng: 13.648 }, // Korgen
  rana:         { lat: 66.313, lng: 14.143 }, // Mo i Rana
  lurøy:        { lat: 66.398, lng: 12.673 }, // Lurøy
  træna:        { lat: 66.494, lng: 12.081 },
  rødøy:        { lat: 66.688, lng: 13.716 }, // Tonnes
}

// Kommunenavn (lowercase) → kommunenummer — brukt av Kartverket stedsnavn-API.
export const KOMMUNENAVN_TIL_NUMMER: Record<string, string> = {
  bindal: '1811', sømna: '1812', brønnøy: '1813', vega: '1815',
  vevelstad: '1816', herøy: '1818', alstahaug: '1820', leirfjord: '1822',
  vefsn: '1824', grane: '1825', hattfjelldal: '1826', dønna: '1827',
  nesna: '1828', hemnes: '1832', rana: '1833', lurøy: '1834',
  træna: '1835', rødøy: '1836',
}
