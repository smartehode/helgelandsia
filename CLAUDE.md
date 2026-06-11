# Helgelandsia — regional portal for Helgeland

Nettsted: https://helgelandsia.no · Repo: smartehode/helgelandsia (privat)
Eieren er nybegynner — forklar tydelig, ett steg om gangen, på norsk.

## Formål
Dele og finne informasjon om Helgeland: arrangementer, historier/artikler,
bedrifter, og (planlagt) stillinger, pressemeldinger, nyhetsbrev.
Medlemmer (publikum) sender inn innhold via skjemaer på /min-side;
alt godkjennes av redaksjonen i admin før publisering.

## Stack
- Next.js 15.4.11 (App Router) — versjonen er PINNET, ikke oppgrader uten videre
  (Payload 3.85 peer-range utelukker 15.5.x)
- Payload CMS 3 (kjører inne i Next.js), PostgreSQL, Tailwind CSS
- Design: «kald sjø, varm sol» — fjord/sea/fog/sun-palett i tailwind.config.ts,
  fonter Fraunces (serif) + Hanken Grotesk (sans)

## Arkitektur — viktige valg
- To brukergrupper: `users` (stab, admin-tilgang) og `members` (publikum,
  ALDRI admin-tilgang — access.admin: () => false). Ikke bland dem.
- Innsending fra medlemmer: route handlers under src/app/(frontend)/innsending/*
  bruker Local API (payload.create med draft: true, _status: 'draft',
  submittedBy: medlem). Godkjenning = Publiser i admin. Offentlige sider
  viser kun _status: 'published'.
- Google-innlogging via payload-oauth2 (src/oauth/google.ts) mot members.
  Etter OAuth lander brukeren på /innlogget som videresender til /min-side
  (cookie-timing). Plugin deaktiveres automatisk uten GOOGLE_CLIENT_ID/SECRET
  (slik er det lokalt).
- TypeScript-byggfeil ignoreres i next.config.mjs (ignoreBuildErrors) — arv.

## Arbeidsflyt (VIKTIG)
- All utvikling skjer LOKALT (denne mappen). ALDRI rediger filer på serveren.
- Lokal kjøring: Docker Desktop → `docker start helgelandsia-db` → `npm run dev`
- Skjemaendringer (nye collections/felt): test lokalt (dev-push oppdaterer
  lokal DB selv), deretter `npx payload migrate:create <navn>` → commit.
  Serveren kjører `payload migrate` automatisk ved oppstart.
- Deploy: git push, deretter på serveren (ssh root@91.99.116.201):
  `cd ~/helgelandsia && git pull && docker compose up -d --build`
- .env committes ALDRI (hemmeligheter). Lokal .env har lokale verdier.
- Kjør `docker system prune -af` på serveren før store ombygginger (liten disk).

## Veikart
1. ~~Nye collections: stillinger, pressemeldinger, nyhetsbrev (+ skjemaer på /min-side)~~ FERDIG
2. Deling på sosiale medier: OG-metadata + delingsknapper på arrangement/artikkel
3. Moduler fra gammel portal (nasdag.no/portal/lg): strømpriser NO4, vær,
   avganger (Entur/Avinor), NAV-stillinger, BRREG, politilogg m.m.
   (eieren har kildekoden — be om den)
4. Senere: Facebook/Apple-innlogging, e-postverifisering + SMTP,
   re-opplasting av tapte mediebilder, ev. Hetzner Object Storage for media

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