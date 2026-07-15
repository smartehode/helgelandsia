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
