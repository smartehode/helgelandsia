# Bedriftskatalog — arkitektur

## Rutestruktur
```
/bedrifter                    – Hovedlisting (alle, med filter)
/bedrifter/[slug]             – Detaljside (slug = orgnr for BRREG, valgfri for member)
/bedrifter/[slug]/overta      – Placeholder for claim-flyt
/bedrifter/kategori/[id]      – Filtert listing per NACE-kategori (15 stk)
```

## Data-flyt

### Listing (/bedrifter og /bedrifter/kategori/[id])
- Server-komponent. Leser URL-parametere: `q`, `kategori`, `kommune`, `enk`, `side`.
- Bygger `payload.find`-where-klausul med `and: [...]`-betingelser.
- Default-filter: `_status='published'` + ekskluderer Enkeltpersonforetak (med ENK-toggle).
- Paginering: 24 per side, server-side via Payload (`page`-param).
- Kategoritelling: 15 parallelle `payload.count`-kall (Promise.all).
- `BedrifterFilters` er klient-komponent (useRouter/useSearchParams) for URL-oppdatering.

### Detaljside (/bedrifter/[slug])
- `getBusiness(slug)`: payload.find med depth:2.
- Underenheter: separat payload.find med `parentOrgnr = b.orgnr`, `overrideAccess: true`
  (underenheter er draft, men skal vises på moderselskapets side).
- "Ta over"-knapp: vises når `source='brreg'` og `claimed=false`.

## Kategori-mapping (NACE → bransje)
- Definisjoner i `src/lib/businesses/categories.ts`.
- `mapNaceToCategory(naceKode)`: splitter på '.', henter 2-siffer divisjonskode, slår opp i NACE_PREFIX_MAP.
- Feltet `naceCategory` (select, 15 verdier) lagres på Businesses-collectionen.
- Settes automatisk av `setCategoryFromNace`-hook i beforeChange.
- Settes også av BRREG-synken i `toBrregUpdateFields`.
- Skjemaendring: kjør `npx payload migrate:create nace-category` + les filen før commit.

## Publiserings-regler
Kun bedrifter som oppfyller ALLE:
- `_status = 'published'`
- `source = 'brreg'` med `brregStatus = 'aktiv'`
- `brregEntityType = 'hovedenhet'`
- `kommunenummer IS NOT NULL`

Underenheter forblir `draft` og vises kun på moderenhetens detaljside.
Enkeltpersonforetak er publisert men skjult i default-visning (ENK-toggle).

## Claim-flyt (fase 2c — ikke implementert)
1. Bruker logger inn som member på /min-side.
2. Går til /bedrifter/[slug]/overta.
3. Oppgir orgnr og sender dokumentasjon.
4. Admin godkjenner → `claimed=true`, `claimedBy=member.id`.
5. Bedriften viser "✓ Verifisert av eier"-merke.

## Fremtidige endringer
- Søk: nå `contains`-søk via Payload. For bedre fritekst: vurder `pg_trgm`-indeks og rå SQL.
- Kart (/fase 2b): Leaflet-kart med clustering på lat/lng.
- Monetisering (fase 2): Utvidet-profil med logo/bilder/SoMe-lenker som betalingsfunksjon.
