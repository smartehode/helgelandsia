# Deploy til Hetzner Cloud

Dette setter opp portalen på en Hetzner Cloud-server (VPS) med Docker Compose:
app + PostgreSQL + automatisk HTTPS via Caddy.

> Merk: Dette gjelder **Hetzner Cloud** (en server du har SSH-tilgang til).
> Hetzner *Webhosting* (delt cPanel-hosting) støtter ikke Node-apper.

---

## 0. Legg deploy-filene i prosjektet

Kopier disse fire filene inn i rotmappa til prosjektet (samme sted som
`package.json`): `Dockerfile`, `.dockerignore`, `docker-compose.yml`, `Caddyfile`.

Gjør én liten endring i `payload.config.ts` slik at databasetabellene
opprettes automatisk i produksjon. Finn `db: postgresAdapter({ ... })` og legg
til `push: true`:

```ts
db: postgresAdapter({
  pool: { connectionString: process.env.DATABASE_URI },
  push: true,
}),
```

(Senere, når portalen er i drift, bør du bytte til migrasjoner i stedet for
`push` – men dette er den enkleste starten.)

---

## 1. Opprett serveren i Hetzner Cloud Console

- Ny server → **Ubuntu 24.04**, type **CX22** (2 vCPU / 4 GB) holder fint til start.
- Legg til SSH-nøkkelen din under opprettelsen.
- Noter serverens **IPv4-adresse**.

## 2. Brannmur

Lag en Cloud Firewall (eller bruk `ufw` på serveren) som slipper inn:
- **22** (SSH), **80** (HTTP), **443** (HTTPS).

## 3. Pek domenet mot serveren

Hos domeneleverandøren din: lag en **A-record** som peker
`portal.dittdomene.no` til serverens IPv4. Vent til DNS har slått igjennom
(kan ta noen minutter). Caddy trenger dette for å hente SSL-sertifikat.

## 4. Logg inn og installer Docker

```bash
ssh root@DIN_SERVER_IP
curl -fsSL https://get.docker.com | sh
```

## 5. Hent prosjektet opp på serveren

Enklest via GitHub: legg prosjektet i et privat repo og klon det:

```bash
git clone https://github.com/dittbrukernavn/helgeland-portal.git
cd helgeland-portal
```

(Alternativt kan du laste opp mappa med `scp` fra PC-en din.)

## 6. Lag `.env` på serveren

```bash
cp .env.production.example .env
nano .env
```

Fyll inn `DOMAIN`, et sterkt `POSTGRES_PASSWORD` og en lang `PAYLOAD_SECRET`.
Lagre (Ctrl+O, Enter, Ctrl+X).

## 7. Bygg og start

```bash
docker compose up -d --build
```

Første bygg tar noen minutter. Følg med på loggene:

```bash
docker compose logs -f app
```

## 8. Ferdig

Åpne `https://portal.dittdomene.no/admin` og opprett admin-brukeren din.
Caddy har allerede ordnet gyldig HTTPS automatisk.

---

## Oppdatere portalen senere

```bash
git pull
docker compose up -d --build
```

## Bilder/media i produksjon

Anbefalt: **Hetzner Object Storage** (S3-kompatibelt). Opprett en bucket, og fyll
inn `S3_*`-variablene i `.env`. Da lagres bildene utenfor serveren og overlever
oppdateringer og omstarter. Koden støtter dette allerede.

## Sikkerhetskopi av databasen

```bash
docker compose exec db pg_dump -U postgres helgeland > backup_$(date +%F).sql
```
