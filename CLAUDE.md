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

**E-post for medlemmer (Resend)**
- `src/lib/email/templates.ts` — HTML-e-postmaler med fjord/sea/paper-palett.
  Eksporterer `verifyEmailHtml(token)`, `forgotPasswordHtml(token)`,
  `submissionApprovedHtml({ name, contentType, title, url })`.
- `src/lib/email/submission-approved.ts` — `notifySubmissionApproved(payload, collection, doc)`
  sender «Innholdet ditt er publisert»-e-post til `submittedBy`-member.
  `afterChangeApproved(collection)` returnerer en ferdig `afterChange`-hook som
  detekterer overgang `draft → published`.
- `payload.config.ts` — `resendAdapter` fra `@payloadcms/email-resend` lagt til.
  Aktiveres kun når `RESEND_API_KEY`-env er satt; ellers bruker Payload konsoll-fallback.
- `src/collections/Members.ts` — `auth: true` erstattet med fullt auth-objekt:
  - `verify.generateEmailHTML/Subject` — norsk velkomstmail, lenker til `/verifiser?token=`.
  - `forgotPassword.generateEmailHTML/Subject` — norsk tilbakestillingsmail, lenker til `/nytt-passord?token=`.
  - `beforeChange`-hook: nye Google OAuth-brukere (har `sub`) settes `_verified: true` automatisk.
- `src/app/(frontend)/verifiser/page.tsx` — bekreftelsesside: leser `?token`, kaller
  `payload.verifyEmail({ collection: 'members', token })`, viser suksess 🎉 eller feil.
- `src/app/(frontend)/nytt-passord/page.tsx` + `NyttPassordClient.tsx` — to-stegs flyt:
  1. Uten token: e-postskjema → POST `/api/members/forgot-password`.
  2. Med token: nytt passord-skjema → POST `/api/members/reset-password`.
- `src/components/AuthForm.tsx` — «Glemt passord?»-lenke til `/nytt-passord` lagt til
  under passordfeltet i innloggings-modus.
- Alle 6 innsendings-collections (events, posts, businesses, jobs, press-releases,
  newsletters) fått `hooks.afterChange: [afterChangeApproved(slug)]`.
- **SKJEMAENDRING** — `auth.verify` legger til `_verified` og `_verificationToken`-
  kolonner på members-tabellen. Eieren kjører:
  `npx payload migrate:create verify-members`
  og leser filen (sjekk at ingen DROP) før commit.
- **VIKTIG FOR DEPLOY** — eksisterende produksjonsmedlemmer må settes som verifisert
  ETTER at migrasjonen har kjørt på serveren, men FØR man forventer at de skal kunne
  logge inn. Kjør dette på prod-databasen:
  ```sql
  UPDATE members SET "_verified" = true WHERE "_verified" IS NULL OR "_verified" = false;
  ```

**Rettelser: e-postadapter og innloggingsfeil**
- `payload.config.ts` — `resendAdapter` registreres nå alltid (ikke betinget av
  `RESEND_API_KEY`). `parseEmailFrom()` parser `"Navn <adresse@dom.no>"` til separate
  `defaultFromName`/`defaultFromAddress`-felt; faller tilbake til Resend sandbox-adresse
  hvis env mangler. `onInit` logger `Email adapter: Resend, from=…` ved oppstart.
- `src/components/AuthForm.tsx` — tre rettelser:
  1. Etter vellykket registrering (201) prøves ikke auto-innlogging lenger — viser
     grønt panel «Konto opprettet — sjekk innboksen din» med e-postadressen synlig.
  2. Ny `unverifiedEmail`-state: ved 403 fra `/api/members/login` (eller melding med
     «not verified») vises amber-panel «E-posten er ikke bekreftet» med adressen.
     «Tilbake til innlogging»-knapp nullstiller tilstanden.
  3. Serverens feilmelding (`errors[0].message`) vises ved 4xx på registrering;
     andre innloggingsfeil viser «Feil e-post eller passord» som fallback.