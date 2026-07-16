import { getPayloadClient } from './getPayload'

// Samlede spørringer som brukes flere steder.

export async function getFeaturedPosts(limit = 3) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { featured: { equals: true }, _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit,
    depth: 1,
  })
  return docs
}

export async function getLatestPosts(limit = 9, page = 1) {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'posts',
    where: { _status: { equals: 'published' } },
    sort: '-publishedAt',
    limit,
    page,
    depth: 1,
  })
}

export async function getPostBySlug(slug: string) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: { slug: { equals: slug }, _status: { equals: 'published' } },
    limit: 1,
    depth: 2,
  })
  return docs[0] ?? null
}

// Midnight of the current day in Europe/Oslo, expressed as UTC.
// Events without endDate are shown all day in Oslo local time.
function osloTodayMidnight(): Date {
  const osloDate = new Date().toLocaleDateString('sv', { timeZone: 'Europe/Oslo' }) // 'YYYY-MM-DD'
  const utcMidnight = new Date(osloDate + 'T00:00:00Z')
  const osloOffsetHours = +new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Oslo', hour: 'numeric', hour12: false,
  }).format(utcMidnight)
  return new Date(utcMidnight.getTime() - osloOffsetHours * 3_600_000)
}

// Active = starts today/future OR has a future endDate (ongoing multi-day events).
// Featured events sorted first, then by startDate ascending.
export async function getUpcomingEvents(limit = 50) {
  const payload = await getPayloadClient()
  const nowISO = new Date().toISOString()
  const todayISO = osloTodayMidnight().toISOString()
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { or: [
          { startDate: { greater_than_equal: todayISO } },
          { endDate: { greater_than_equal: nowISO } },
        ]},
      ],
    },
    sort: 'startDate',
    limit,
    depth: 1,
  })
  return (docs as any[]).sort((a, b) => {
    if (a.featured && !b.featured) return -1
    if (!a.featured && b.featured) return 1
    return new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  })
}

// Past = started before today AND (no endDate OR endDate already passed).
export async function getPastEvents(limit = 8) {
  const payload = await getPayloadClient()
  const todayISO = osloTodayMidnight().toISOString()
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { startDate: { less_than: todayISO } },
      ],
    },
    sort: '-startDate',
    limit: limit * 3, // fetch extra so JS filter has room
    depth: 1,
  })
  const nowMs = Date.now()
  return (docs as any[])
    .filter(e => !e.endDate || new Date(e.endDate).getTime() < nowMs)
    .slice(0, limit)
}

export async function getFeaturedBusinesses(limit = 6) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'businesses',
    where: { featured: { equals: true }, _status: { equals: 'published' } },
    limit,
    depth: 1,
  })
  return docs
}

export async function getAdsByPlacement(placement: string, limit = 1) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'ads',
    where: { placement: { equals: placement } },
    limit,
    depth: 1,
  })
  return docs
}
