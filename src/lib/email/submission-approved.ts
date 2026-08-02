import type { Payload } from 'payload'
import { submissionApprovedHtml } from './templates'

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'https://helgelandsia.no'

const COLLECTION_META: Record<string, { type: string; path: string; titleField?: string }> = {
  events:            { type: 'arrangement',  path: '/arrangementer' },
  posts:             { type: 'artikkel',     path: '/leserinnlegg' },
  businesses:        { type: 'bedrift',      path: '/bedrifter' },
  jobs:              { type: 'stilling',     path: '/stillinger' },
  'press-releases':  { type: 'pressemelding', path: '/pressemeldinger' },
  newsletters:       { type: 'nyhetsbrev',   path: '/nyhetsbrev' },
  oppdrag:           { type: 'oppdrag',      path: '/oppdrag', titleField: 'tittel' },
}

export async function notifySubmissionApproved(
  payload: Payload,
  collection: string,
  doc: any,
): Promise<void> {
  try {
    const meta = COLLECTION_META[collection]
    if (!meta || !doc.submittedBy || !doc.slug) return

    const titleField = meta.titleField ?? 'title'
    const title: string = doc[titleField] ?? doc.title ?? doc.name ?? '(uten tittel)'
    const memberId = typeof doc.submittedBy === 'object' ? doc.submittedBy?.id : doc.submittedBy
    if (!memberId) return

    const member: any = await payload.findByID({ collection: 'members', id: memberId, depth: 0 })
    if (!member?.email) return

    const url = `${BASE_URL}${meta.path}/${doc.slug}`
    await payload.sendEmail({
      to: member.email,
      subject: 'Innholdet ditt er publisert på Helgelandsia',
      html: submissionApprovedHtml({
        name: member.name ?? '',
        contentType: meta.type,
        title,
        url,
      }),
    })
  } catch (err) {
    payload.logger.error({ msg: 'notifySubmissionApproved failed', err })
  }
}

export function afterChangeApproved(collection: string) {
  return async ({ doc, previousDoc, operation, req }: any): Promise<void> => {
    if (
      operation === 'update' &&
      doc._status === 'published' &&
      previousDoc?._status !== 'published' &&
      doc.submittedBy
    ) {
      await notifySubmissionApproved(req.payload, collection, doc)
    }
  }
}
