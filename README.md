# Helgeland-portalen — regional publiseringsplattform

En egenutviklet, moderne portal for Midt-Norge / Helgeland. Bygget for å
presentere lokale historier, næringsliv, kultur, opplevelser og arrangementer —
med et fullverdig adminpanel, men uten WordPress.

---

## 1. Teknologivalg og begrunnelse

| Lag | Valg | Hvorfor |
|-----|------|---------|
| Språk | **TypeScript** | Typesikkerhet ende-til-ende. Payload genererer typer fra innholdsmodellen, så frontend og backend deler samme typer automatisk. |
| Rammeverk | **Next.js (App Router)** | Server Components + ISR/SSG gir rask, SEO-vennlig server-rendering. Én kodebase for både nettsted og API. |
| CMS / admin | **Payload 3** | Kjører *inne i* Next.js (ikke en separat server). TypeScript-native, selvhostet, full kontroll på data. Ferdig adminpanel + auto-generert REST + GraphQL-API. |
| Database | **PostgreSQL** | Relasjonell, robust, perfekt for koblede data (artikler ↔ bedrifter ↔ arrangementer). Skalerer langt. |
| Design | **Tailwind CSS** | Raskt, konsistent, responsivt utgangspunkt. Ingen tung designarv. |
| Media | **S3 / Vercel Blob** (plugin) | Skalerbar bildelagring med automatiske størrelser. Lokalt i utvikling. |

### Hvorfor akkurat denne stacken (og ikke WordPress eller alternativer)

Stacken du foreslo er faktisk en av de **beste mulige** for dette formålet i 2026,
så jeg anbefaler den uten endringer. Det viktigste poenget: Payload 3 er nå
"Next.js-native" — CMS-et installeres rett inn i Next.js-appen, så du slipper å
drifte to systemer. Du eier all data selv (egen Postgres), og slipper
lisens-/abonnementslåsing.

Kort om alternativene jeg vurderte:

- **WordPress** — fravalgt bevisst. Tung arv, PHP, plugin-sårbarheter, vanskelig
  å forme til en skreddersydd portal og å typesikre.
- **Strapi / Directus** — gode headless-CMS, men kjører som *separat* server.
  Mer drift, og ikke like tett integrert med Next.js som Payload 3.
- **Sanity / Contentful** — utmerket DX, men dataene ligger hos en
  tredjepart (SaaS) og du betaler per bruk. Mindre dataeierskap.

**Ærlig avveining med Payload:** økosystemet er yngre enn WordPress/Strapi, så du
bygger litt mer selv og finner færre ferdige utvidelser. For en skreddersydd,
langsiktig portal der dataeierskap og typesikkerhet betyr mest, er det en god byttehandel.

---

## 2. Innholdsmodell (kjernen i portalen)

```
Users          – redaktører/forfattere med roller (admin/editor/author)
Media          – bilder med alt-tekst og auto-størrelser
Categories     – felles taksonomi (Kultur, Næringsliv, Opplevelser, Mat …)
Places         – steder/kommuner (Brønnøysund, Mosjøen, Mo i Rana …)
Posts          – artikler/historier (rik tekst, forfatter, relaterte bedrifter)
Businesses     – bedrifter (kontakt, kart, åpningstider, galleri)
Events         – arrangementer (dato, sted, arrangør, billettlenke)
Ads            – annonser (plassering, periode, statistikk)
Pages          – fleksible sider bygget av blokker (hero, tekst, lister, CTA)

Globals: SiteSettings, Header (meny), Footer
```

Alt er koblet sammen: en artikkel kan peke på bedrifter og arrangementer, et
arrangement kan ha en bedrift som arrangør, og alt kan filtreres på sted og kategori.

---

## 3. Prosjektstruktur

```
midt-norge-portal/
├─ payload.config.ts          # Samler hele CMS-et
├─ next.config.mjs
├─ tailwind.config.ts
├─ src/
│  ├─ access/                 # Tilgangsstyring (roller, publisert-filter)
│  ├─ fields/                 # Gjenbrukbare felt (slug …)
│  ├─ collections/            # Datamodellene
│  ├─ globals/                # Site-innstillinger, meny, footer
│  ├─ blocks/                 # Layout-blokker for fleksible sider
│  ├─ lib/                    # getPayload-hjelper m.m.
│  ├─ components/             # React-komponenter (frontend)
│  └─ app/
│     ├─ (payload)/           # Adminpanel (genereres av Payload)
│     └─ (frontend)/          # Selve nettstedet
│        ├─ historier/
│        ├─ bedrifter/
│        └─ arrangementer/
```

---

## 4. Kom i gang

```bash
# 1. Installer avhengigheter
npm install

# 2. Sett opp database og miljøvariabler
cp .env.example .env          # fyll inn DATABASE_URI og PAYLOAD_SECRET

# 3. Start Postgres (f.eks. via Docker)
docker run --name helgeland-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=helgeland -p 5432:5432 -d postgres:16

# 4. Kjør i utvikling
npm run dev

# Adminpanel:  http://localhost:3000/admin
# Nettsted:    http://localhost:3000
```

Første gang oppretter du admin-bruker i panelet. Payload lager databasetabellene
automatisk fra innholdsmodellen.

---

## 5. SEO, ytelse og sikkerhet (innebygd)

- **SEO**: `@payloadcms/plugin-seo` gir egne meta-felt per innhold; `generateMetadata`
  i Next.js setter title/description/OpenGraph. Sitemap og robots ligger klart.
- **Ytelse**: Server Components + ISR (revalidering), Next.js Image for bilder,
  Postgres-indekser på slug/dato.
- **Sikkerhet**: Rollebasert tilgangsstyring i Payload, `published`-filter slik at
  utkast aldri lekker, sikre cookies/JWT for innlogging, miljøvariabler for hemmeligheter.

---

## 6. Videre utvikling (naturlige neste steg)

- Søk (Postgres full-text eller plugin)
- Nyhetsbrev / skjema (`@payloadcms/plugin-form-builder`)
- Kart med klynger for bedrifter/arrangementer
- Flerspråk (`localization` i Payload)
- Annonsestatistikk-dashboard
