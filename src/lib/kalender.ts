import { getPayloadClient } from './getPayload'

// Shared types (also defined in CalendarClient.tsx for client-side use)
export interface KalenderArrangement {
  tittel: string
  startIso: string
  sluttIso: string
  slug: string
}

export interface KalenderAnbud {
  tittel: string
  oppdragsgiver: string
  fristIso: string
  url: string
}

export interface KalenderStilling {
  tittel: string
  arbeidsgiver: string
  fristIso: string
  slug: string
}

export interface KalenderOppdrag {
  tittel: string
  kommune: string
  datoIso: string  // createdAt — onsketTidsrom er fritekst, ikke dato
  slug: string
}

export interface KalenderData {
  maned: string
  arrangementer: KalenderArrangement[]
  anbud: KalenderAnbud[]
  stillinger: KalenderStilling[]
  oppdrag: KalenderOppdrag[]
}

export async function hentKalenderData(maned: string): Promise<KalenderData> {
  if (!/^\d{4}-\d{2}$/.test(maned)) {
    return { maned, arrangementer: [], anbud: [], stillinger: [] }
  }

  const [year, month] = maned.split('-').map(Number)
  const monthStart = new Date(year, month - 1, 1)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)
  // Look back 90 days to catch multi-day events that started before this month
  const searchFrom = new Date(monthStart.getTime() - 90 * 86400_000)

  const monthStartISO = monthStart.toISOString()
  const monthEndISO = monthEnd.toISOString()
  const searchFromISO = searchFrom.toISOString()

  const payload = await getPayloadClient()

  const [eventsRes, tendersRes, jobsRes, oppdragRes] = await Promise.allSettled([
    payload.find({
      collection: 'events',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { startDate: { less_than_equal: monthEndISO } },
          { startDate: { greater_than_equal: searchFromISO } },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'tenders',
      where: {
        and: [
          { status: { equals: 'ACTIVE' } },
          { deadline: { greater_than_equal: monthStartISO } },
          { deadline: { less_than_equal: monthEndISO } },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'jobs',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { deadline: { greater_than_equal: monthStartISO } },
          { deadline: { less_than_equal: monthEndISO } },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
    // Oppdrag ankres på publiseringsdato (createdAt) — onsketTidsrom er fritekst
    payload.find({
      collection: 'oppdrag',
      where: {
        and: [
          { _status: { equals: 'published' } },
          { createdAt: { greater_than_equal: monthStartISO } },
          { createdAt: { less_than_equal: monthEndISO } },
        ],
      },
      limit: 200,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const arrangementer: KalenderArrangement[] =
    eventsRes.status === 'fulfilled'
      ? eventsRes.value.docs
          .filter((e: any) => {
            if (!e.startDate) return false
            const evEnd = e.endDate ?? e.startDate
            return new Date(e.startDate) <= monthEnd && new Date(evEnd) >= monthStart
          })
          .map((e: any) => ({
            tittel: e.title ?? '',
            startIso: e.startDate ?? '',
            sluttIso: e.endDate ?? e.startDate ?? '',
            slug: e.slug ?? '',
          }))
      : []

  const anbud: KalenderAnbud[] =
    tendersRes.status === 'fulfilled'
      ? tendersRes.value.docs
          .filter((t: any) => t.deadline)
          .map((t: any) => ({
            tittel: t.title ?? '',
            oppdragsgiver: t.buyerName ?? '',
            fristIso: t.deadline,
            url: t.doffinUrl ?? '',
          }))
      : []

  const stillinger: KalenderStilling[] =
    jobsRes.status === 'fulfilled'
      ? jobsRes.value.docs
          .filter((j: any) => j.deadline)
          .map((j: any) => ({
            tittel: j.title ?? '',
            arbeidsgiver: j.employer ?? '',
            fristIso: j.deadline,
            slug: j.slug ?? '',
          }))
      : []

  const oppdrag: KalenderOppdrag[] =
    oppdragRes.status === 'fulfilled'
      ? oppdragRes.value.docs
          .filter((o: any) => o.createdAt)
          .map((o: any) => ({
            tittel: o.tittel ?? '',
            kommune: o.kommune ?? '',
            datoIso: o.createdAt,
            slug: o.slug ?? '',
          }))
      : []

  return { maned, arrangementer, anbud, stillinger, oppdrag }
}
