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
1. Nye collections: stillinger, pressemeldinger, nyhetsbrev (+ skjemaer på /min-side)
2. Deling på sosiale medier: OG-metadata + delingsknapper på arrangement/artikkel
3. Moduler fra gammel portal (nasdag.no/portal/lg): strømpriser NO4, vær,
   avganger (Entur/Avinor), NAV-stillinger, BRREG, politilogg m.m.
   (eieren har kildekoden — be om den)
4. Senere: Facebook/Apple-innlogging, e-postverifisering + SMTP,
   re-opplasting av tapte mediebilder, ev. Hetzner Object Storage for media