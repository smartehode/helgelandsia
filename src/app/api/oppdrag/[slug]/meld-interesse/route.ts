import { headers as getHeaders } from 'next/headers'
import { getPayloadClient } from '@/lib/getPayload'
import { getCategoryById } from '@/lib/businesses/categories'
import { oppdragInteresseHtml } from '@/lib/email/templates'
import { bizUrl } from '@/lib/slug'

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://helgelandsia.no'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params
  const payload = await getPayloadClient()

  // Auth: kun innloggede members
  const { user }: any = await payload.auth({ headers: await getHeaders() })
  if (!user || user.collection !== 'members') {
    return Response.json({ error: 'Du må være innlogget.' }, { status: 401 })
  }

  // Valider bizId fra body
  let bizId: number
  try {
    const body = await req.json()
    const parsed = Number(body?.bizId)
    // NaN-guard (regel 10)
    if (!Number.isInteger(parsed) || parsed <= 0) {
      return Response.json({ error: 'Ugyldig bedrift-ID.' }, { status: 400 })
    }
    bizId = parsed
  } catch {
    return Response.json({ error: 'Ugyldig forespørsel.' }, { status: 400 })
  }

  // Hent oppdrag (overrideAccess for interessert-feltet)
  const { docs } = await payload.find({
    collection: 'oppdrag',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  const oppdrag: any = docs[0]
  if (!oppdrag) {
    return Response.json({ error: 'Oppdraget finnes ikke.' }, { status: 404 })
  }

  // Sjekk at bedriften tilhører denne member og er verified
  const biz: any = await payload.findByID({
    collection: 'businesses',
    id: bizId,
    depth: 0,
    overrideAccess: true,
  })
  if (!biz) {
    return Response.json({ error: 'Bedriften finnes ikke.' }, { status: 404 })
  }
  const ownerId = typeof biz.owner === 'object' ? biz.owner?.id : biz.owner
  if (Number(ownerId) !== user.id || biz.claimStatus !== 'verified') {
    return Response.json({ error: 'Du har ikke tilgang til denne bedriften.' }, { status: 403 })
  }

  // Kategori-match: bedrift og oppdrag må dele kategori
  if (biz.naceCategory !== oppdrag.kategori) {
    return Response.json({ error: 'Bedriftens bransje matcher ikke dette oppdraget.' }, { status: 400 })
  }

  // Duplikat-sjekk: kan ikke melde interesse to ganger
  const interessert: any[] = oppdrag.interessert ?? []
  const alleredeInteressert = interessert.some((entry: any) => {
    const id = typeof entry.bedrift === 'object' ? entry.bedrift?.id : entry.bedrift
    return Number(id) === bizId
  })
  if (alleredeInteressert) {
    return Response.json({ error: 'Du har allerede meldt interesse for dette oppdraget.' }, { status: 409 })
  }

  // Legg til i interessert-lista
  const nyListe = [...interessert, { bedrift: bizId }]
  await payload.update({
    collection: 'oppdrag',
    id: oppdrag.id,
    data: { interessert: nyListe } as any,
    overrideAccess: true,
  })

  // Send e-post til oppdragsgiver (kontaktinfo hentes server-side — aldri eksponert)
  try {
    const submittedById = typeof oppdrag.submittedBy === 'object'
      ? oppdrag.submittedBy?.id
      : oppdrag.submittedBy
    if (Number.isInteger(Number(submittedById)) && Number(submittedById) > 0) {
      const member: any = await payload.findByID({
        collection: 'members',
        id: submittedById,
        depth: 0,
        overrideAccess: true,
      })
      if (member?.email) {
        const cat = getCategoryById(oppdrag.kategori)
        const bedriftUrl = `${BASE_URL}${bizUrl(biz)}`
        await payload.sendEmail({
          to: member.email,
          subject: `${biz.name} er interessert i ditt oppdrag`,
          html: oppdragInteresseHtml({
            oppdragTittel: oppdrag.tittel,
            bedriftNavn: biz.name,
            bedriftUrl,
            bedriftTelefon: biz.phone ?? null,
            bedriftEpost: biz.email ?? null,
            oppdragUrl: `${BASE_URL}/oppdrag/${slug}`,
          }),
        })
      }
    }
  } catch (err: any) {
    payload.logger.error({ msg: 'meld-interesse email failed', err })
    // Ikke returner feil — interessen er allerede logget
  }

  return Response.json({ ok: true })
}
