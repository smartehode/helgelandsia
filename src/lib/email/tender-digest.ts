import type { Payload } from 'payload'
import { erAktueltAnbud, naceSeksjonFraKode } from '../doffin/match'
import { tenderDigestHtml } from './templates'

type BizEntry = { name: string; tenders: any[] }

export async function sendTenderDigests(
  payload: Payload,
  newTenders: any[],
): Promise<{ notified: number }> {
  if (newTenders.length === 0) return { notified: 0 }

  // Hent alle verifiserte bedrifter med eier og NACE-kode
  const bizRes = await payload.find({
    collection: 'businesses',
    where: {
      and: [
        { claimStatus: { equals: 'verified' } },
        { owner: { exists: true } },
        { naceKode: { exists: true } },
      ],
    },
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })
  const businesses: any[] = bizRes.docs
  if (businesses.length === 0) return { notified: 0 }

  // Bygg: ownerId → Map<bizId, BizEntry>
  const digests = new Map<number, Map<number, BizEntry>>()

  for (const tender of newTenders) {
    for (const biz of businesses) {
      // NaN-guard (regel 10): owner er numerisk ID ved depth:0
      const ownerId: number | undefined = typeof biz.owner === 'number' ? biz.owner : undefined
      if (!ownerId) continue

      const seksjon = naceSeksjonFraKode(biz.naceKode)
      if (!seksjon) continue
      if (!erAktueltAnbud(tender, seksjon)) continue

      if (!digests.has(ownerId)) digests.set(ownerId, new Map())
      const ownerMap = digests.get(ownerId)!
      if (!ownerMap.has(biz.id)) ownerMap.set(biz.id, { name: biz.name ?? '(uten navn)', tenders: [] })
      ownerMap.get(biz.id)!.tenders.push(tender)
    }
  }

  if (digests.size === 0) return { notified: 0 }

  let notified = 0

  for (const [ownerId, bizMap] of digests) {
    try {
      // Sjekk opt-out — hent member (NaN-guard: ownerId er allerede validert over)
      const member: any = await payload.findByID({
        collection: 'members',
        id: ownerId,
        depth: 0,
        overrideAccess: true,
      })
      if (!member?.email) continue
      if (member.anbudsvarsling === false) continue  // eksplisitt opt-out

      const entries = Array.from(bizMap.values()).map(({ name, tenders }) => ({
        businessName: name,
        tenders: tenders.map((t: any) => ({
          title: t.title ?? '(uten tittel)',
          buyerName: t.buyerName ?? 'Ukjent oppdragsgiver',
          deadline: t.deadline ?? null,
          doffinUrl: t.doffinUrl ?? 'https://doffin.no',
        })),
      }))

      const totalCount = entries.reduce((s, e) => s + e.tenders.length, 0)
      const firstName = entries[0].businessName
      const subject = totalCount === 1
        ? `1 nytt anbud som kan passe for ${firstName}`
        : `${totalCount} nye anbud som kan passe for din bedrift på Helgelandsia`

      await payload.sendEmail({
        to: member.email,
        subject,
        html: tenderDigestHtml({ name: member.name ?? '', entries }),
      })
      notified++
    } catch (err) {
      payload.logger.error({ msg: '[Doffin] tender-digest: e-post feilet', ownerId, err })
    }
  }

  return { notified }
}
