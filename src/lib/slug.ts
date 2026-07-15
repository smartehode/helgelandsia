export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/æ/g, 'ae')
    .replace(/ø/g, 'o')
    .replace(/å/g, 'a')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Bygger full, kanonisk bedrifts-URL. Fallback til gammel slug-form
// for bedrifter uten orgnr (manuelle innsendinger uten BRREG-kobling).
export function bizUrl(b: { orgnr?: string | null; name: string; slug?: string | null }): string {
  if (b.orgnr) return `/bedrifter/${b.orgnr}/${nameToSlug(b.name)}`
  if (b.slug) return `/bedrifter/${b.slug}`
  return '/bedrifter'
}
