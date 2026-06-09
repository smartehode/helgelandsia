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

export async function getUpcomingEvents(limit = 6) {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'events',
    where: {
      _status: { equals: 'published' },
      startDate: { greater_than_equal: new Date().toISOString() },
    },
    sort: 'startDate',
    limit,
    depth: 1,
  })
  return docs
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
