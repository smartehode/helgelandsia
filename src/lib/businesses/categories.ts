export interface BusinessCategory {
  id: string
  label: string
  icon: string
  nace: string[] // 2-sifrede NACE-divisjonskoder
}

export const BUSINESS_CATEGORIES: BusinessCategory[] = [
  { id: 'bygg',       label: 'Bygg & håndverk',            icon: '🏗️', nace: ['41','42','43'] },
  { id: 'handel',     label: 'Handel & butikk',            icon: '🛒', nace: ['45','46','47'] },
  { id: 'restaurant', label: 'Restaurant & overnatting',   icon: '🍽️', nace: ['55','56'] },
  { id: 'transport',  label: 'Transport & logistikk',      icon: '🚚', nace: ['49','50','51','52','53'] },
  { id: 'havbruk',    label: 'Havbruk & fiskeri',          icon: '🐟', nace: ['03'] },
  { id: 'landbruk',   label: 'Landbruk & primær',          icon: '🌾', nace: ['01','02'] },
  { id: 'industri',   label: 'Industri & produksjon',      icon: '🏭', nace: ['10','11','12','13','14','15','16','17','18','19','20','21','22','23','24','25','26','27','28','29','30','31','32','33'] },
  { id: 'tjenester',  label: 'Tjenester til næringsliv',   icon: '💼', nace: ['62','63','69','70','71','72','73','74','77','78','80','81','82'] },
  { id: 'helse',      label: 'Helse & omsorg',             icon: '🏥', nace: ['86','87','88'] },
  { id: 'utdanning',  label: 'Utdanning',                  icon: '🎓', nace: ['85'] },
  { id: 'kultur',     label: 'Kultur, fritid & reiseliv',  icon: '🎨', nace: ['79','90','91','92','93'] },
  { id: 'eiendom',    label: 'Eiendom & finans',           icon: '🏢', nace: ['64','65','66','68'] },
  { id: 'forening',   label: 'Foreninger & organisasjoner',icon: '🤝', nace: ['94'] },
  { id: 'energi',     label: 'Energi & teknisk',           icon: '⚡', nace: ['35','36','37','38','39','61'] },
  { id: 'annet',      label: 'Annet',                      icon: '📋', nace: [] },
]

// Oppslag: 2-sifret NACE-divisjon → kategori-id
const NACE_PREFIX_MAP = new Map<string, string>()
for (const cat of BUSINESS_CATEGORIES) {
  for (const prefix of cat.nace) {
    NACE_PREFIX_MAP.set(prefix, cat.id)
  }
}

// NACE-kode (f.eks. "03.210", "41.200") → kategori-id
export function mapNaceToCategory(naceKode: string | null | undefined): string {
  if (!naceKode) return 'annet'
  // Splitt på punktum for å hente divisjonen (f.eks. "03.210" → "03")
  const division = naceKode.split('.')[0].padStart(2, '0')
  return NACE_PREFIX_MAP.get(division) ?? 'annet'
}

export function getCategoryById(id: string): BusinessCategory | undefined {
  return BUSINESS_CATEGORIES.find(c => c.id === id)
}

export const CATEGORY_SELECT_OPTIONS = BUSINESS_CATEGORIES.map(c => ({
  label: `${c.icon} ${c.label}`,
  value: c.id,
}))

import type { Where } from 'payload'

// NULL-safe filter for showOnPublicListing — delt mellom publicListingWhere og
// manuelle baseConditions-arrays som ikke bruker publicListingWhere.
export const SHOW_ON_PUBLIC_LISTING_FILTER: Where = {
  or: [
    { showOnPublicListing: { equals: true } },
    { showOnPublicListing: { exists: false } },
  ],
}

// Felles base-filter for offentlig bedriftslisting:
// published + ikke Enkeltpersonforetak + showOnPublicListing (NULL-safe).
// Legg til ekstra betingelser via andExtra-parameteren.
export function publicListingWhere(...andExtra: Where[]): Where {
  return {
    and: [
      { _status: { equals: 'published' } },
      {
        or: [
          { organisasjonsform: { not_equals: 'Enkeltpersonforetak' } },
          { organisasjonsform: { exists: false } },
        ],
      },
      SHOW_ON_PUBLIC_LISTING_FILTER,
      ...andExtra,
    ],
  }
}
