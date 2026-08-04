// In-memory sliding-window rate limiter.
// FORUTSETNING: én app-instans. Redis-backing trengs ved horisontal skalering
// (se CLAUDE.md). Fungerer perfekt i den nåværende single-container-oppsettet.

const store = new Map<string, number[]>()

// Rydd utløpte nøkler hvert 5. minutt slik at Map-en ikke vokser evig.
// Grensen 2 timer er langt over hvert vindu vi bruker.
const MAX_AGE_MS = 2 * 60 * 60_000
let sweepRunning = false

function ensureSweep(): void {
  if (sweepRunning) return
  sweepRunning = true
  const timer = setInterval(() => {
    const cutoff = Date.now() - MAX_AGE_MS
    for (const [key, ts] of store.entries()) {
      const fresh = ts.filter(t => t > cutoff)
      if (fresh.length === 0) store.delete(key)
      else store.set(key, fresh)
    }
  }, 5 * 60_000)
  // Ikke hold prosessen oppe kun på grunn av denne timeren
  timer.unref?.()
}

export interface RateLimitConfig {
  limit: number
  windowMs: number
}

export interface RateLimitResult {
  ok: boolean
  retryAfter?: number // sekunder til vinduet glir forbi
}

// ─── Klient-IP-ekstraksjon ───────────────────────────────────────────────────
//
// Caddy er konfigurert med:
//   header_up X-Forwarded-For {remote_host}
// Dette OVERSKRIVER enhver klient-sendt header med den faktiske IP Caddy ser.
// Vi leser SISTE verdi som ekstra forsvarslag (nærmeste trusted proxy).
// Uten Caddyfile-endringen ville FØRSTE verdi vært spoofbar.
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const parts = xff.split(',').map(s => s.trim()).filter(Boolean)
    return parts[parts.length - 1] ?? 'unknown'
  }
  return 'unknown'
}

// ─── Sliding-window sjekk ────────────────────────────────────────────────────
export function checkRateLimit(key: string, cfg: RateLimitConfig): RateLimitResult {
  ensureSweep()
  const now = Date.now()
  const windowStart = now - cfg.windowMs
  const existing = store.get(key) ?? []
  const inWindow = existing.filter(t => t > windowStart)

  if (inWindow.length >= cfg.limit) {
    // Tid til det eldste treffet i vinduet faller ut
    const retryAfter = Math.ceil((inWindow[0]! + cfg.windowMs - now) / 1000)
    return { ok: false, retryAfter: Math.max(1, retryAfter) }
  }

  inWindow.push(now)
  store.set(key, inWindow)
  return { ok: true }
}

// ─── Ferdige 429-svar ────────────────────────────────────────────────────────
export function rateLimitResponse(endpoint: string, ip: string, retryAfter: number): Response {
  // Én logglinje per avvisning — misbruk synes i docker-loggen
  console.warn(`[rate-limit] 429 ${endpoint} ip=${ip.slice(0, 15)} retry=${retryAfter}s`)
  return new Response(
    JSON.stringify({ error: 'For mange forespørsler — prøv igjen om litt.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
      },
    },
  )
}

// ─── Grenser (justér her) ────────────────────────────────────────────────────
export const LIMITS = {
  AUTH:           { limit: 5,  windowMs: 60_000 }, // innlogging + registrering
  SEARCH:         { limit: 30, windowMs: 60_000 }, // /api/sok
  CONTACT_REVEAL: { limit: 10, windowMs: 60_000 }, // /api/bedrift/*/kontakt
  MELD_INTERESSE: { limit: 10, windowMs: 60_000 }, // /api/oppdrag/*/meld-interesse
  SUBMISSION:     { limit: 10, windowMs: 60_000 }, // alle innsendings-POST
  IMPORT:         { limit: 5,  windowMs: 60_000 }, // arrangement-import + ics-import
  KALENDER:       { limit: 60, windowMs: 60_000 }, // /api/kalender
  NYHETSBREV:     { limit: 3,  windowMs: 60_000 }, // påmelding ukebrev per IP
} satisfies Record<string, RateLimitConfig>
