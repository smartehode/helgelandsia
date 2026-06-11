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