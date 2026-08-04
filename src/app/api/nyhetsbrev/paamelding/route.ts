import { randomBytes } from 'node:crypto'
import { getPayloadClient } from '@/lib/getPayload'
import { checkRateLimit, getClientIp, LIMITS, rateLimitResponse } from '@/lib/rate-limit'
import { bekreftPaameldingHtml } from '@/lib/email/templates'

export const dynamic = 'force-dynamic'

function isValidEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)
}

// Nøytral suksessrespons — avslører ikke om adressen finnes fra før (personvern)
const OK = () => Response.json({ ok: true })

export async function POST(req: Request) {
  const ip = getClientIp(req)
  const rl = checkRateLimit(`nyhetsbrev:${ip}`, LIMITS.NYHETSBREV)
  if (!rl.ok) return rateLimitResponse('/api/nyhetsbrev/paamelding', ip, rl.retryAfter!)

  let body: { epost?: string; fra?: string }
  try { body = await req.json() } catch {
    return Response.json({ error: 'Ugyldig forespørsel.' }, { status: 400 })
  }

  const epost = typeof body.epost === 'string' ? body.epost.trim().toLowerCase() : ''
  if (!epost || !isValidEmail(epost)) {
    return Response.json({ error: 'Ugyldig e-postadresse.' }, { status: 400 })
  }

  const paameldtFra = typeof body.fra === 'string' ? body.fra.slice(0, 200) : ''
  const payload = await getPayloadClient()

  // Sjekk om adressen allerede finnes
  const { docs } = await payload.find({
    collection: 'abonnenter',
    where: { epost: { equals: epost } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  let bekreftToken: string

  if (docs.length > 0) {
    const abonnent = docs[0] as any

    // Allerede aktiv: nøytral respons — avslør ikke at adressen er registrert
    if (abonnent.status === 'aktiv') return OK()

    // Venter bekreftelse eller avmeldt: generer nye tokens og send bekreftelse på nytt
    bekreftToken = randomBytes(32).toString('hex')
    await payload.update({
      collection: 'abonnenter',
      id: abonnent.id,
      data: {
        status: 'venter_bekreftelse',
        bekreftToken,
        avmeldToken: randomBytes(32).toString('hex'),
        paameldtFra: paameldtFra || abonnent.paameldtFra,
        samtykkeTidspunkt: null,
      } as any,
      overrideAccess: true,
    })
  } else {
    // Ny abonnent
    bekreftToken = randomBytes(32).toString('hex')
    try {
      await payload.create({
        collection: 'abonnenter',
        data: {
          epost,
          status: 'venter_bekreftelse',
          bekreftToken,
          avmeldToken: randomBytes(32).toString('hex'),
          paameldtFra,
        } as any,
        overrideAccess: true,
      })
    } catch (err: any) {
      // Sjanse for race-condition med duplikat er minimal; returner nøytral
      const msg = String(err?.message ?? '')
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('already')) {
        return OK()
      }
      throw err
    }
  }

  // Send bekreftelses-e-post — transaksjonell handling, ingen env-brems
  try {
    await payload.sendEmail({
      to: epost,
      subject: 'Bekreft påmeldingen din til Uka på Helgeland',
      html: bekreftPaameldingHtml(bekreftToken),
    })
  } catch (err: any) {
    payload.logger.error({ msg: '[nyhetsbrev/paamelding] sendEmail feilet', err })
    return Response.json({ error: 'Kunne ikke sende bekreftelses-e-post. Prøv igjen.' }, { status: 500 })
  }

  return OK()
}
