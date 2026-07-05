# Helgelandsia — regional portal for Helgeland

Nettsted: https://helgelandsia.no · Repo: smartehode/helgelandsia (privat)
Eieren er nybegynner — forklar tydelig, ett steg om gangen, på norsk.

## Formål
Dele og finne informasjon om Helgeland: arrangementer, historier/artikler,
bedrifter, stillinger, pressemeldinger, nyhetsbrev. Medlemmer (publikum)
sender inn innhold via skjemaer på /min-side; alt godkjennes av redaksjonen
i admin før publisering.

## Stack
- Next.js 15.4.11 (App Router) — PINNET, ikke oppgrader
  (Payload 3.85 peer-range utelukker 15.5.x)
- Payload CMS 3 (inne i Next.js), PostgreSQL, Tailwind CSS
- Design: «kald sjø, varm sol» — fjord/sea/fog/sun-palett i tailwind.config.ts,
  fonter Fraunces (serif) + Hanken Grotesk (sans)

## Arkitektur — viktige valg
- To brukergrupper: `users` (stab, admin) og `members` (publikum, ALDRI
  admin-tilgang — access.admin: () => false). Ikke bland dem.
- Innsending: route handlers under src/app/(frontend)/innsending/* bruker
  Local API (payload.create, draft: true, _status: 'draft', submittedBy).
  Godkjenning = Publiser i admin. Offentlige sider viser kun 'published'.
- Google-innlogging via payload-oauth2 (src/oauth/google.ts) mot members.
  Etter OAuth lander brukeren på /innlogget som videresender til /min-side
  (cookie-timing).
- Geocoding: Nominatim-hook i Businesses.ts (by/fylke/land → lat/lng ved
  lagring). Respekter bruksreglene: User-Agent + maks 1 kall/sek.
- TypeScript-byggfeil ignoreres i next.config.mjs (ignoreBuildErrors) — arv.

## UFRAVIKELIGE REGLER (lært på den harde måten)
1. `enabled: true` i src/oauth/google.ts skal ALDRI gjøres betinget av
   env-variabler. payload.config må gi IDENTISK databaseskjema lokalt og i
   prod — ellers genererer migrasjoner utilsiktede DROP-setninger.
   (Dette tok ned produksjonen 2026-06-11: en migrasjon laget lokalt uten
   Google-env droppet members.sub-kolonnen.)
2. Claude Code kjører ALDRI `migrate:create` og rører ALDRI src/migrations/.
   Eieren kjører migrasjoner selv i terminalen og leser dem før commit.
3. Hver ny migrasjon SKAL leses før commit: up() skal kun inneholde
   CREATE/ADD/ALTER på det nye — ALDRI DROP på eksisterende tabeller/kolonner.
   (DROP i down() er normalt.)
4. Skjemaendringer deployes ALDRI uten tilhørende migrasjon i samme commit.
5. .env committes ALDRI.
6. Én funksjon per runde. Deploy ofte og smått — aldri la flere funksjoner
   hope seg opp uncommittet.
7. Hver økt avsluttes med å oppdatere Logg-seksjonen nederst i denne filen.
8. MIGRASJONER SKAL VÆRE IDEMPOTENTE — ALLTID.
   ADD COLUMN IF NOT EXISTS, DROP TYPE IF EXISTS, CREATE INDEX IF NOT EXISTS.
   Gjelder også migrasjoner generert av `payload migrate:create` — de skal
   LESES og HERDES manuelt før commit. Brudd på dette tok prod ned 2026-07-04
   (restart-loop: «column already exists»).
9. SCHEMA-DRIFT: felt lagt til i config uten migrasjon = prod-krasj senere.
   Test: kjør `payload migrate:create` til den produserer TOM migrasjon.
   Husk at _businesses_v (version_-kolonner) alltid følger med hovedtabellen.
10. NaN-KLASSEN (4 forekomster nå: Members.ts, BRREG-synk, Users.ts,
    claim-flyt): ALL access/hook/handler-kode skal guarde mot manglende
    req.user / ugyldig ID FØR findOne/update. Number(undefined) = NaN =
    Postgres-feil. Jobs/synk kjører uten innlogget bruker.
11. ENTITETSVERDIER: 'hovedenhet' og 'underenhet' (norsk) er de eneste
    gyldige verdiene for brregEntityType. Aldri 'hoofdenhet'/'onderenhet'.
12. VASK/RE-IMPORT AV BUSINESSES nuller claims og eierskap. Var OK før
    berikelse fantes — fra nå av finnes eierdata, så full truncate er IKKE
    lenger tillatt uten eksplisitt beslutning.
13. PROD-SYNK kjøres via: `docker compose cp scripts app:/app/scripts &&
    docker compose exec app npx tsx scripts/brreg-sync.ts --full`
    (scripts/ er ikke med i prod-imaget; admin-knappen «Full nedlasting»
    er fortsatt død — egen sak.)
14. CADDY: Caddyfile-endringer krever `docker compose restart caddy`.
    `up -d --build` restarter IKKE caddy når imaget er uendret.
15. PAYLOAD-RUTER: API-endepunkter i Payload 3 lever som route-filer i
    src/app/(payload)/api/ — config-flagg (f.eks. graphQL disable) stopper
    dem IKKE. Skal et endepunkt bort, må route-filen fjernes.
16. CRON/JOBS: kommandoer i cron må bruke `docker compose exec -T` (ingen
    TTY) og inkludere cp av scripts/ siden mappa ikke er i prod-imaget.
17. BYGG ALDRI UTOVER BESTILLINGEN. Ubestilt kode i git status = stopp,
    rapportér, avklar før commit. E-postsending og andre utadrettede
    handlinger skal ALLTID bak env-brems (f.eks. FEATURE_ENABLED=true)
    i første runde — aldri aktiv som standard.
    (Hendelse 2026-07-05: tender-digest bygget uten bestilling; neste
    nattlige cron ville sendt e-post til medlemmer. Oppdaget via git status
    før commit. Fikset med TENDER_DIGEST_ENABLED-brems.)

## Drift — nødkommandoer

**Gjenopprette database fra dump:**
```bash
gunzip -c /root/backups/db-DATO.sql.gz | docker compose -f /root/helgelandsia/docker-compose.yml exec -T db psql -U postgres helgeland
```
Bytt ut `db-DATO.sql.gz` med faktisk filnavn (list med `ls /root/backups/`).
Etter gjenoppretting: `docker compose up -d --build` for å starte appen på nytt.

**Sjekke ferske logger i prod:**
```bash
docker compose logs --tail=50 app
```

## Arbeidsflyt
- All utvikling skjer LOKALT. ALDRI rediger filer på serveren.
- Lokal kjøring: Docker Desktop → `docker start helgelandsia-db` → `npm run dev`
- Skjemaendringer: test lokalt (dev-push oppdaterer lokal DB selv), deretter
  kjører EIEREN `npx payload migrate:create <navn>` i terminalen (interaktiv y),
  leser filen (regel 3), commit. Serveren migrerer automatisk ved oppstart.
- Deploy: git push lokalt; på serveren (ssh root@91.99.116.201):
  `cd ~/helgelandsia && git pull && docker compose up -d --build`
- PowerShell lokalt støtter ikke `&&` — bruk separate linjer eller `;`.
- Kjør `docker system prune -af` på serveren før store ombygginger (liten disk).
- Feilsøking i prod: `docker compose logs --tail=50 app` — les FERSK logg
  (sjekk tidsstempel) før konklusjoner trekkes.

## Veikart
1. BACKUP (HASTER, ikke gjort): Hetzner server-backups PÅ + nattlig pg_dump
   + plan for media-volumet. Databasen finnes i dag kun på én disk.
2. Spor 2 — deling: OG-metadata på alle detaljsider + ShareButtons
   (Facebook, LinkedIn, kopier lenke, e-post).
3. Spor 3 — moduler fra gammel portal (nasdag.no/portal/lg): strømpriser NO4,
   vær, avganger (Entur/Avinor), NAV-stillinger, BRREG, politilogg m.m.
   Eieren har kildekoden — be om den før bygging.
4. Senere: Facebook/Apple-innlogging, e-postverifisering + SMTP (medlemmer
   kan i dag registrere seg uten verifisering), re-opplasting av tapte
   mediebilder, ev. Hetzner Object Storage for media.

## Næringslivsstrategi

**Mål:** Bygge bedriftsdelen til en magnet for lokalt næringsliv som senere kan
monetiseres. Verdi før pris — bedrifter skal VILLE være der.

**Prinsipper:**
1. **Eksklusivitet via krav, ikke pris.** Bedriften må være registrert i BRREG og ha
   forretningsadresse i en Helgeland-kommune. BRREG-validering automatisk; manuell
   godkjenning ved tvil.
2. **Verifisert-merke** til bedrifter med gyldig orgnr i Helgeland.
3. **To profilnivåer:** Standard (åpen) og Utvidet (flere bilder/video/SoMe-lenker/
   kategorifremhevelse). Utvidet er gratis i fase 1, men krever redaksjonell
   godkjenning. Mønsteret er klart for prising i fase 2.
4. **Redaksjonelt utvalg:** "Månedens bedrift", "Anbefalt"-flagg i admin, kuraterte
   kategorisider.
5. **Ikke tillatt:** pop-up-annonser, trackere, sponsede oppføringer som later som de
   er redaksjonelle.
6. **Trafikk** drives av AI-assistent "Helge" (fase 3) som peker brukere til den lokale
   bedriftskatalogen + relaterte NAV-stillinger og BRREG-data vi allerede har.

**Fase 1 (nå):**
- /bedrifter som ekte katalog: filter (bransje + kommune), søk, kart, kategorisider.
- BRREG-validering på innsending (orgnr + Helgeland-kommune).
- Verifisert-merke.
- To profilnivåer (Utvidet krever redaksjonell godkjenning).
- "Anbefalt"-flagg + Månedens bedrift.

**Fase 2 (når det er trafikk og bedrifter):**
- Monetisering: Utvidet blir betalt, Premium-nivå med fremhevelse, annonseplass,
  sponsing av nyhetsbrev/seksjoner.

**Fase 3 (på sikt):**
- "Helge" — lokal AI-næringsassistent som svarer på spørsmål om Helgelands næringsliv
  og peker til bedrifter/stillinger/BRREG.

## Logg

### 2026-06-11
**Nye collections med medlemsinnsending**
- `src/collections/Jobs.ts` — Stillinger (slug: jobs): stillingstittel, arbeidsgiver,
  beskrivelse, stillingtype (select), søknadsfrist, arbeidssted, kontaktinfo,
  søknadslenke/-epost, submittedBy, slugField.
- `src/collections/PressReleases.ts` — Pressemeldinger (slug: press-releases):
  title, organization, excerpt (textarea), content (richText), image, kontaktinfo,
  submittedBy, slugField.
- `src/collections/Newsletters.ts` — Nyhetsbrev (slug: newsletters):
  title, organization, content (richText), image, submittedBy, slugField.
- Alle registrert i payload.config.ts.

**Bedriftsregistrering for medlemmer**
- `submittedBy`-felt lagt til i `Businesses.ts`.
- Geocoding via Nominatim (OpenStreetMap, ingen API-nøkkel): by/fylke/land-felt
  erstattet manuelle bredde-/lengdegrad-felt. Hook `geocodeHook` i Businesses.ts
  kaller Nominatim ved lagring og fyller inn lat/lng automatisk.
- OpenStreetMap-kart (iframe) vist på bedriftsdetaljsiden når koordinater finnes.

**Innsendingsskjemaer og ruter**
- `src/app/(frontend)/innsending/stilling/route.ts`
- `src/app/(frontend)/innsending/bedrift/route.ts`
- `src/app/(frontend)/innsending/pressemelding/route.ts`
- `src/app/(frontend)/innsending/nyhetsbrev/route.ts`
- Alle følger mønsteret: member-sjekk, draft: true, _status: 'draft', submittedBy,
  tekst → lexical, bildeopplasting (maks 8 MB).

**Skjemakomponenter**
- `src/components/JobForm.tsx`, `BusinessForm.tsx`, `PressReleaseForm.tsx`,
  `NewsletterForm.tsx` — alle følger EventForm/ArticleForm-mønsteret.
- `src/components/SubmissionTabs.tsx` oppdatert til 6 faner i 3×2-grid.

**Offentlige sider (kun _status: 'published')**
- `/stillinger` + `/stillinger/[slug]`
- `/pressemeldinger` + `/pressemeldinger/[slug]`
- `/nyhetsbrev` + `/nyhetsbrev/[slug]`
- `/bedrifter/[slug]` oppdatert med by/fylke og kart.

**Min side**
- Henter nå alle 6 innsendings-collections og viser dem i «Mine innsendinger»
  med kind-etikett.

**Navigasjon**
- `src/components/SiteHeader.tsx` — viser fallback-nav med alle sider hvis
  admin-header er tom.
- `src/components/MobileNav.tsx` — ny hamburgermeny for mobil (klient-komponent).
- `payload.config.ts` — `onInit`-hook seeder header-globalen med alle 7 lenker
  første gang, slik at de er synlige og redigerbare i admin → Meny (topp).

**Produksjonshavari og gjenoppretting (lærdom → regel 1–4)**
- Migrasjon generert lokalt med Google-plugin betinget av env droppet
  members.sub i prod (forside + Google-innlogging nede). Gjenopprettet med
  manuell ALTER TABLE + enabled: true + reglene over.

**Deling på sosiale medier**
- `src/lib/og.ts` — `abs()`-hjelper som bygger absolutt URL med fallback til
  `https://helgelandsia.no` (metadataBase er upålitelig uten NEXT_PUBLIC_SERVER_URL).
- `src/components/ShareButtons.tsx` — klient-komponent: Facebook, LinkedIn,
  kopier lenke og e-post. Bruker `usePathname()` for dynamisk URL.
- `generateMetadata` med `openGraph` (title, description, url, images) og
  `twitter`-felt lagt til alle 6 detaljsider (historier, arrangementer,
  bedrifter, stillinger, pressemeldinger, nyhetsbrev).

**Nyttig-siden og første widgets**
- `src/app/(frontend)/nyttig/page.tsx` — statisk side med strømpris og vær
  side om side (md:grid-cols-2), ISR via widget-cache (revalidate 1800s).
- `src/components/widgets/PowerPriceWidget.tsx` — første versjon (hardkodet NO4).
- `src/components/widgets/WeatherWidget.tsx` — første versjon (hardkodet 4 byer).
- `src/components/SiteHeader.tsx` — «Nyttig»-lenke lagt til FALLBACK_NAV.

**Widget-system (strømpris og vær)**
- `src/components/widgets/PowerPriceWidget.tsx` — async server-komponent.
  Props: `title?`, `zone?: NO1–NO5 (std NO4)`, `variant?: 'full'|'kompakt'`.
  full: nåpris + min/maks + søylediagram. kompakt: kun nåpris + min/maks.
  Henter hvakosterstrommen.no API, revalidate 1800s.
- `src/components/widgets/WeatherWidget.tsx` — async server-komponent.
  Props: `title?`, `locations?: {name,lat,lon}[]` (std 4 Helgeland-byer),
  `days?: 1–7 (std 4)`, `variant?: 'full'|'kompakt'`.
  full: nåvær + daglig varsel. kompakt: kun nåvær.
  Henter open-meteo.com API, revalidate 1800s.
- `src/blocks/index.ts` — `PowerPricesBlock` og `WeatherBlock` lagt til.
  Registrert i `layoutBlocks` (Pages-collection) og `widgetBlocks`
  (Sidefelt-global).
- `src/globals/Sidebar.ts` — ny global `sidefelt`, kun widget-blokker.
  Vises kompakt i sidefeltet på forsiden over annonsen.
- `src/components/RenderBlocks.tsx` — mapper blockType → komponent.
  Støtter alle layout-blokker + PowerPricesBlock + WeatherBlock.
  Tar valgfritt `forceVariant`-prop (forsiden bruker 'kompakt').
- **SKJEMAENDRING** — Eieren kjører `npx payload migrate:create widget-system`
  etter å ha testet lokalt og lest filen nøye (sjekk at ingen DROP).

**Widget-områder: tre soner**
- `src/globals/Sidebar.ts` — `WidgetAreas`-globalen (slug: `sidefelt`, label: «Widget-områder»)
  utvidet fra ett `blocks`-felt til tre: `sidefelt`, `midten`, `bunn`.
  Alle tre bruker `widgetBlocks` (PowerPrices + Weather).
- `src/app/(frontend)/page.tsx` — forsiden renderer alle tre soner:
  - `sidefelt` → høyrespalte, kompakt, sticky.
  - `midten` → mellom «Fremhevede historier» og annonsen, `md:grid-cols-2`, full variant.
  - `bunn` → under all innhold, `md:grid-cols-3`, kompakt variant.
  Sonene vises kun når de har innhold (betingede render).
- **SKJEMAENDRING** — dekkes av samme migrasjon: `npx payload migrate:create widget-system`.

**Flyavganger og NAV-stillinger widgets**
- `src/components/widgets/FlightsWidget.tsx` — async server-komponent.
  Props: `title?`, `airports?: ('BNN'|'SSJ'|'MJF')[]` (std alle tre),
  `direction?: 'departure'|'arrival'|'begge'` (std departure),
  `count?: 1–10` (std 4 per flyplass), `variant?`.
  Henter Avinor XML-feed, revalidate 300s. Promise.allSettled per flyplass —
  viser «Ikke tilgjengelig» for flyplasser som feiler.
- `src/components/widgets/NavJobsWidget.tsx` — async server-komponent.
  Props: `title?`, `count?: 1–20` (std 6), `variant?`.
  Henter NAV Arbeidsplassen (county=NORDLAND), filtrerer på 19 Helgeland-
  kommunenavn. Lenker til arbeidsplassen.nav.no og /stillinger.
  revalidate 1800s.
- `src/blocks/index.ts` — `FlightsBlock` og `NavJobsBlock` lagt til i
  `layoutBlocks` og `widgetBlocks`.
- `src/components/RenderBlocks.tsx` — håndterer 'flights' og 'navJobs'.
- `src/app/(frontend)/nyttig/page.tsx` — alle fire widgets i 2-kolonners
  grid, full variant.
- **SKJEMAENDRING** — eieren kjører `npx payload migrate:create <navn>`.

### 2026-06-13
**Feilretting: FlightsWidget og NavJobsWidget**

**FlightsWidget** — byttet fra ødelagt REST-API til Avinors offisielle XML-feed:
- Ny URL: `asrv.avinor.no/XmlFeed/v1.0?airport={IATA}&TimeFrom={t}&TimeTo={t}&direction={D|A}`
  (`TimeFrom` = timer tilbake, `TimeTo` = timer fremover — begge positive tall).
- XML-struktur: `<flight><flight_id>`, `<schedule_time>` (UTC ISO), `<airport>` (IATA),
  `<status code="N" time="..."/>` (self-closing med attributter, ikke child-elementer).
- Parser: regex-basert, bruker `extractText()` for child-elementer og `extractAttr()` for
  attributter på self-closing tags.
- Tidssone: `Intl.DateTimeFormat` med `timeZone: 'Europe/Oslo'` — konverterer UTC riktig
  uavhengig av serverens lokale tidssone.
- Avganger: `TimeFrom=6&TimeTo=24` (inkluderer fly fra siste 6 t så dagens avganger
  vises selv etter at de er gått).
- Ankomster: `TimeFrom=6&TimeTo=6`.
- «Neste avgang»: første fremtidige fly; fallback til siste avgang i dag.
- «Siste ankomst»: nyeste fly med `status code="A"`; fallback til siste i listen.
- Diagnostikkrute `src/app/api/debug-avinor/route.ts` ble opprettet under feilsøking
  (kan slettes når alt fungerer stabilt).

**NavJobsWidget** — feilene lå i feil API-respons-parsing og feil filterfelt:
- Responsen er `{ hits: { hits: [{ _source: NavJob }] } }` — ikke `content`.
- Kommunefilter byttet fra numeriske koder (`municipalCode`) til kommunenavn-strenger
  (`locationList[].municipal`, f.eks. `"BRØNNØY"`) — `municipalCode` finnes ikke i svaret.
- Helgeland-settet oppdatert til 19 kommuner (navn som store bokstaver).
- Søknadsfrist hentet fra `properties.applicationdue`, ikke `applicationDue`.
- `businessName` lagt til som fallback for `employer.name`.
- `size` økt fra 30 til 50 for å fange opp flere Helgeland-stillinger.

**Nye widgets: NewsWidget og BrregWidget**
- `src/components/widgets/NewsWidget.tsx` — RSS-nyheter fra BAnett, Helgelendingen,
  Helgelands Blad og NRK Nordland. Regex-parser med CDATA/HTML-entity-støtte.
  Karusell (topp 5) via klientkomponent `NewsCarousel.tsx`. Full variant viser
  karusell + rader; kompakt variant viser maks 5 saker uten bilder.
  Forsøker å hente `og:image` fra artikkelsiden for karusellsaker uten RSS-bilde
  (2 s timeout, cachet 1 t). Fargede kildepiller per kilde.
- `src/components/widgets/NewsCarousel.tsx` — klientkomponent med `useState`/
  `useEffect`. Auto-rotasjon hvert 6. sek, pause på hover, opacity-fade (220 ms),
  klikkbare prikk-indikatorer. Saker uten bilde: gradient fra-fjord-til-sea med
  sentrert serif-tittel. Saker med bilde: bilde som bakgrunn, mørk gradient nederst.
- `src/components/widgets/BrregWidget.tsx` — nyregistrerte bedrifter på Helgeland
  fra BRREG enhetsregisteret API. Filtrerer på 18 Helgeland-kommunenummer,
  sortert nyeste first. Lenker til virksomhet.brreg.no. revalidate: 21600.
- `src/blocks/index.ts` — `NewsBlock` og `BrregBlock` lagt til i `layoutBlocks`
  og `widgetBlocks`.
- `src/components/RenderBlocks.tsx` — håndterer `'news'` og `'brreg'`.
- `src/app/(frontend)/nyttig/page.tsx` — alle seks widgets.
- **SKJEMAENDRING** — dekkes av `20260612_235331_news_brreg_blocks`.

**Visuell oppgradering: FlightsWidget**
- Kompakt variant redesignet: inline SVG-flyikon (Material Design "flight"-sti,
  -45° for avgang ↗, 135° for ankomst ↙) i `text-sea`, ingen etiketter.
  Format: ikon · tid · «fra»/destinasjon.
- Full variant: opptil 4 avganger + 4 ankomster per flyplass med flightnummer.
- `FlightRow`-komponent: status C (Innstilt) vises rødt med stryking; status E
  (ny tid) viser gammel tid strøket over + ny tid i amber.
- Krediteringen «Flydata fra Avinor» er lenke til avinor.no (krav fra Avinor).

**E-post for medlemmer (Resend) — ferdig deployet**
- `src/lib/email/templates.ts` — HTML-maler med fjord/sea/paper-palett.
  Eksporterer `verifyEmailHtml(token)`, `forgotPasswordHtml(token)`,
  `submissionApprovedHtml({ name, contentType, title, url })`.
- `src/lib/email/submission-approved.ts` — `afterChangeApproved(collection)` returnerer
  en `afterChange`-hook som sender godkjenningsvarsel til `submittedBy`-member ved
  overgang `draft → published`. Alle 6 innsendings-collections har fått denne hooken.
- `payload.config.ts` — `resendAdapter` alltid registrert (ikke betinget av env).
  `parseEmailFrom()` parser `"Navn <adresse@dom.no>"`; faller tilbake til Resend
  sandbox-adresse hvis `EMAIL_FROM` mangler. `onInit` logger avsenderadressen ved oppstart.
- `src/collections/Members.ts` — `auth: true` erstattet med fullt auth-objekt:
  - `verify` — norsk velkomstmail, lenker til `/verifiser?token=`.
  - `forgotPassword` — norsk tilbakestillingsmail, lenker til `/nytt-passord?token=`.
  - `beforeChange`-hook: Google OAuth-brukere (har `sub`) settes `_verified: true` automatisk.
- `src/app/(frontend)/verifiser/page.tsx` — leser `?token`, kaller
  `payload.verifyEmail({ collection: 'members', token })`, viser suksess eller feil.
- `src/app/(frontend)/nytt-passord/page.tsx` + `NyttPassordClient.tsx`:
  - Uten token: e-postskjema → POST `/api/members/forgot-password`.
  - Med token: nytt passord-skjema → POST `/api/members/reset-password`.
- `src/components/AuthForm.tsx`:
  - «Glemt passord?»-lenke i innloggings-modus.
  - Etter vellykket registrering vises grønt panel «Konto opprettet — sjekk innboksen
    din» i stedet for auto-innlogging (som feiler med 403 når verify er på).
  - 403 fra login → amber-panel «E-posten er ikke bekreftet» med adressen synlig.
  - 4xx på registrering → serverens `errors[0].message` vises direkte.
- **Migrasjon** — `auth.verify` la til `_verified`/`_verificationToken` på members.
  Kjørt: `npx payload migrate:create verify-members`. Lest og verifisert (ingen DROP).
- **Deploy-steg utført** — eksisterende prod-medlemmer ble satt til verifisert via SQL
  etter at migrasjonen kjørte på serveren:
  ```sql
  UPDATE members SET "_verified" = true WHERE "_verified" IS NULL OR "_verified" = false;
  ```

**Tre nye widgets: Webkamera, Valuta og Helligdager**
- `src/components/widgets/WebcamWidget.tsx` — server-komponent (ikke async, ingen fetch).
  Props: `title?`, `cameras?: {url,title,source}[]` (std 5 Helgeland-kameraer),
  `variant?`. Cache-buster: `Date.now()` i `?t=`-parameter sikrer ferske bilder ved
  hver server-render. Full: `md:grid-cols-2 lg:grid-cols-3`. Kompakt: ett bilde om
  gangen via klient-wrapper.
- `src/components/widgets/WebcamCarousel.tsx` — klient-komponent. Roterer mellom
  kameraer hvert 30. sek med `setInterval`. `onError` viser «Bildet er ikke
  tilgjengelig». Prikkindikator med manuell navigasjon.
- `src/components/widgets/CurrencyWidget.tsx` — async server-komponent.
  Props: `title?`, `show?: ('usd'|'eur'|'btc'|'brent')[]` (std alle fire), `variant?`.
  Kilder: Frankfurter API (USD/NOK, EUR/NOK inkl. forrige virkedag for endring),
  Coinbase (BTC/USD, pris uten endring), Stooq CSV (Brent, pris uten endring).
  Promise.allSettled — én feilet kilde tar ikke ned resten. revalidate: 1800.
  Full: pris + fargekodet endring (grønn/rød). Kompakt: kun pris.
- `src/components/widgets/HolidaysWidget.tsx` — async server-komponent.
  Props: `title?`, `count?: 1–20` (std 5), `variant?`.
  Henter inneværende og neste år fra `date.nager.at/api/v3/PublicHolidays/{år}/NO`,
  filtrerer på >= i dag, sorterer, tar første N. `format`/`differenceInCalendarDays`
  fra `date-fns` v3 med `nb`-locale. Helligdager < 7 dager unna vises i `text-sea`.
  Kreditering: lenke til date.nager.at. revalidate: 86400.
- `src/blocks/index.ts` — `WebcamBlock` (slug: `webcam`), `CurrencyBlock` (slug:
  `currency`), `HolidaysBlock` (slug: `holidays`) lagt til i `layoutBlocks` og
  `widgetBlocks`. Kamera-array bruker `camTitle` (ikke `title`) for å unngå
  navnekonflikt.
- `src/components/RenderBlocks.tsx` — håndterer `'webcam'`, `'currency'`, `'holidays'`.
  `camTitle`-feltet mappes til `title`-prop med fallback.
- `src/app/(frontend)/nyttig/page.tsx` — alle tre widgets lagt til i 2-kolonnersgriden.
- **SKJEMAENDRING** — tre nye blokk-tabeller (webcam, currency, holidays) i PostgreSQL.
  Eieren kjører `npx payload migrate:create webcam-currency-holidays` og leser filen
  (sjekk at ingen DROP) før commit.

**WebcamWidget → WebcamWeatherWidget (skjemaendring i webcam-blokk)**
- `src/components/widgets/WebcamWeatherWidget.tsx` — ikke-async server-komponent.
  Tre standard-lokasjoner: Brønnøysund (5 kameraer), Sandnessjøen (3), Mosjøen (1).
  Props: `title?`, `locations?: Location[]`, `variant?`.
- `src/components/widgets/WebcamWeatherClient.tsx` — klient-komponent ('use client').
  - Stedsvelger som piller (sun-farge aktiv, fog-farge inaktive).
  - Stort bilde (aspect-video) med ‹/›-piler. Auto-rotasjon hvert 10. sek.
    Pause ved hover (useRef `isHovered`) og skjult fane (visibilitychange-lytter).
    Cache-buster: `?t=<ts>` oppdateres kun ved navigasjon/rotasjon — aldri ved re-render.
  - Mørkt blått infofelt (bg-fjord/90) med "HELGELANDKAMERA"-etikett, tittel i
    font-serif, kildenavn og X/N-posisjon. onError viser plassholder-tekst.
  - Vær-kort (Open-Meteo) under bildet: temperatur, emoji og norsk beskrivelse.
    30 min klient-side cache (useRef). Hentes på nytt ved lokasjonsskift.
  - Klikkbar kameraliste under (skjules i kompakt variant).
- `WebcamWidget.tsx` og `WebcamCarousel.tsx` slettet.
- `src/blocks/index.ts` — WebcamBlock omstrukturert: `cameras`-array erstattet
  av `locations`-array (name, lat, lng + nested cameras). Label: «Webkamera og vær».
  Slug 'webcam' uendret. **SKJEMAENDRING** — eieren kjører
  `npx payload migrate:create webcam-locations` og leser filen (ingen DROP) før commit.

**HolidaysWidget → CalendarWidget (ingen skjemaendring)**
- `src/components/widgets/CalendarWidget.tsx` — async server-komponent. Prefetcher
  helligdager for inneværende og neste år fra date.nager.at og sender som
  `preloadedHolidays: HolidayMap` til CalendarClient. revalidate: 86400.
- `src/components/widgets/CalendarClient.tsx` — klient-komponent ('use client').
  Måneds-navigasjon med ‹/›-knapper og `useState`. Kalender-grid: ISO-ukenummer
  (date-fns `getISOWeek`), Man–Søn med `startOfWeek({weekStartsOn:1})`. Uthevinger:
  i dag (sea-bakgrunn), helligdager (bg-red-50 text-red-700), dager utenfor måneden
  (muted/30). Helligdagsliste under: `D.M. Navn`-format, maks 3 i kompakt variant.
  Manglende år hentes klient-side med `fetch + cache:'force-cache'` via `useEffect`
  (sporet av `useRef`-sett for å unngå dobbel-henting).
- `HolidaysWidget.tsx` slettet — erstattet av CalendarWidget.
- `src/blocks/index.ts` — HolidaysBlock label endret til 'Kalender'. Slug 'holidays'
  uendret — eksisterende admin-plasseringer overlever, ingen migrasjon nødvendig.

**BRREG-importmotor — fase 1**
- Ny synk-jobb (`scripts/brreg-sync.ts`) som henter Helgelandsbedrifter
  fra data.brreg.no, både hovedenheter og underenheter.
- Pass 1: alle hovedenheter → bygg orgnr-sett. Pass 2: underenheter, behold
  KUN de med `parent_orgnr` i Helgeland-orgnr-settet (utenbys filialer av
  Helgeland-bedrifter beholdes — det er reell data om filialer).
- Manuell trigger via `/api/admin/brreg-sync` (admin) eller
  `scripts/brreg-sync.ts`. Flagg: `--full`, `--incremental YYYY-MM-DD`,
  `--kommune NNNN` (importerer én enkelt kommune).
- Synkhistorikk i `brreg-sync-jobs`. Full synk med 0 treff loggføres som
  `failed`, ikke `success` — stille 0/0/0 er alltid en feil.
- Sletter rader med HTTP 410 Gone; markerer konkurs/avvikling/sletting.
- `src/lib/brreg/types.ts` — `BrregEnhet`, `BrregUnderenhet`,
  `BrregOppdatering`, `BrregStatus`, `BrregEntityType`, `SyncResult`.
- `src/lib/brreg/sync.ts` — `runFullSync`, `runIncrementalSync`,
  `syncKommune`. Beriker aldri name/slug/description/logo ved oppdatering —
  kun BRREG-autoritative felt.
- `src/collections/BRREGSyncJobs.ts` — ny collection (slug: `brreg-sync-jobs`).
- `src/app/api/admin/brreg-sync/route.ts` — POST-rute, kun admin.
- **SKJEMAENDRING** — eieren kjører `npx payload migrate:create brreg-import`
  og leser filen (ingen DROP) før commit.

**Businesses-collection utvidet**
- Nye felt: `orgnr` (unique), `source`, `claimed`/`claimedBy`/`claimedAt`,
  `brregLastSynced`, `brregStatus`, `brregEntityType`, `parentOrgnr`,
  `naceKode`/`naceBeskrivelse`, `organisasjonsform`, `kommunenummer`/`kommunenavn`,
  `registreringsdato`, `avregistreringsdato`, `antallAnsatte`.
- BRREG-felter er `readOnly` i admin (oppdateres kun av sync-jobben).

**Helgeland-geografi — 19 kommunenumre**
- 1811, 1812, 1813, 1815, 1816, 1818, 1820, 1822, 1824, 1825, 1826, 1827,
  1828, 1832, 1833, 1834, 1835, 1836, 5046.
- **VIKTIG:** 1833 = Rana (Helgelands største by). 1837 = Meløy (Salten,
  IKKE Helgeland) — skal ALDRI være i listen.
- 5046 = Bindal (nytt kommunenummer etter kommunereform).

**Etter første synk og opprydding**
- 1 943 Meløy-poster (kommunenummer 1837) slettet manuelt.
- 592 foreldreløse underenheter slettet (53 var allerede dekket av Meløy-slettingen).
- Sluttresultat: 24 849 bedrifter (Rana 6 617, Vefsn 3 662, Brønnøy 2 561 …).
- 378 enheter uten forretningsadresse (NUF/sameier/foreninger) — beholdes i DB,
  skjules som default på /bedrifter via `organisasjonsform`-filter.
- Alle er `_status: 'draft'` — synlige kun i admin til fase 2.

**Gjenstår i fase 2**
- Skille hovedenhet/underenhet i visning (samme navn kan forvirre).
- «Anbefalt»-flagg og Månedens bedrift (redaksjonell kurasjon).
- Kart-visning på /bedrifter.

### 2026-06-13 (fortsettelse) — Fase 2: Bedriftskatalog frontend

**Datamodell låst — Modell A-felt på Businesses**
- `naceCategory` (select, indeksert, auto fra NACE-kode via `setCategoryFromNace`-hook).
- `owner` (relationship → members), `claimStatus` (select: unclaimed/pending/verified).
- `social.linkedin`, `social.tiktok`, `social.youtube` (text).
- `video` (text, URL til YouTube/Vimeo).
- Migrasjon `20260613_170043_business_model_a` kjørt og verifisert (kun ADD COLUMN,
  ingen DROP).

**Felles filterfunksjon `publicListingWhere`**
- `src/lib/businesses/categories.ts` — `publicListingWhere(...andExtra: Where[]): Where`
  gir base-filter: `_status='published'` + ENK-eksklusjon (NULL-safe or+exists:false).
  Brukes overalt der bedrifter listes — ingen duplisering av filterlogikk.

**`/bedrifter` — hovedside**
- Ingen standardlisting. Viser kun fremhevede bedrifter ved tomt søk.
- Ved aktive filtre (q, kategori, kommune, enk): viser søkeresultater sortert
  `-featured,name` (fremhevede øverst).
- Kategori-grid med 15 bransjer + tellesum (bruker `publicListingWhere`).

**`/bedrifter/kategori/[id]` — kategorisider**
- «Anbefalte»-seksjon øverst: parallell query `featured=true` i samme kategori,
  maks 6 kort, 3-kolonnersgrид. Skjules ved aktive søk/kommunefiltre.
- Hoveddlisting: sortert `-featured,name` (fremhevede fortsatt øverst i listen).
- `BizCard`-komponent (intern funksjon) delt mellom begge seksjoner.
- `hasLocalFilters = !!(q || kommune)` styrer synlighet av Anbefalt-seksjonen.

**`/bedrifter/[slug]` — bedriftsdetaljside**
- BRREG-fakta, galleri, underenheter (avdelinger), kart (OpenStreetMap iframe).
- «Ta over oppføringen»-knapp synlig for ALLE besøkende når `claimStatus='unclaimed'`.
- `featured`-merke vist i tittelseksjonen.

**`/bedrifter/[slug]/overta` — kravflyt**
- Server Action `submitClaim` (closure over slug, re-fetcher for race-condition-sikring).
- Tilstander: ikke innlogget → innloggingslenke; ukrevd+innlogget → skjema;
  sendt → suksessmelding; pending/verified → statusmelding.
- Setter `owner = member.id`, `claimStatus = 'pending'` via Local API
  (`overrideAccess: true`). Ingen e-postverifisering i fase 1.

**Admin-UI forbedringer**
- `defaultColumns`: name, brregEntityType, claimStatus, kommunenavn, featured, _status.
- `baseListFilter`: viser kun `brregEntityType = 'hovedenhet'` som standard.
  Underenheter nås via moderenhetens Avdelinger-liste eller direkte URL.
- `FeaturedCell` (`src/components/admin/FeaturedCell.tsx`): viser «Ja»/«Nei»
  istedenfor sant/falsk.

**«Anbefalt»-merke på kort**
- `★ Anbefalt`-badge (sun-bakgrunn, fjord-tekst) på alle BusinessCard/BizCard
  der `b.featured = true`. Vises på kategorisider, søkeresultater og detaljside.

**`naceCategory`-backfill**
- 24 599 rader oppdatert via SQL CASE WHEN (SPLIT_PART(nace_kode,'.', 1) → kategori-id)
  etter at kolonnen ble lagt til med push:true men forble tom.

**Revisjonsskript**
- `scripts/audit-businesses.ts` — read-only, ingen skriving. Rapporterer via
  rå SQL: kolonner, totaltall, duplikater, enhetstyper, BRREG-status, Payload-status,
  kilder, berikingsstatus, kategorier, topp 20 kommuner.

### 2026-06-14

**Bedriftsliste-forbedringer (frontend, ingen skjemaendring)**
- Fremhevet-sortering: to parallelle spørringer (featured=true + NOT_FEATURED) kombinert
  i JS — Payload 3 støtter ikke kommaseparert flerfelt-sortering i `sort`-parameteren.
- ENK i søk: `buildSearchWhere` inkluderer ENK automatisk når `hasSearchQuery = !!q`.
  Browsing uten søk skjuler ENK som før; ENK-toggle er kun modifikator, ikke trigger.
- `hasFilters` på /bedrifter ekskluderer `showEnk` — ENK-avhukingen alene viser ingen liste.
- BildeplasspHolder fjernet: kortene viser bildeblokkken KUN når logo finnes.
  Featured-badge flyttes til tekstblokkken når logo mangler.
- Live-søk i `BedrifterFilters.tsx`: debounce 300 ms, `router.replace`, ≥2 tegn trigger,
  `useRef(searchParams)` unngår foreldede closures i debounce-timeouten.

**Businesses-collection utvidet — 11 nye BRREG-felter**
Lagt til i BRREG-data-fanen (alle readOnly, nullable):
- `sekundaerNaceKode` + `sekundaerNaceBeskrivelse` (sekundær næringskode/-beskrivelse)
- `organisasjonsformBeskrivelse` (klartekst, f.eks. «Aksjeselskap») — ved siden av
  eksisterende `organisasjonsform` (lagrer også beskrivelse; ENK-filteret avhenger av det)
- `stiftelsesdato` (date) — stiftelse vs. `registreringsdato` (registrering) er to ulike datoer
- `brregHjemmeside` (text) — BRREG-nettside, skilt fra berikelse-feltet `website`
- `aktivitet` (textarea) — BRREGs fritekstbeskrivelse av virksomheten
- `forretningsadresse` (group): gate, postnummer, poststed
- `postadresse` (group): gate, postnummer, poststed
- `registrertIMvaregisteret`, `registrertIForetaksregisteret`,
  `registrertIFrivillighetsregisteret` (checkbox, default false)
Ikke lagt til (fantes fra før): `naceBeskrivelse`, `registreringsdato`, `organisasjonsform`.
`phone`/`email` i Kontakt-fanen er berikelse-felt, ikke BRREG-felt.
Migrasjon: `npx payload migrate:create add_brreg_extra_fields` — kjørt og lest av eier.

**BRREG-synk oppdatert — fyller alle nye felt**
- `src/lib/brreg/types.ts` — `BrregEnhet` utvidet med: `naeringskode2`, `postadresse`,
  `aktivitet`, `stiftelsesdato`, `hjemmeside`, `registrertIMvaregisteret`,
  `registrertIForetaksregisteret`, `registrertIFrivillighetsregisteret`.
  `BrregUnderenhet` utvidet med: `naeringskode2`, `postadresse`.
- `src/lib/brreg/sync.ts` — `toBrregUpdateFields()` populerer nå alle 11 nye felt:
  - `sekundaerNaceKode`/`sekundaerNaceBeskrivelse` fra `enhet.naeringskode2`
  - `organisasjonsformBeskrivelse` = samme som `organisasjonsform` (beskrivelse, f.eks.
    «Aksjeselskap»). Begge felter lagrer beskrivelse — ENK-filteret i
    `publicListingWhere` avhenger av klartekst-verdien «Enkeltpersonforetak».
  - `stiftelsesdato` og `brregHjemmeside` — kun fra `BrregEnhet` (hoved), null for under.
  - `aktivitet`: `string[]` joints med `'; '`, null hvis tom/manglende.
  - `forretningsadresse.{gate,postnummer,poststed}` — `addr.adresse[]` joins med `', '`.
  - `postadresse.{gate,postnummer,poststed}` — separat for begge enhetstyper.
  - `registrertIMvaregisteret`/`registrertIForetaksregisteret`/`registrertIFrivillighetsregisteret`
    — kun fra `BrregEnhet`, `false` for underenheter (ikke relevant).
  - Eksplisitt hviteliste i koden: alle berikelsesfelt er listet som utelatt.
- `src/collections/Businesses.ts` — etiketten «Organisasjonsform (kode)» rettet til
  «Organisasjonsform» (feltet lagrer beskrivelse, ikke kode).
- Ingen skjemaendring, ingen migrasjon — kun synk-logikk og typeendringer.

**Modell A — to soner (arkitektur)**
- Businesses-poster er delt i to soner:
  - **BRREG-sone** (synk-eid): alt i BRREG-data-fanen. Synken har eksplisitt hviteliste
    i `toBrregUpdateFields()` og rører aldri berikelse-felt.
  - **Berikelse-sone** (members-eid): Profil-fanen (description, logo, gallery, tagline),
    Kontakt-fanen (phone, email, website, address, openingHours, social.*), video.
    Fylles ut av bedriftseieren etter godkjent krav.
- Migrasjoner kjørt i Fase 2: `business_model_a` (2026-06-13), `add_brreg_extra_fields`.
- Roller (daglig leder/styre): bevisst utelatt — GDPR § 22 og norsk personopplysningslov
  krever eget rettslig grunnlag for gjenbruk av personers roller på tredjeparts nettsted.
  BRREG-data er offentlig, men gjenbruk av enkeltpersoners tilknytning er noe annet.
- `orgnr` bekreftet unik i databasen: 0 duplikater blant 24 849 rader.

**Fix: NaN-feil i BRREG-synken**
- Rot: synken kjører uten innlogget bruker (`req.user = undefined`). Members-collection
  sin `read`/`update`-access returnerte `{ id: { equals: user?.id } }` →
  `{ id: { equals: undefined } }` → Postgres fikk NaN der det ventet heltall.
- Fix 1 — `src/collections/Members.ts`: guard øverst i `read`/`update` access:
  `if (!user) return false` (ingen bruker = ingen tilgang, NaN sendes aldri videre).
- Fix 2 — `src/lib/brreg/sync.ts`: `depth: 0` på alle `payload.find`-kall i synken.
  Synken trenger aldri relasjondata; `depth: 0` hindrer Payload fra å hente
  `owner`/`submittedBy`-relasjoner og utløse Members-access-koden.

**Fix: GraphQL-typenavn-kollisjon «Hero»**
- `Hero`-globalen og `HeroBlock`-blokken (begge `slug: 'hero'`) genererte samme
  GraphQL-typenavn → «Schema must contain uniquely named types but contains multiple
  types named 'Hero'».
- Fix: `interfaceName: 'HeroBlock'` lagt til i `src/blocks/index.ts` — endrer kun
  GraphQL/TS-typenavnet, ikke databasetabellen. Ingen migrasjon nødvendig.

**REGEL: jobber og synk er userless**
All access-funksjon- og hook-kode MÅ tåle `req.user = undefined` uten å produsere
NaN eller kaste ukontrollerte feil. Mønster: `if (!user) return false` (access) eller
tidlig `return` (hook). Sjekk alltid `user?.id` aldri `user.id` direkte — og send
ALDRI `undefined` videre til en databasespørring.

### 2026-07-04/05 — BRREG-synk selvgående, claim/redigering komplett, sikkerhet

Fullført 2026-07-04:
- Enhetstype: enum → text (migrasjon 20260704_005223). Årsak: enum tålte ikke
  alle verdier, og synk-koden hadde skrivefeil «hoofdenhet»/«onderenhet».
  Alle verdier standardisert til NORSK: 'hovedenhet' / 'underenhet'.
  Migrasjonen normaliserer evt. avvikende DB-verdier.
- Full BRREG-synk kjører rent: 0 feil lokalt og i prod. Synken setter nå
  showOnPublicListing selv (dedup: underenhet i samme kommune som sin
  hovedenhet → false, ellers true).
- Claim-flyt komplett i prod: claim → pending → admin setter verified →
  bedrift på Min side → eier redigerer berikelse-felter → synlig offentlig.
- Redigeringsside /min-side/bedrift/[slug]/rediger: kun berikelse-felter
  (eier-sonen), BRREG-felter read-only. Tilgangskontroll på server
  (owner + verified), lagring endrer ikke _status.
- NaN-guard lagt inn i Users.ts (read/update): if (!user) return false.
- Root-LVM utvidet 18G → 36G (lvextend -r -l +100%FREE). «No space left»
  ved deploy var rotårsaken, ikke image-oppsamling alene.

Sikkerhet (2026-07-05):
- API: field-level access (read: innloggede) på owner/submittedBy/claimedBy
  i Businesses + submittedBy i Posts/Events/Jobs/PressReleases/Newsletters.
  /api/members gir 403 uinnlogget. Verifisert i prod.
- GraphQL fjernet: route-filene src/app/(payload)/api/graphql/ og
  graphql-playground/ slettet. POST /api/graphql → 404 i prod.
- Kontaktinfo skjult for høstere: e-post/telefon rendres ikke i server-HTML;
  KontaktReveal-komponent + GET /api/bedrift/[slug]/kontakt (kun phone/email,
  kun publiserte, én orgnr per kall).
- Sikkerhetsheadere i Caddy: X-Frame-Options, nosniff, Referrer-Policy,
  Permissions-Policy, HSTS (1 år), -Server. CSP i REPORT-ONLY med kartlagte
  kilder (webkameraer, Open-Meteo, OpenStreetMap).

Drift (2026-07-05):
- Inkrementell synk fikset: oppdateringer-endepunktet bruker parameter
  «dato» (ikke «oppdatertEtter»). HTTP-feil fra oppdateringer-kall telles
  nå i result.errors. Verifisert i prod: 0 feil.
- Cron på host: 03:30 backup (fantes), 04:30 daglig inkrementell BRREG-synk
  (med cp av scripts/ først — mappa overlever ikke rebuild), søndag 05:00
  docker system prune -af. Logger: /var/log/brreg-sync.log og
  /var/log/docker-prune.log.

### 2026-07-05 — Anbudsmodul (Doffin) v1

- Ny collection Tenders (UTEN drafts — offisielle synk-data, ingen
  godkjenningsflyt, dermed ingen versjonstabell). Migrasjon
  20260705_061342_doffin_tenders.
- Doffin-synk: scripts/doffin-sync.ts mot Doffins webclient-API (uoffisielt
  — kan endres uten varsel; synken feiler da kontrollert med logg).
  Søk gir IKKE CPV — detaljendepunktet kalles én gang per NYTT anbud.
  Facet-format: objekt {location: {checkedItems}}, 1-indeksert "page",
  sortBy: 'RELEVANCE'. Kunngjøringstyper oversettes til norsk før visning.
- /anbud: offentlig liste, kun Nordland (NUTS-kode verifisert mot faktisk
  respons — første forsøk NO082+NO072 dro inn Troms).
- Cron 04:45 daglig → /var/log/doffin-sync.log.
- CPV↔NACE-mapping klar i src/lib/doffin/cpv.ts (CPV_TO_NACE_SECTION) —
  fundament for matching bedrift↔anbud (neste trinn).

### 2026-07-05 — tillegg: Anbud trinn 2 (matching)

- "Aktuelle anbud for din bedrift" på Min side for verifiserte bedrifter.
- src/lib/doffin/match.ts: SN2007-tabell (NACE-divisjon → seksjon A–U),
  naceSeksjonFraKode (NaN-safe, regel 10), matching via CPV_TO_NACE_SECTION
  mot anbudets hoved- + tilleggskoder. Maks 10, frist-guard, sortert på frist.
- VIKTIG lærdom: NACE og CPV deler divisjonsnumre men IKKE betydning
  (NACE 45 = bilhandel/G, CPV 45 = bygg/F) — aldri sammenlign koder direkte,
  alltid via mappingtabellene.
- Matching er på seksjonsnivå i v1 (grov, ærlig). Finkorning til
  divisjonsnivå er kjent forbedring.

### 2026-07-05 — tillegg: Regnskapsmodul + opprydding

- Regnskap-collection (UTEN drafts — offisielle synk-data), migrasjon
  20260705_100347_regnskap. Felter: orgnr, aar (unik kombinasjon),
  omsetning, driftsresultat, aarsresultat, egenkapital, valuta, hentetDato.
- Synk scripts/regnskap-sync.ts mot Regnskapsregisterets åpne API
  (data.brreg.no). Støtter --kommune og --limit for kontrollert testing.
  Prod: 5004 regnskap, ~45% hoppet over (ingen innlevert data — normalt),
  5 feil = HTTP 500 fra API-et selv (fanges neste kjøring).
- Visning: "Nøkkeltall (ÅÅÅÅ)" i Registerdata-boksen på bedriftssiden,
  norsk tallformat. Ingen regnskap → ingen rad.
- Månedlig cron: 1. i måneden kl 05:15 → /var/log/regnskap-sync.log.
- Deployet samtidig (lå ucommittet lokalt): anbudsmatching på Min side,
  "5 siste anbud" på /bedrifter, anbuds-badger på bransjekategorier.

Lærdommer:
- API-parsing: Regnskapsregisterets respons er dypt nøstet — map mot
  FAKTISK respons, aldri antatte feltstier. Første versjon ga 34 rader
  med bare null-verdier; oppdaget i admin-lista FØR deploy. Sjekk alltid
  faktiske verdier i admin etter smoke-test, ikke bare feiltall.
- migrate:create etter dev-push er trygt uansett rekkefølge — den ser
  kun på config-vs-historikk-diffen, ikke på data.

HENDELSE + NY REGEL 17:
Claude Code bygde anbudsvarsling (trinn 3: tender-digest.ts, e-postmaler,
Members-felt, OG automatisk sending i doffin-synken) UTEN bestilling.
Neste nattlige cron ville sendt utestet e-post til medlemmer. Oppdaget
via git status-sjekk før commit. Sending nå bak TENDER_DIGEST_ENABLED
(default av).
REGEL 17: Bygg ALDRI funksjonalitet utover bestillingen. Ubestilt kode
i git status = stopp, rapportér, avklar før commit. E-postsending og
andre utadrettede handlinger skal ALLTID bak env-brems i første runde.

### 2026-07-05 — Forsidedesign + ny widget

**Forsiden fullstendig redesignet — NAV/Aksel-stil**
- Inspirasjon: arbeidsplassen.nav.no. Nøkkelord: kompakt, rolig, oppgaveorientert.
- Beholdt palett (fjord/sea/fog/sun) og fonter (Fraunces/Hanken Grotesk), men
  adoptert NAVs layout-prinsipper: én maks-bredde (`max-w-[1200px]`), konsistent
  `py-12` mellom seksjoner, flate flater (maks `shadow-sm`), ingen fargebånd.
- Struktur `src/app/(frontend)/page.tsx`:
  1. **Hero** — kompakt (`py-10/14`), H1 + undertekst + søkefelt + vær/strøm-strip.
     Ingen stor fjord-bakgrunn. `ForsideSearch` fikset for lys bakgrunn
     (`border border-ink/20 bg-white`, mørk tekst).
  2. **Inngangskort** — 4 klikkbare kort (Bedrifter, Anbud, Stillinger, Arrangementer)
     med Heroicons-ikoner. `grid-cols-2 sm:grid-cols-4`.
  3. **Fremhevet sone** (full bredde) — ny admin-konfigurerbar sone fra WidgetAreas.
     Støtter alle `layoutBlocks` inkl. `FeaturedPostsBlock` (plukk ut ekslusive
     artikler fra CMS). Posts populeres via `depth:1` i globalfetchen — ingen
     ekstra DB-kall. Skjemaendring: nytt `fremhevet`-felt i `src/globals/Sidebar.ts`.
     Eieren kjører `npx payload migrate:create fremhevet-sone`.
  4. **Innhold + sidefelt** — to-kolonne grid (`lg:grid-cols-[1fr_340px]`).
     Venstre: Siste historier (3, `getLatestPosts`) + Midten-sone (admin) +
     Kommende arrangementer. Høyre: sticky sidefelt (admin `sidefelt`-sone,
     fallback til hardkodet `WebcamWeatherWidget`).
  5. **Bunn-sone** — full bredde, 3-kolonners grid, kompakt variant (admin).
  6. **CTA-stripe** — «Driver du bedrift på Helgeland?» med lenker til /bedrifter
     og /min-side. Flat lys stil (fjord-knapp, border-knapp).
- Hardkodet «Siste offentlige anbud» og «Ledige stillinger» fjernet fra forsiden —
  vises nå KUN hvis admin legger dem i en widget-sone.
- Alle tre WidgetAreas-soner (sidefelt, midten, bunn) hentes i én `findGlobal`
  parallelt med øvrig data. `RenderBlocks` brukes for sonene.

**AnbudWidget — ny widget**
- `src/components/widgets/AnbudWidget.tsx` — async server-komponent.
  Props: `title?`, `count?: 1–20` (std 5), `variant?: 'full'|'kompakt'`.
  Henter aktive anbud (`status='ACTIVE'`, `deadline > now`) fra egen `tenders`-
  collection via `getPayloadClient()`. Full: tittel + oppdragsgiver + frist.
  Kompakt: tittel + frist. `return null` ved tom liste.
- `src/blocks/index.ts` — `AnbudBlock` (slug: `anbud`) lagt til i `layoutBlocks`
  og `widgetBlocks`.
- `src/components/RenderBlocks.tsx` — håndterer `'anbud'`.
- **SKJEMAENDRING** — ny blokk-tabell for anbud i PostgreSQL.
  Eieren kjører `npx payload migrate:create anbud-widget`.

**Stillinger-sider — visuell konsistens**
- `src/app/(frontend)/stillinger/page.tsx` og `stillinger/[slug]/page.tsx`:
  - Jobbtitler: `font-serif` lagt til (var sans-serif, skilte seg ut fra resten).
  - H1/H2-farger: `text-sea` → `text-fjord` (primærfarge på headings er fjord).
  - Kortbeholdere: `bg-paper ring-1 ring-ink/5 rounded-2xl` → `border border-ink/10 bg-white rounded-xl`.
  - Hover: `hover:bg-ink/[0.02]` → `hover:bg-fog/60`.
  - Søknadsknapp: `bg-sea` → `bg-fjord` (konsistent med andre primærknapper).
  - Etiketter på detaljside: `bg-ink/5` → `border border-ink/10` (flat stil).

**HeroStrip — vær roterer, strøm er statisk**
- `src/components/HeroStrip.tsx` — klientkomponent med useState/useEffect.
  Roterer mellom vær-items (én per Helgeland-by) med fade-effekt hvert 5. sek (250 ms fade).
  Returnerer `<span>`, ikke `<p>` — sitter inline ved siden av strømpris-span i forsidehen.
- `src/app/(frontend)/page.tsx` — `fetchHeroPower()` og `fetchHeroWeather()` kjøres
  parallelt (Promise.all). Strømpris vises som statisk `<span>`. Kun vær-items sendes
  til `<HeroStrip>`. 4 byer: Brønnøysund, Sandnessjøen, Mosjøen, Mo i Rana.

**Skipstrafikk-widget (Kystverket NAIS)**
- `src/components/widgets/ShipTrafficWidget.tsx` — ikke-async server-komponent.
  Embed av Kystverkets offisielle AIS-kart for Helgelandskysten (bbox 9.5–17.5°E,
  63.5–67.8°N). `loading="lazy"` — iframen lastes ikke ved sidelast, kun ved scroll.
  Høyde: 300 px mobil / 420 px desktop. Kildelinje med lenke til nais.kystverket.no.
- Plassert som egen full-bredde seksjon på forsiden mellom innholds-/sidefelt-seksjonen
  og bunn-sonen.
- Caddyfile CSP `frame-src` utvidet med `https://nais.kystverket.no`.
  **Husk: `docker compose restart caddy` på serveren etter deploy (regel 14).**

**Kryssinnholds-søk — /api/sok**
- `src/app/api/sok/route.ts` — GET med `?q=` (min 2 tegn). Søker parallelt
  (Promise.allSettled) i: Businesses (published + showOnPublicListing), Events
  (published + fremtidige), Jobs (published), Posts (published), Tenders (ACTIVE +
  frist > now). Maks 5 treff per type. Ingen sensitive felt i svaret (ingen
  owner/submittedBy/claimedBy). `overrideAccess: true` + `depth: 0` på synk-collections.
- `src/components/ForsideSearch.tsx` — fullstendig omskrevet til live-søk:
  debounce 300 ms, fra 2 tegn. Resultater gruppert under overskrifter
  (Bedrifter / Arrangementer / Stillinger / Artikler / Anbud). Dropdown lukkes
  ved klikk utenfor. Anbud åpner eksternt (doffinUrl, target=_blank). Tastatur-
  navigasjon: ArrowUp/Down beveger markøren, Enter navigerer til valgt treff,
  Escape lukker dropdown.

## GJENSTÅR
- Anbudsvarsling: bevisst test bak TENDER_DIGEST_ENABLED=true
- Bransje-percentiler Helgeland (SQL over regnskap per nace_category —
  fundament for KI-sammendrag + egen "Topp X%"-badge-verdi)
- KI-sammendrag per bedrift (Claude API, stram tallbasert prompt,
  genereres ved månedlig synk, tydelig merket som KI + kildeår)
- Regnskap trinn 2: vis historikk (flere år) etter at månedlig synk har
  akkumulert data over tid
- CSP: observer Report-Only noen dager → bytt til enforced i Caddyfile
- Rate limiting: skjemaer (claim, innsending, kontakt-endepunktet) OG
  /api/sok (er offentlig, ingen autentisering — bør ha IP-basert throttle)
- DB-passordbytte (ble eksponert i chat; lav risiko, port ikke publisert)
- Min side: vis pending claims («venter på godkjenning»)
- Død admin-knapp «Full nedlasting» — feilsøk eller fjern
- applefavicon.png mangler i public/ (kosmetisk, spammer dev-logg)
- Matching finkorning: divisjonsnivå + evt. vis på fremhevede profiler
- Vurder langsiktig: Doffins offisielle subscription-API hvis webclient-
  API-et endrer seg
- Migrasjoner som gjenstår å kjøre: `fremhevet-sone`, `anbud-widget`